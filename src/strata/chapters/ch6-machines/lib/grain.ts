import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three';
import { seededRandom } from '@/strata/story';
import { hashGLSL } from '@/strata/shaders/noise';

const N = 256;
let shared: DataTexture | null = null;
let users = 0;

/**
 * One tileable grain texture for every surface in the chapter: R = fbm value noise (0..1), G/B = its x/y
 * gradient (0.5 = flat). Built once from a seeded lattice, mipmapped, so shaders sample instead of hashing.
 */
export function acquireGrain(): DataTexture {
  users++;
  if (shared) return shared;
  const rand = seededRandom(6006);
  const value = new Float32Array(N * N);
  const octave = (period: number, amp: number) => {
    const lattice = new Float32Array(period * period);
    for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
    const cell = N / period;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const fx = x / cell;
        const fy = y / cell;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const at = (i: number, j: number) => lattice[((j + period) % period) * period + ((i + period) % period)];
        const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
        const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
        value[y * N + x] += (a + (b - a) * sy) * amp;
      }
  };
  octave(16, 0.45);
  octave(32, 0.3);
  octave(64, 0.17);
  octave(128, 0.08);
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = value[y * N + x];
      const gx = value[y * N + ((x + 1) % N)] - value[y * N + ((x + N - 1) % N)];
      const gy = value[((y + 1) % N) * N + x] - value[((y + N - 1) % N) * N + x];
      const o = (y * N + x) * 4;
      data[o] = Math.round(Math.min(1, Math.max(0, v)) * 255);
      data[o + 1] = Math.round(Math.min(1, Math.max(0, 0.5 + gx * 4)) * 255);
      data[o + 2] = Math.round(Math.min(1, Math.max(0, 0.5 + gy * 4)) * 255);
      data[o + 3] = 255;
    }
  const tex = new DataTexture(data, N, N, RGBAFormat, UnsignedByteType);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  shared = tex;
  return tex;
}

export function releaseGrain() {
  users = Math.max(0, users - 1);
  if (users === 0 && shared) {
    shared.dispose();
    shared = null;
  }
}

/** `ch6G(uv)`: grain (x) and gradient (yz, centred on 0). Needs `uniform sampler2D uGrain;`. */
export const grainGLSL = /* glsl */ `
${hashGLSL}
#ifndef CH6_GRAIN
#define CH6_GRAIN
uniform sampler2D uGrain;
vec3 ch6G(vec2 uv) { vec4 t = texture2D(uGrain, uv); return vec3(t.r, t.g - 0.5, t.b - 0.5); }
#endif
`;
