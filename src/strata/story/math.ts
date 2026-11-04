import type { Camera } from 'three';

/** Deterministic PRNG (mulberry32). Same seed, same sequence: use it for every random layout. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Projects a world point to screen space 0..1 (y from the top), e.g. to place an fx.haze spot. */
export function projectToScreen(
  x: number,
  y: number,
  z: number,
  camera: Camera,
  out: { x: number; y: number; visible: boolean },
) {
  camera.updateMatrixWorld();
  const e = camera.matrixWorldInverse.elements;
  const vx = e[0] * x + e[4] * y + e[8] * z + e[12];
  const vy = e[1] * x + e[5] * y + e[9] * z + e[13];
  const vz = e[2] * x + e[6] * y + e[10] * z + e[14];
  const p = camera.projectionMatrix.elements;
  const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12];
  const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13];
  const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];
  out.visible = cw > 0;
  out.x = (cx / cw) * 0.5 + 0.5;
  out.y = 0.5 - (cy / cw) * 0.5;
  return out;
}

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Maps v from [a, b] to 0..1, clamped. Handy for slicing p into beats. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
