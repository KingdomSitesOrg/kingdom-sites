// The erosion field, twice: GLSL for the shaders and a bit-exact JS twin for the threshold table.
// field(p) = sdOptimized(p) + organic noise that is muted where the solid already is the final surface, so
// material farthest from the optimized truss goes first and pores nucleate like bone remodelling.
import { sdOptimized } from '@/strata/part';

export const NOISE = { amp: 2.6, coarse: 0.085, fine: 0.27, fineW: 0.38, muteLo: 0.3, muteHi: 2.6 } as const;
/** Width (mm of field) of the molten band behind the front. */
export const BAND = 0.8;
/** Solid surface this close to the optimized surface is the final surface: it never erodes. */
export const KEEP_SKIN = 0.3;

const f = (v: number) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

/** Value-noise lattice: 64^3 hashed bytes, wrapped. One texture fetch gives quintic value noise. */
export const NOISE_RES = 64;

function latticeByte(x: number, y: number, z: number) {
  let h = (Math.imul(x + 1024, 0x8da6b343) ^ Math.imul(y + 1024, 0xd8163841) ^ Math.imul(z + 1024, 0xcb1ab31f)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h >>> 24;
}

let lattice: Uint8Array | null = null;
/** The lattice bytes (shared by the GPU texture and the JS twin). */
export function noiseLattice(): Uint8Array {
  if (lattice) return lattice;
  const n = NOISE_RES;
  lattice = new Uint8Array(n * n * n);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) lattice[i + n * (j + n * k)] = latticeByte(i, j, k);
  return lattice;
}

/** ch3Noise (-1..1) and ch3Organic: needs uNoise (the lattice as a linear-filtered, repeating R8 volume). */
export const noiseGLSL = /* glsl */ `
#ifndef CH3_NOISE
#define CH3_NOISE
uniform sampler3D uNoise;
float ch3Noise(vec3 x) {
  vec3 i = floor(x);
  vec3 r = x - i;
  r = r * r * r * (r * (r * 6.0 - 15.0) + 10.0);
  return texture(uNoise, (i + r + 0.5) / ${f(NOISE_RES)}).r * 2.0 - 1.0;
}
float ch3Organic(vec3 p) {
  return (1.0 - ${f(NOISE.fineW)}) * ch3Noise(p * ${f(NOISE.coarse)}) + ${f(NOISE.fineW)} * ch3Noise(p * ${f(NOISE.fine)} + vec3(17.3, 5.1, -9.7));
}
#endif
`;

/** ch3Field(p): needs uSdf / uSdfMin / uSdfMax (part.sdfTexture / sdfBox, see fieldUniforms). Includes noiseGLSL. */
export const fieldGLSL = /* glsl */ `
${noiseGLSL}
#ifndef CH3_FIELD
#define CH3_FIELD
uniform highp sampler3D uSdf;
uniform vec3 uSdfMin;
uniform vec3 uSdfMax;
float ch3Sdf(vec3 p) {
  return texture(uSdf, (p - uSdfMin) / (uSdfMax - uSdfMin)).r;
}
// Erosion field (mm); d = distance to the optimized surface. Where the solid already is the final surface
// (d < KEEP_SKIN) it never erodes: the optimized mesh beneath it is not drawn until the solid is gone.
float ch3Field(vec3 p, out float d) {
  d = ch3Sdf(p);
  if (d < ${f(KEEP_SKIN)}) return -1.0;
  return d + ${f(NOISE.amp)} * ch3Organic(p) * smoothstep(${f(NOISE.muteLo)}, ${f(NOISE.muteHi)}, d);
}
#endif
`;

function noise(x: number, y: number, z: number) {
  const L = noiseLattice();
  const n = NOISE_RES;
  const w = (v: number) => ((v % n) + n) % n;
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const q = (r: number) => r * r * r * (r * (r * 6 - 15) + 10);
  const ux = q(x - fx);
  const uy = q(y - fy);
  const uz = q(z - fz);
  const v = (i: number, j: number, k: number) => L[w(i) + n * (w(j) + n * w(k))] / 255;
  const m = (a: number, b: number, t: number) => a + (b - a) * t;
  const a = m(v(fx, fy, fz), v(fx + 1, fy, fz), ux);
  const b = m(v(fx, fy + 1, fz), v(fx + 1, fy + 1, fz), ux);
  const c = m(v(fx, fy, fz + 1), v(fx + 1, fy, fz + 1), ux);
  const d = m(v(fx, fy + 1, fz + 1), v(fx + 1, fy + 1, fz + 1), ux);
  return m(m(a, b, uy), m(c, d, uy), uz) * 2 - 1;
}

function organic(x: number, y: number, z: number) {
  const c = NOISE.coarse;
  const k = NOISE.fine;
  return (1 - NOISE.fineW) * noise(x * c, y * c, z * c) + NOISE.fineW * noise(x * k + 17.3, y * k + 5.1, z * k - 9.7);
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Threshold table: uThr for erosion fraction q is the (1 - q) quantile of the field over the erodible surface,
 * so the removed area grows evenly with q. 129 entries, q = i / 128.
 */
export function thresholdTable(samples: Float32Array): Float32Array {
  const values: number[] = [];
  const p = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < samples.length; i += 3) {
    p.x = samples[i];
    p.y = samples[i + 1];
    p.z = samples[i + 2];
    const d = sdOptimized(p);
    if (d < KEEP_SKIN) continue;
    values.push(d + NOISE.amp * organic(p.x, p.y, p.z) * smooth(NOISE.muteLo, NOISE.muteHi, d));
  }
  values.sort((a, b) => a - b);
  const out = new Float32Array(129);
  const last = values.length - 1;
  for (let i = 0; i <= 128; i++) {
    const at = (1 - i / 128) * last;
    const lo = Math.floor(at);
    const hi = Math.min(last, lo + 1);
    out[i] = values[lo] + (values[hi] - values[lo]) * (at - lo);
  }
  out[0] = values[last] + BAND + 0.1;
  out[128] = values[0] - 0.05;
  return out;
}

export function thresholdAt(table: Float32Array, q: number) {
  const at = Math.min(1, Math.max(0, q)) * 128;
  const lo = Math.floor(at);
  const hi = Math.min(128, lo + 1);
  return table[lo] + (table[hi] - table[lo]) * (at - lo);
}
