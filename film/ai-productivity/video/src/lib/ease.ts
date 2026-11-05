// Easing between keys, shared by the timeline build (Node strips the types)
// and the compositions. Pure: no imports, no Date, no randomness.

export const FPS = 30;
export const BEAT = 15;
export const PHASE = 1;

/** Beat n sounds on frame 15n + 1 (120 bpm at 30 fps). */
export const beatFrame = (n: number): number => n * BEAT + PHASE;

/** A key: [frame, value]. */
export type Key = readonly [number, number];

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 0 before f0, 1 after f1, linear between. */
export const progress = (f: number, f0: number, f1: number): number =>
  f1 <= f0 ? (f >= f1 ? 1 : 0) : clamp01((f - f0) / (f1 - f0));

/** Cubic in-out: starts and ends at rest. */
export const inOut = (t: number): number => {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};
export const outCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const inCubic = (t: number): number => Math.pow(clamp01(t), 3);

/**
 * A landing with weight: rises to 1 + overshoot (about 1%) at 70% of the way,
 * then settles back to exactly 1 and stays still.
 */
export const land = (t: number, overshoot = 0.01): number => {
  const u = clamp01(t);
  if (u >= 1) return 1;
  if (u < 0.7) return outCubic(u / 0.7) * (1 + overshoot);
  return 1 + overshoot * (1 - inOut((u - 0.7) / 0.3));
};

const tangents = new WeakMap<readonly Key[], number[]>();

/**
 * Fritsch–Carlson monotone cubic tangents. The first and last keys are rests
 * (tangent 0), and a key between two equal values is a rest too, so a move
 * never overshoots a key and always starts from rest after a hold.
 */
function slopes(keys: readonly Key[]): number[] {
  const hit = tangents.get(keys);
  if (hit) return hit;
  const n = keys.length;
  const d: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    const dx = keys[k + 1][0] - keys[k][0];
    d.push(dx > 0 ? (keys[k + 1][1] - keys[k][1]) / dx : 0);
  }
  const m: number[] = new Array(n).fill(0);
  for (let k = 1; k < n - 1; k++) {
    m[k] = d[k - 1] * d[k] > 0 ? (d[k - 1] + d[k]) / 2 : 0;
  }
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
      continue;
    }
    const a = m[k] / d[k];
    const b = m[k + 1] / d[k];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[k] = t * a * d[k];
      m[k + 1] = t * b * d[k];
    }
  }
  tangents.set(keys, m);
  return m;
}

/** The value of a keyed track at frame f (held before the first key and after the last). */
export function monotone(keys: readonly Key[], f: number): number {
  const n = keys.length;
  if (n === 0) return 0;
  if (f <= keys[0][0]) return keys[0][1];
  if (f >= keys[n - 1][0]) return keys[n - 1][1];
  let k = 0;
  while (k < n - 2 && f >= keys[k + 1][0]) k++;
  const [x0, y0] = keys[k];
  const [x1, y1] = keys[k + 1];
  const h = x1 - x0;
  if (h <= 0) return y1;
  const m = slopes(keys);
  const t = (f - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * m[k] +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * m[k + 1]
  );
}

/** A held value: the last key at or before f. */
export function step<T>(keys: readonly (readonly [number, T])[], f: number): T {
  let v = keys[0][1];
  for (const [kf, kv] of keys) {
    if (f >= kf) v = kv;
    else break;
  }
  return v;
}

/** Deterministic noise in [0, 1) from a seed string (FNV-1a + xorshift). */
export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return ((h >>> 0) % 1000000) / 1000000;
}
