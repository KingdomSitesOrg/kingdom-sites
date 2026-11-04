// Textured PEI as two small tiling maps generated once from seeded noise (normal + roughness), so the bed, which
// fills half the frame in most shots, costs two texture reads instead of per-pixel noise.
import { DataTexture, LinearMipmapLinearFilter, LinearFilter, NoColorSpace, RepeatWrapping, RGBAFormat } from 'three';
import { seededRandom } from '@/strata/story';

const N = 256;

/** Tileable value noise on an N x N lattice with `cells` cells per side. */
function valueNoise(cells: number, seed: number): Float32Array {
  const rand = seededRandom(seed);
  const lattice = new Float32Array(cells * cells);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  const out = new Float32Array(N * N);
  const s = cells / N;
  for (let y = 0; y < N; y++) {
    const fy = y * s;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    const sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < N; x++) {
      const fx = x * s;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const sx = tx * tx * (3 - 2 * tx);
      const a = lattice[(y0 % cells) * cells + (x0 % cells)];
      const b = lattice[(y0 % cells) * cells + ((x0 + 1) % cells)];
      const c = lattice[((y0 + 1) % cells) * cells + (x0 % cells)];
      const d = lattice[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
      out[y * N + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    }
  }
  return out;
}

function texture(data: Uint8Array) {
  const t = new DataTexture(data, N, N, RGBAFormat);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = NoColorSpace;
  t.needsUpdate = true;
  return t;
}

let maps: { normal: Uint8Array; rough: Uint8Array } | null = null;

/** The two maps' texels, generated once per page. */
export function peiData() {
  return (maps ??= generate());
}

/** One tile covers `tileMM` of bed; set repeat = bed size / tileMM. */
export function createPeiTextures() {
  const { normal, rough } = peiData();
  return { normal: texture(normal), roughness: texture(rough) };
}

function generate() {
  const a = valueNoise(32, 11);
  const b = valueNoise(64, 23);
  const speck = seededRandom(37);
  const h = new Float32Array(N * N);
  for (let i = 0; i < h.length; i++) h[i] = a[i] * 0.55 + b[i] * 0.35 + speck() * 0.1;
  const normal = new Uint8Array(N * N * 4);
  const rough = new Uint8Array(N * N * 4);
  const at = (x: number, y: number) => h[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.2;
      const l = Math.hypot(dx, dy, 1);
      const o = (y * N + x) * 4;
      normal[o] = Math.round((-dx / l * 0.5 + 0.5) * 255);
      normal[o + 1] = Math.round((-dy / l * 0.5 + 0.5) * 255);
      normal[o + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
      normal[o + 3] = 255;
      const r = 0.82 + (h[y * N + x] - 0.5) * 0.35;
      rough[o] = rough[o + 1] = rough[o + 2] = Math.round(Math.min(1, Math.max(0, r)) * 255);
      rough[o + 3] = 255;
    }
  }
  return { normal, rough };
}
