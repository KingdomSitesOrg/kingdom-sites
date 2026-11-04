import { clamp, facts, seededRandom } from '@/strata/story';

/**
 * The hall (STORYBOARD Ch7): 36 x 36 cabinets, columns at x = (c - 18) x 1,400, rows at z = -r x 2,000,
 * the hero at c = 18, r = 0 on the origin. Everything here is seeded and pure, so the Scene, the HUD and
 * static mode agree on every number.
 */
export const COLS = facts.fleet.grid.cols;
export const ROWS = facts.fleet.grid.rows;
export const PITCH_X = 1400;
export const PITCH_Z = 2000;
export const HERO_C = 18;
export const HERO_R = 0;
export const COUNT = COLS * ROWS;
export const HERO = HERO_R * COLS + HERO_C;

export const PROC = { fdm: 0, sla: 1, sls: 2, lpbf: 3 } as const;

/** Story beats in p (STORYBOARD Ch7 beats). */
export const BEAT = {
  glowEnd: 0.12,
  rippleStart: 0.4,
  rippleEnd: 0.8,
  offStart: 0.88,
} as const;

export const FLASHES = 96;

export interface Fleet {
  x: Float32Array;
  z: Float32Array;
  col: Uint8Array;
  row: Uint8Array;
  proc: Float32Array;
  seed: Float32Array;
  job: Float32Array;
  off: Float32Array;
  flashP: Float32Array;
  idle: Float32Array;
  glowDelay: Float32Array;
  flashes: Float32Array;
  activeCount: number;
  activeList: Uint16Array;
}

let cached: Fleet | null = null;

export function getFleet(): Fleet {
  return (cached ??= buildFleet());
}

function buildFleet(): Fleet {
  const rand = seededRandom(1296);
  const x = new Float32Array(COUNT);
  const z = new Float32Array(COUNT);
  const col = new Uint8Array(COUNT);
  const row = new Uint8Array(COUNT);
  const proc = new Float32Array(COUNT);
  const seed = new Float32Array(COUNT);
  const job = new Float32Array(COUNT);
  const off = new Float32Array(COUNT);
  const flashP = new Float32Array(COUNT).fill(-10);
  const idle = new Float32Array(COUNT);
  const glowDelay = new Float32Array(COUNT);
  const dist = new Float32Array(COUNT);

  const field = districtField(rand);
  const farX = (COLS - 1 - HERO_C) * PITCH_X;
  const farZ = -(ROWS - 1) * PITCH_Z;
  const maxFar = Math.hypot((COLS - 1) * PITCH_X, (ROWS - 1) * PITCH_Z);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      x[i] = (c - HERO_C) * PITCH_X;
      z[i] = -r * PITCH_Z;
      col[i] = c;
      row[i] = r;
      seed[i] = rand();
      dist[i] = Math.hypot(x[i], z[i]);
      const ripple = Math.hypot(x[i] - farX, z[i] - farZ) / maxFar;
      job[i] = clamp(ripple + (rand() - 0.5) * 0.03, 0, 1);
      glowDelay[i] = clamp(dist[i] / 7000, 0, 1) * 0.5;
    }
  }

  // Districts: the hero's 6 x 6 block is metal (it is the Ch6 machine); the rest follow a seeded field,
  // banded into exact process counts (facts.fleet.byProcess).
  const nearBlock = (i: number) => col[i] >= 15 && col[i] <= 20 && row[i] <= 5;
  const rest: number[] = [];
  for (let i = 0; i < COUNT; i++) {
    if (nearBlock(i)) proc[i] = PROC.lpbf;
    else rest.push(i);
  }
  rest.sort((a, b) => field[a] - field[b]);
  const { fdm, sla, sls, lpbf } = facts.fleet.byProcess;
  const bands: [number, number][] = [
    [PROC.lpbf, lpbf - 36],
    [PROC.sla, sla],
    [PROC.sls, sls],
    [PROC.fdm, fdm],
  ];
  let k = 0;
  for (const [p, n] of bands) for (let j = 0; j < n; j++) proc[rest[k++]] = p;

  // Idle machines (printers - active), kept away from the opening frames.
  const idleCount = facts.fleet.printers - facts.fleet.active;
  const candidates: number[] = [];
  for (let i = 0; i < COUNT; i++) if (dist[i] > 14000) candidates.push(i);
  shuffle(candidates, rand);
  for (let j = 0; j < idleCount; j++) idle[candidates[j]] = 1;

  // Lights out: back to front by distance from the hero, the hero last (off = 0).
  const active: number[] = [];
  for (let i = 0; i < COUNT; i++) if (!idle[i]) active.push(i);
  const key = new Float32Array(COUNT);
  for (const i of active) key[i] = i === HERO ? -1 : dist[i] + rand() * 2600;
  active.sort((a, b) => key[a] - key[b]);
  const n = active.length;
  off.fill(2);
  active.forEach((i, rank) => {
    off[i] = n > 1 ? rank / (n - 1) : 0;
  });

  // Completion flashes on a p-seeded schedule (they tick the parts counter).
  const flashes = new Float32Array(FLASHES);
  for (let j = 0; j < FLASHES; j++) flashes[j] = BEAT.rippleStart + 0.02 + rand() * (BEAT.rippleEnd - BEAT.rippleStart - 0.02);
  flashes.sort();
  const pool = active.filter((i) => i !== HERO);
  shuffle(pool, rand);
  for (let j = 0; j < FLASHES; j++) flashP[pool[j]] = flashes[j];

  return {
    x,
    z,
    col,
    row,
    proc,
    seed,
    job,
    off,
    flashP,
    idle,
    glowDelay,
    flashes,
    activeCount: n,
    activeList: Uint16Array.from(active),
  };
}

function shuffle(a: number[], rand: () => number) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
}

/** Blocky value noise over 3 x 3 cabinet bays, so districts read as planned bays rather than speckle. */
function districtField(rand: () => number): Float32Array {
  const bays = Math.ceil(COLS / 3) + 2;
  const lattice = new Float32Array(bays * bays);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  const at = (bx: number, bz: number) => lattice[clamp(bz, 0, bays - 1) * bays + clamp(bx, 0, bays - 1)];
  const smooth = (bx: number, bz: number) => {
    const x0 = Math.floor(bx);
    const z0 = Math.floor(bz);
    const fx = bx - x0;
    const fz = bz - z0;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);
    const a = at(x0, z0) + (at(x0 + 1, z0) - at(x0, z0)) * sx;
    const b = at(x0, z0 + 1) + (at(x0 + 1, z0 + 1) - at(x0, z0 + 1)) * sx;
    return a + (b - a) * sz;
  };
  const out = new Float32Array(COUNT);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const bx = Math.floor(c / 3);
      const bz = Math.floor(r / 3);
      out[r * COLS + c] = smooth(bx * 0.42, bz * 0.42) + at(bx + 1, bz + 1) * 0.35 + (c * 0.0007 + r * 0.0003);
    }
  }
  return out;
}

/** Index of the first flash later than p (= flashes so far). */
export function flashesBefore(p: number): number {
  const f = getFleet().flashes;
  let lo = 0;
  let hi = f.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (f[mid] <= p) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Lights-out threshold: 1 (all on) at p 0.88, 0 (only the hero) at p 1, a long tail near the end. */
export function offThreshold(p: number): number {
  const u = clamp((p - BEAT.offStart) / (1 - BEAT.offStart), 0, 1);
  return Math.pow(1 - u, 2.2) * 1.0001;
}

/** Dispatch wave front 0 -> 1.06 across p 0.40-0.80. */
export function rippleFront(p: number): number {
  const u = clamp((p - BEAT.rippleStart) / (BEAT.rippleEnd - BEAT.rippleStart), 0, 1);
  return u * 1.06;
}

/** [S] parts printed today at p (story value, no wall-clock term). */
export function partsAt(p: number): number {
  return facts.partsTodayBase + Math.floor(clamp(p, 0, 1) * 186) + flashesBefore(p);
}

/** [S] machines still lit at p during lights-out. */
export function litAt(p: number): number {
  const n = getFleet().activeCount;
  const t = offThreshold(p);
  return Math.min(n, Math.floor(t * (n - 1) + 1e-6) + 1);
}
