// Pure generation jobs, shared by the Web Worker and the main-thread fallback.
import { MESH_MAX, MESH_MIN, MESH_RES, SOLID_LOW_TRIS, STACK, type PartQuality } from './constants';
import { decimate, flatten } from './decimate';
import { meshVolume, surfaceNets } from './mesher';
import { createInfillField, createOptimizedField, createSolidField } from './sdf';
import { buildSdfVolume } from './sdfVolume';
import { Slicer } from './slicer';
import { buildSliceStack, stackBuffers, type StackPayload } from './sliceStack';
import { optimizedStress, smoothAndNormalise, solidStress } from './stress';
import { buildToolpath, toolpathBuffers, type Toolpath } from './toolpath';

/** The infill lattice is meshed as two x halves in parallel (it is the slowest job). */
export type JobKind = 'solid' | 'optimized' | 'infill0' | 'infill1' | 'sdf';

/** Where the two infill halves meet (mm); chosen so both take about as long. */
const INFILL_SPLIT_X = 2;

export type MeshPayload = {
  positions: Float32Array;
  normals: Float32Array;
  index?: Uint32Array;
  stress?: Float32Array;
};

export type JobResult = {
  kind: JobKind;
  meshes: Partial<Record<'solid' | 'solidLow' | 'optimized' | 'infill', MeshPayload>>;
  volumes: Partial<Record<'solid' | 'optimized' | 'infill', number>>;
  /** 64^3 half floats of sdOptimized (sdf job only). */
  sdf?: Uint16Array;
  timings: Record<string, number>;
};

/** Messages the part worker understands. */
export type WorkerRequest =
  | { id: number; type: 'job'; kind: JobKind; quality: PartQuality }
  | { id: number; type: 'stack'; quality: PartQuality; count: number; fill: number }
  | { id: number; type: 'toolpaths'; quality: PartQuality; ys: number[] };
export type WorkerResult = JobResult | StackPayload | Toolpath[];

const SOLID_LOW_SOURCE_RES = 2.0;

export function runJob(kind: JobKind, quality: PartQuality): JobResult {
  const res = MESH_RES[quality];
  const timings: Record<string, number> = {};
  const time = <T>(label: string, fn: () => T): T => {
    const t0 = performance.now();
    const v = fn();
    timings[label] = Math.round((performance.now() - t0) * 10) / 10;
    return v;
  };
  const result: JobResult = { kind, meshes: {}, volumes: {}, timings };

  if (kind === 'sdf') {
    result.sdf = time('sdfTexture', () => buildSdfVolume());
  } else if (kind === 'solid') {
    const { mesh } = time('solid.mesh', () => surfaceNets(createSolidField(), MESH_MIN, MESH_MAX, res.solid));
    const stress = time('solid.stress', () => smoothAndNormalise(solidStress(mesh.positions), mesh.index));
    result.meshes.solid = { ...mesh, stress };
    result.volumes.solid = meshVolume(mesh.positions, mesh.index);
    result.meshes.solidLow = time('solidLow', () => {
      const src = surfaceNets(createSolidField(), MESH_MIN, MESH_MAX, SOLID_LOW_SOURCE_RES).mesh;
      const low = decimate(src.positions, src.index, SOLID_LOW_TRIS);
      return flatten(low.positions, low.index);
    });
  } else if (kind === 'optimized') {
    const { mesh } = time('optimized.mesh', () =>
      surfaceNets(createOptimizedField(), MESH_MIN, MESH_MAX, res.optimized),
    );
    const stress = time('optimized.stress', () => smoothAndNormalise(optimizedStress(mesh.positions), mesh.index));
    result.meshes.optimized = { ...mesh, stress };
    result.volumes.optimized = meshVolume(mesh.positions, mesh.index);
  } else {
    // both halves share the grid plane `seam`; the low half owns the faces on it, the high half those beyond
    const h = res.infill;
    const seam = Math.round((INFILL_SPLIT_X - MESH_MIN[0]) / h);
    const low = kind === 'infill0';
    const min: [number, number, number] = [low ? MESH_MIN[0] : MESH_MIN[0] + seam * h, MESH_MIN[1], MESH_MIN[2]];
    const max: [number, number, number] = [low ? MESH_MIN[0] + (seam + 1 - 1e-6) * h : MESH_MAX[0], MESH_MAX[1], MESH_MAX[2]];
    const { mesh } = time(`${kind}.mesh`, () =>
      surfaceNets(createInfillField(), min, max, h, false, low ? seam : Infinity),
    );
    result.meshes.infill = mesh;
    // signed volume sums over faces, so the two open halves add up to the closed lattice's volume
    result.volumes.infill = meshVolume(mesh.positions, mesh.index);
  }
  return result;
}

export function transferables(r: JobResult): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  for (const m of Object.values(r.meshes)) {
    if (!m) continue;
    for (const a of [m.positions, m.normals, m.index, m.stress]) if (a) out.push(a.buffer as ArrayBuffer);
  }
  if (r.sdf) out.push(r.sdf.buffer as ArrayBuffer);
  return out;
}

// One slicer per tier and purpose, kept for the life of the worker (slices are cached per height).
const slicers = new Map<string, Slicer>();
function slicerFor(quality: PartQuality, purpose: 'stack' | 'paths'): Slicer {
  const key = `${quality}:${purpose}`;
  let s = slicers.get(key);
  if (!s) {
    s = new Slicer(purpose === 'stack' ? STACK[quality].cell : MESH_RES[quality].slice);
    slicers.set(key, s);
  }
  return s;
}

export function runStack(quality: PartQuality, count: number, fill: number): StackPayload {
  return buildSliceStack(slicerFor(quality, 'stack'), count, fill, STACK[quality].tol);
}

export function runToolpaths(quality: PartQuality, ys: number[]): Toolpath[] {
  const slicer = slicerFor(quality, 'paths');
  return ys.map((y) => buildToolpath(slicer.slice(y)));
}

/** Runs any worker request (also the main-thread fallback) and lists the buffers to transfer back. */
export function handleRequest(req: WorkerRequest): { result: WorkerResult; transfer: ArrayBuffer[] } {
  if (req.type === 'job') {
    const result = runJob(req.kind, req.quality);
    return { result, transfer: transferables(result) };
  }
  if (req.type === 'stack') {
    const result = runStack(req.quality, req.count, req.fill);
    return { result, transfer: stackBuffers(result) };
  }
  const result = runToolpaths(req.quality, req.ys);
  return { result, transfer: result.flatMap(toolpathBuffers) };
}
