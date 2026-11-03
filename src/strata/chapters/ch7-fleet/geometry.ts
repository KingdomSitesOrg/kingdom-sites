import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  PlaneGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Quality } from '@/strata/story';
import { seededRandom } from '@/strata/story';
import { CABINET, buildCabinet, type CabinetDetail } from '@/strata/story/shared/cabinet';
import { COUNT, HERO, HERO_C, PITCH_X, PITCH_Z, ROWS, getFleet } from './fleet';

/** The machine set each tier renders (STORYBOARD Ch7: low renders c 6..29, r 0..23, near block 3 x 3). */
export const TIER = {
  high: { cols: [0, 35], rows: [0, 35], near: [15, 20, 0, 5], agvs: 24, trays: true },
  medium: { cols: [0, 35], rows: [0, 35], near: [15, 20, 0, 5], agvs: 24, trays: true },
  low: { cols: [6, 29], rows: [0, 23], near: [17, 19, 0, 2], agvs: 12, trays: false },
} as const;

/** Surface zones the fleet material shades (aZone). */
export const ZONE = { body: 0, lights: 7, window: 10, beacon: 12 } as const;

/** One cabinet part as flat triangles with the attributes the fleet material reads. */
function part(src: BufferGeometry, zone: number, dz = 0): BufferGeometry {
  const g = src.index ? src.toNonIndexed() : src.clone();
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  if (dz) g.translate(0, 0, dz);
  const n = g.getAttribute('position').count;
  const out = new BufferGeometry();
  out.setAttribute('position', g.getAttribute('position'));
  out.setAttribute('normal', g.getAttribute('normal'));
  const color = g.getAttribute('color');
  const c = new Float32Array(n * 3).fill(1);
  if (color) for (let i = 0; i < n; i++) c.set([color.getX(i), color.getY(i), color.getZ(i)], i * 3);
  out.setAttribute('aCol', new Float32BufferAttribute(c, 3));
  const uv = g.getAttribute('uv');
  const u = new Float32Array(n * 2);
  if (uv) for (let i = 0; i < n; i++) u.set([uv.getX(i), uv.getY(i)], i * 2);
  out.setAttribute('aUv', new Float32BufferAttribute(u, 2));
  out.setAttribute('aZone', new Float32BufferAttribute(new Float32Array(n).fill(zone), 1));
  return out;
}

/** Ch7's beacon bar along each roof's front edge (centre and size, mm): a line of process light across the hall. */
export const BEACON = { y: CABINET.topY + 8, z: CABINET.frontZ - 44, width: 820, height: 16, depth: 52 } as const;

function beacon(): BufferGeometry {
  const g = new BoxGeometry(BEACON.width, BEACON.height, BEACON.depth);
  g.translate(0, BEACON.y, BEACON.z);
  return g;
}

/**
 * A cabinet LOD from the shared cabinet (body, window, lights), merged into one geometry so each LOD is
 * one instanced draw. The glass pane is left out: the fleet material darkens the window and adds the
 * glass reflection itself. The far window quad is lifted off the body so it never fights it in depth.
 */
function cabinetLOD(detail: CabinetDetail, withBeacon: boolean): BufferGeometry {
  const c = buildCabinet(detail);
  const parts = [part(c.body, ZONE.body), part(c.window, ZONE.window, detail === 'far' ? 5 : 0)];
  if (c.lights) parts.push(part(c.lights, ZONE.lights));
  if (withBeacon) {
    const b = beacon();
    parts.push(part(b, ZONE.beacon));
    b.dispose();
  }
  c.body.dispose();
  c.window.dispose();
  c.lights?.dispose();
  c.glass?.dispose();
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) throw new Error('fleet: cabinet merge failed');
  merged.computeBoundingSphere();
  return merged;
}

export function poolBase(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  return g;
}

export function trayBase(): BufferGeometry {
  return new BoxGeometry(1, 1, 1);
}

export function floorGeometry(): BufferGeometry {
  return new PlaneGeometry(900000, 900000, 1, 1);
}

interface Instances {
  index: number[];
}

function pick(quality: Quality) {
  const t = TIER[quality];
  const fleet = getFleet();
  const near: Instances = { index: [] };
  const far: Instances = { index: [] };
  for (let i = 0; i < COUNT; i++) {
    const c = fleet.col[i];
    const r = fleet.row[i];
    if (c < t.cols[0] || c > t.cols[1] || r < t.rows[0] || r > t.rows[1] || i === HERO) continue;
    const inNear = c >= t.near[0] && c <= t.near[1] && r >= t.near[2] && r <= t.near[3];
    (inNear ? near : far).index.push(i);
  }
  return { near, far };
}

function instancedFrom(base: BufferGeometry, list: number[], agvs = 0): InstancedBufferGeometry {
  const fleet = getFleet();
  const g = new InstancedBufferGeometry();
  for (const name of Object.keys(base.attributes)) g.setAttribute(name, base.getAttribute(name));
  const n = list.length + agvs;
  const pos = new Float32Array(n * 2);
  const a = new Float32Array(n * 4);
  const b = new Float32Array(n * 4);
  const idx = new Float32Array(n);
  list.forEach((i, k) => {
    pos[k * 2] = fleet.x[i];
    pos[k * 2 + 1] = fleet.z[i];
    a[k * 4] = fleet.proc[i];
    a[k * 4 + 1] = fleet.seed[i];
    a[k * 4 + 2] = fleet.job[i];
    a[k * 4 + 3] = fleet.off[i];
    b[k * 4] = fleet.flashP[i];
    b[k * 4 + 1] = fleet.idle[i];
    b[k * 4 + 2] = i === HERO ? 1 : 0;
    b[k * 4 + 3] = fleet.glowDelay[i];
    idx[k] = i;
  });
  if (agvs) {
    const rand = seededRandom(77);
    for (let j = 0; j < agvs; j++) {
      const k = list.length + j;
      const row = 1 + Math.floor(rand() * (ROWS - 2));
      pos[k * 2] = 0;
      pos[k * 2 + 1] = -row * PITCH_Z + 1000;
      a[k * 4] = 9;
      a[k * 4 + 1] = rand();
      a[k * 4 + 3] = Math.min(1, row / ROWS + 0.02);
      b[k * 4] = rand() < 0.5 ? -1 : 1;
      b[k * 4 + 1] = rand() * 60000;
      b[k * 4 + 3] = 1100 + rand() * 900;
      idx[k] = COUNT + j;
    }
  }
  g.setAttribute('iPos', new InstancedBufferAttribute(pos, 2));
  g.setAttribute('iA', new InstancedBufferAttribute(a, 4));
  g.setAttribute('iB', new InstancedBufferAttribute(b, 4));
  g.setAttribute('iIndex', new InstancedBufferAttribute(idx, 1));
  g.instanceCount = n;
  return g;
}

export interface FleetSet {
  hero: InstancedBufferGeometry;
  near: InstancedBufferGeometry;
  far: InstancedBufferGeometry;
  pools: InstancedBufferGeometry;
  trays: InstancedBufferGeometry | null;
  floor: BufferGeometry;
  /** Hall rectangle on the floor: x min, x max, z min, z max. */
  hallBox: [number, number, number, number];
  agvSpan: number;
  bases: BufferGeometry[];
}

export function buildFleetSet(quality: Quality): FleetSet {
  const t = TIER[quality];
  const { near, far } = pick(quality);
  const all = [...near.index, ...far.index, HERO];
  const bases = [cabinetLOD('full', false), cabinetLOD('near', true), cabinetLOD('far', true), poolBase(), trayBase()];
  const [heroB, nearB, farB, poolB, trayB] = bases;
  let trays: InstancedBufferGeometry | null = null;
  if (t.trays) {
    trays = new InstancedBufferGeometry();
    for (const name of Object.keys(trayB.attributes)) trays.setAttribute(name, trayB.getAttribute(name));
    const rows = t.rows[1] - t.rows[0] + 1;
    const pos = new Float32Array(rows * 2);
    for (let r = 0; r < rows; r++) {
      pos[r * 2] = ((t.cols[0] + t.cols[1]) / 2 - HERO_C) * PITCH_X;
      pos[r * 2 + 1] = -(t.rows[0] + r) * PITCH_Z;
    }
    trays.setAttribute('iPos', new InstancedBufferAttribute(pos, 2));
    trays.instanceCount = rows;
  }
  const x0 = (t.cols[0] - HERO_C) * PITCH_X - 700;
  const x1 = (t.cols[1] - HERO_C) * PITCH_X + 700;
  return {
    hero: instancedFrom(heroB, [HERO]),
    near: instancedFrom(nearB, near.index),
    far: instancedFrom(farB, far.index),
    pools: instancedFrom(poolB, all, t.agvs),
    trays,
    floor: floorGeometry(),
    hallBox: [x0, x1, -t.rows[1] * PITCH_Z - 600, 600],
    agvSpan: x1 - x0,
    bases,
  };
}

export function disposeFleetSet(s: FleetSet) {
  s.hero.dispose();
  s.near.dispose();
  s.far.dispose();
  s.pools.dispose();
  s.trays?.dispose();
  s.floor.dispose();
  for (const b of s.bases) b.dispose();
}

