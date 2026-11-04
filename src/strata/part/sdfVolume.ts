// A 64^3 half-float grid of sdOptimized for Ch3's erosion (sampled once per fragment, no raymarching).
import { createOptimizedField } from './sdf';

export const SDF_RES = 64;
/** Box the grid covers (mm): the envelope plus a margin, so the solid's whole surface samples inside it. */
export const SDF_BOX = { min: [-46, -2, -22] as const, max: [46, 44, 22] as const };
/** Largest sdOptimized inside the solid (mm, measured): where Ch3's erosion threshold starts before easing to 0. */
export const SDF_SOLID_MAX = 23.0;

const BLOCK = 8;
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);

/** IEEE 754 binary16 bits for a float, rounded to nearest even (THREE.DataUtils.toHalfFloat truncates). */
export function toHalf(v: number): number {
  f32[0] = v;
  const x = u32[0];
  const sign = (x >>> 16) & 0x8000;
  const e = (x >>> 23) & 0xff;
  let m = x & 0x7fffff;
  if (e === 0xff) return sign | 0x7c00 | (m ? 0x200 : 0);
  const exp = e - 127 + 15;
  if (exp >= 0x1f) return sign | 0x7c00;
  if (exp <= 0) {
    if (exp < -10) return sign;
    m |= 0x800000;
    const shift = 14 - exp;
    const half = m >>> shift;
    const rest = m & ((1 << shift) - 1);
    const mid = 1 << (shift - 1);
    return sign | (half + (rest > mid || (rest === mid && half & 1) ? 1 : 0));
  }
  let half = (exp << 10) | (m >>> 13);
  const rest = m & 0x1fff;
  if (rest > 0x1000 || (rest === 0x1000 && half & 1)) half++;
  return sign | half;
}

/**
 * Texel (i, j, k) holds sdOptimized at min + (i + 0.5) * (max - min) / res, x fastest, so a shader samples it at
 * uvw = (p - min) / (max - min).
 */
export function buildSdfVolume(res = SDF_RES): Uint16Array {
  const field = createOptimizedField();
  const out = new Uint16Array(res * res * res);
  const [x0, y0, z0] = SDF_BOX.min;
  const sx = (SDF_BOX.max[0] - x0) / res,
    sy = (SDF_BOX.max[1] - y0) / res,
    sz = (SDF_BOX.max[2] - z0) / res;
  const half = (BLOCK - 1) / 2;
  const r = Math.hypot(half * sx, half * sy, half * sz);
  for (let kb = 0; kb < res; kb += BLOCK)
    for (let jb = 0; jb < res; jb += BLOCK)
      for (let ib = 0; ib < res; ib += BLOCK) {
        field.block(x0 + (ib + half + 0.5) * sx, y0 + (jb + half + 0.5) * sy, z0 + (kb + half + 0.5) * sz, r);
        for (let k = kb; k < kb + BLOCK; k++) {
          const z = z0 + (k + 0.5) * sz;
          for (let j = jb; j < jb + BLOCK; j++) {
            const y = y0 + (j + 0.5) * sy;
            let o = (k * res + j) * res + ib;
            for (let i = ib; i < ib + BLOCK; i++) out[o++] = toHalf(field.eval(x0 + (i + 0.5) * sx, y, z));
          }
        }
      }
  field.clear();
  return out;
}
