import * as THREE from 'three';
import {
  MESH_RES,
  PART_BOUNDS,
  PART_CENTER,
  PART_SCALE,
  PART_SIZE,
  TI64_DENSITY,
  type PartKind,
  type PartQuality,
} from './constants';
import {
  handleRequest,
  runJob,
  type JobKind,
  type JobResult,
  type MeshPayload,
  type WorkerRequest,
  type WorkerResult,
} from './generate';
import { PART_GLSL } from './glsl';
import { createSampler, type SurfaceSampler } from './samples';
import { sdGyroid, sdInfill, sdOptimized, sdPart, sdSolid } from './sdf';
import { SDF_BOX, SDF_RES } from './sdfVolume';
import { simplify, Slicer, type Slice } from './slicer';
import type { StackPayload } from './sliceStack';
import type { Toolpath } from './toolpath';

export type { Slice } from './slicer';

/** Everything `part.ready(kind)` can wait for. */
export type PartAsset = PartKind | 'sdfTexture' | 'sliceStack' | 'toolpaths';

export type SdfBox = { min: readonly [number, number, number]; max: readonly [number, number, number] };

export type PartMass = {
  /** Ti-6Al-4V grams. */
  solidGrams: number;
  optimizedGrams: number;
  /** Volumes in cm^3. */
  solidVolume: number;
  optimizedVolume: number;
  infillVolume: number;
};

export type PartStats = {
  quality: PartQuality;
  /** Wall-clock ms from request to ready, plus per-stage worker timings. */
  totalMs: number;
  timings: Record<string, number>;
  triangles: Record<PartKind, number>;
  usedWorker: boolean;
};

export type PartData = {
  quality: PartQuality;
  /** Shared geometries in millimetres. Never dispose them; pass dispose={null} on the <mesh>. */
  solid: THREE.BufferGeometry;
  solidLow: THREE.BufferGeometry;
  optimized: THREE.BufferGeometry;
  infill: THREE.BufferGeometry;
  /** Area-weighted surface points (x, y, z, mm); deterministic per (kind, count, seed). Cached. */
  samples: (kind: PartKind, count: number, seed?: number) => Float32Array;
  /** Same points plus unit normals. */
  samplesWithNormals: (kind: PartKind, count: number, seed?: number) => { positions: Float32Array; normals: Float32Array };
  sdf: {
    sdSolid: typeof sdSolid;
    sdOptimized: typeof sdOptimized;
    sdGyroid: typeof sdGyroid;
    sdInfill: typeof sdInfill;
    sdPart: typeof sdPart;
  };
  /** GLSL source with sdSolid, sdOptimized, sdGyroid, sdInfill, sdPart, sdPartBounds (see glsl.ts). */
  sdfGLSL: string;
  /** Slice of the optimized part at height y (mm). Cached per y. */
  slice: (y: number) => Slice;
  /** Thin extruded slab (with holes) spanning y - thickness/2 .. y + thickness/2. The caller owns and disposes it. */
  sliceGeometry: (y: number, thickness: number) => THREE.BufferGeometry;
  /** Mid-layer heights for a layer height, bottom to top. */
  layers: (layerHeight: number) => Float32Array;
  /**
   * 64^3 R16F grid of sdOptimized (mm) over `sdfBox`, trilinear, clamped. Sample at uvw = (p - min) / (max - min).
   * Shared: never dispose.
   */
  sdfTexture: THREE.Data3DTexture;
  sdfBox: SdfBox;
  /**
   * `count` evenly spaced slabs of the optimized part in one geometry (attributes position, normal, aSlice
   * 0..count-1), slab i centred at (i + 0.5) * 42 / count mm, `fill` x spacing thick. Built in the worker,
   * cached per (count, fill) and shared: render with dispose={null}.
   */
  sliceStack: (count: number, fill?: number) => Promise<THREE.BufferGeometry>;
  /** One continuous nozzle path per height (mm), built in the worker and cached per height. Shared: read only. */
  toolpaths: (ys: number[]) => Promise<Toolpath[]>;
  /** Resolves once the asset is built: at once for meshes and sdfTexture, else when its requests so far settle. */
  ready: (kind: PartAsset) => Promise<void>;
  mass: PartMass;
  size: typeof PART_SIZE;
  bounds: typeof PART_BOUNDS;
  center: typeof PART_CENTER;
  scale: number;
  stats: PartStats;
};

const ready = new Map<PartQuality, PartData>();
const pending = new Map<PartQuality, Promise<PartData>>();
const listeners = new Set<() => void>();

export function subscribePart(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getPart(quality: PartQuality): PartData | null {
  return ready.get(quality) ?? null;
}

let latest: PartData | null = null;

/** The most recently built tier, or null before any. */
export function latestPart(): PartData | null {
  return latest;
}

/** Starts generation (once per quality tier) and resolves with the shared part. */
export function preloadPart(quality: PartQuality = 'high'): Promise<PartData> {
  let p = pending.get(quality);
  if (!p) {
    p = build(quality).then((part) => {
      ready.set(quality, part);
      latest = part;
      listeners.forEach((l) => l());
      return part;
    });
    pending.set(quality, p);
  }
  return p;
}

/** Waits for one asset of a tier, starting generation if needed (for capture gates such as whenReady). */
export function partReady(quality: PartQuality, kind: PartAsset): Promise<void> {
  return preloadPart(quality).then((p) => p.ready(kind));
}

function runInWorker(kind: JobKind, quality: PartQuality): Promise<JobResult> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('no Worker'));
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./part.worker.ts', import.meta.url), { type: 'module' });
    } catch (e) {
      reject(e);
      return;
    }
    worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: JobResult; error?: string }>) => {
      worker.terminate();
      if (e.data.ok && e.data.result) resolve(e.data.result);
      else reject(new Error(e.data.error ?? 'part worker failed'));
    };
    worker.onerror = (e) => {
      e.preventDefault();
      worker.terminate();
      reject(new Error(e.message || 'part worker error'));
    };
    worker.postMessage({ id: 0, type: 'job', kind, quality } satisfies WorkerRequest);
  });
}

type Reply = { id: number; ok: boolean; result?: WorkerResult; error?: string };
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never;
type Request = WithoutId<WorkerRequest>;

/** A long-lived worker for slab stacks and toolpaths; runs on the main thread only if workers are unavailable. */
class SliceService {
  private worker: Worker | null | undefined;
  private nextId = 1;
  private waiting = new Map<number, { req: Request; resolve: (r: WorkerResult) => void; reject: (e: Error) => void }>();

  request<T extends WorkerResult>(req: Request): Promise<T> {
    return new Promise<WorkerResult>((resolve, reject) => {
      const w = this.start();
      if (!w) {
        setTimeout(() => this.runHere(req, resolve, reject), 0);
        return;
      }
      const id = this.nextId++;
      this.waiting.set(id, { req, resolve, reject });
      w.postMessage({ ...req, id } as WorkerRequest);
    }) as Promise<T>;
  }

  private runHere(req: Request, resolve: (r: WorkerResult) => void, reject: (e: Error) => void) {
    try {
      resolve(handleRequest({ ...req, id: 0 } as WorkerRequest).result);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private start(): Worker | null {
    if (this.worker !== undefined) return this.worker;
    this.worker = null;
    if (typeof Worker === 'undefined') return null;
    try {
      const w = new Worker(new URL('./part.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<Reply>) => {
        const job = this.waiting.get(e.data.id);
        if (!job) return;
        this.waiting.delete(e.data.id);
        if (e.data.ok && e.data.result) job.resolve(e.data.result);
        else job.reject(new Error(e.data.error ?? 'part worker failed'));
      };
      w.onerror = (e) => {
        e.preventDefault();
        w.terminate();
        this.worker = null;
        const jobs = [...this.waiting.values()];
        this.waiting.clear();
        for (const j of jobs) setTimeout(() => this.runHere(j.req, j.resolve, j.reject), 0);
      };
      this.worker = w;
    } catch {
      this.worker = null;
    }
    return this.worker;
  }
}

function toStackGeometry(s: StackPayload): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(s.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(s.normals, 3));
  g.setAttribute('aSlice', new THREE.BufferAttribute(s.slice, 1));
  g.setIndex(new THREE.BufferAttribute(s.index, 1));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function toSdfTexture(data: Uint16Array): THREE.Data3DTexture {
  const t = new THREE.Data3DTexture(data, SDF_RES, SDF_RES, SDF_RES);
  t.format = THREE.RedFormat;
  t.type = THREE.HalfFloatType;
  t.internalFormat = 'R16F';
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.ClampToEdgeWrapping;
  t.unpackAlignment = 1;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

function mergeMeshes(parts: MeshPayload[]): MeshPayload {
  let nv = 0,
    ni = 0;
  for (const p of parts) {
    nv += p.positions.length;
    ni += p.index!.length;
  }
  const positions = new Float32Array(nv);
  const normals = new Float32Array(nv);
  const index = new Uint32Array(ni);
  let ov = 0,
    oi = 0;
  for (const p of parts) {
    positions.set(p.positions, ov);
    normals.set(p.normals, ov);
    const base = ov / 3;
    for (let i = 0; i < p.index!.length; i++) index[oi + i] = p.index![i] + base;
    ov += p.positions.length;
    oi += p.index!.length;
  }
  return { positions, normals, index };
}

function toGeometry(m: MeshPayload): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  if (m.stress) g.setAttribute('stress', new THREE.BufferAttribute(m.stress, 1));
  if (m.index) {
    const vc = m.positions.length / 3;
    g.setIndex(new THREE.BufferAttribute(vc < 65536 ? Uint16Array.from(m.index) : m.index, 1));
  }
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

async function build(quality: PartQuality): Promise<PartData> {
  const t0 = performance.now();
  const kinds: JobKind[] = ['optimized', 'infill0', 'infill1', 'solid', 'sdf'];
  let usedWorker = true;
  const results = await Promise.all(
    kinds.map((k) =>
      runInWorker(k, quality).catch(() => {
        usedWorker = false;
        return runJob(k, quality);
      }),
    ),
  );
  const meshes: Partial<Record<PartKind, MeshPayload>> = {};
  const volumes: Record<string, number> = {};
  const timings: Record<string, number> = {};
  let sdf: Uint16Array | undefined;
  const halves: MeshPayload[] = [];
  volumes.infill = 0;
  for (const r of results) {
    if (r.kind === 'infill0' || r.kind === 'infill1') {
      halves.push(r.meshes.infill!);
      volumes.infill += r.volumes.infill!;
    } else {
      Object.assign(meshes, r.meshes);
      Object.assign(volumes, r.volumes);
    }
    Object.assign(timings, r.timings);
    sdf ??= r.sdf;
  }
  meshes.infill = mergeMeshes(halves);
  const geo = {
    solid: toGeometry(meshes.solid!),
    solidLow: toGeometry(meshes.solidLow!),
    optimized: toGeometry(meshes.optimized!),
    infill: toGeometry(meshes.infill!),
  };
  const tris = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.getAttribute('position').count) / 3;

  const samplers = new Map<PartKind, SurfaceSampler>();
  const sampleCache = new Map<string, { positions: Float32Array; normals: Float32Array }>();
  const samplesWithNormals = (kind: PartKind, count: number, seed = 1) => {
    const key = `${kind}:${count}:${seed}`;
    let hit = sampleCache.get(key);
    if (!hit) {
      let s = samplers.get(kind);
      if (!s) {
        const m = meshes[kind]!;
        s = createSampler(m.positions, m.normals, m.index ?? null);
        samplers.set(kind, s);
      }
      hit = s(count, seed);
      sampleCache.set(key, hit);
    }
    return hit;
  };

  const slicer = new Slicer(MESH_RES[quality].slice);
  const sliceGeometry = (y: number, thickness: number) => {
    const s = slicer.slice(y);
    const toPts = (l: Float32Array) => {
      const pts: THREE.Vector2[] = [];
      const sl = simplify(l, 0.05);
      // drop the repeated closing point; ShapeUtils closes the contour itself
      for (let i = 0; i < sl.length - 2; i += 2) pts.push(new THREE.Vector2(sl[i], -sl[i + 1]));
      return pts;
    };
    const shapes = s.outer.map((o) => new THREE.Shape(toPts(o)));
    s.holes.forEach((h) => {
      const owner = s.outer.findIndex((o) => pointInLoop(o, h[0], h[1]));
      if (owner >= 0) shapes[owner].holes.push(new THREE.Path(toPts(h)));
    });
    const g = new THREE.ExtrudeGeometry(shapes, { depth: thickness, bevelEnabled: false, curveSegments: 1, steps: 1 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y - thickness / 2, 0);
    g.computeBoundingSphere();
    return g;
  };

  const service = new SliceService();
  const inflight = { sliceStack: new Set<Promise<unknown>>(), toolpaths: new Set<Promise<unknown>>() };
  const track = <T>(kind: keyof typeof inflight, p: Promise<T>): Promise<T> => {
    inflight[kind].add(p);
    const done = () => inflight[kind].delete(p);
    p.then(done, done);
    return p;
  };
  const stacks = new Map<string, Promise<THREE.BufferGeometry>>();
  const sliceStack = (count: number, fill = 0.8) => {
    const n = Math.max(1, Math.round(count));
    const key = `${n}:${fill}`;
    let hit = stacks.get(key);
    if (!hit) {
      const t = performance.now();
      hit = track(
        'sliceStack',
        service.request<StackPayload>({ type: 'stack', quality, count: n, fill }).then((s) => {
          timings[`sliceStack.${n}`] = Math.round(performance.now() - t);
          return toStackGeometry(s);
        }),
      );
      stacks.set(key, hit);
      hit.catch(() => stacks.delete(key));
    }
    return hit;
  };
  const paths = new Map<string, Promise<Toolpath>>();
  const toolpaths = (ys: number[]) => {
    const missing = [...new Set(ys.map((y) => y.toFixed(4)))].filter((k) => !paths.has(k));
    if (missing.length) {
      const t = performance.now();
      const batch = track(
        'toolpaths',
        service.request<Toolpath[]>({ type: 'toolpaths', quality, ys: missing.map(Number) }).then((r) => {
          timings[`toolpaths.${missing.length}`] = Math.round(performance.now() - t);
          return r;
        }),
      );
      missing.forEach((k, i) => {
        const one = batch.then((r) => r[i]);
        paths.set(k, one);
        one.catch(() => paths.delete(k));
      });
    }
    return Promise.all(ys.map((y) => paths.get(y.toFixed(4))!));
  };
  const ready = (kind: PartAsset): Promise<void> =>
    kind === 'sliceStack' || kind === 'toolpaths'
      ? Promise.allSettled([...inflight[kind]]).then(() => undefined)
      : Promise.resolve();

  const solidVolume = volumes.solid / 1000;
  const optimizedVolume = volumes.optimized / 1000;
  const part: PartData = {
    quality,
    ...geo,
    samples: (kind, count, seed) => samplesWithNormals(kind, count, seed).positions,
    samplesWithNormals,
    sdf: { sdSolid, sdOptimized, sdGyroid, sdInfill, sdPart },
    sdfGLSL: PART_GLSL,
    slice: (y) => slicer.slice(y),
    sliceGeometry,
    layers: (layerHeight) => {
      const n = Math.ceil(PART_SIZE.y / layerHeight);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = (i + 0.5) * layerHeight;
      return out;
    },
    sdfTexture: toSdfTexture(sdf!),
    sdfBox: SDF_BOX,
    sliceStack,
    toolpaths,
    ready,
    mass: {
      solidGrams: solidVolume * TI64_DENSITY,
      optimizedGrams: optimizedVolume * TI64_DENSITY,
      solidVolume,
      optimizedVolume,
      infillVolume: volumes.infill / 1000,
    },
    size: PART_SIZE,
    bounds: PART_BOUNDS,
    center: PART_CENTER,
    scale: PART_SCALE,
    stats: {
      quality,
      totalMs: Math.round(performance.now() - t0),
      timings,
      triangles: {
        solid: tris(geo.solid),
        solidLow: tris(geo.solidLow),
        optimized: tris(geo.optimized),
        infill: tris(geo.infill),
      },
      usedWorker,
    },
  };
  return part;
}

function pointInLoop(l: Float32Array, x: number, z: number) {
  let inside = false;
  for (let i = 0, j = l.length - 4; i < l.length - 2; j = i, i += 2) {
    const xi = l[i],
      zi = l[i + 1],
      xj = l[j],
      zj = l[j + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
