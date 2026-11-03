// Deterministic, area-weighted surface samples.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SurfaceSampler = (count: number, seed?: number) => { positions: Float32Array; normals: Float32Array };

export function createSampler(positions: Float32Array, normals: Float32Array, index: Uint32Array | null): SurfaceSampler {
  const triCount = index ? index.length / 3 : positions.length / 9;
  const vid = (t: number, c: number) => (index ? index[t * 3 + c] : t * 3 + c);
  const cdf = new Float64Array(triCount);
  let total = 0;
  for (let t = 0; t < triCount; t++) {
    const a = vid(t, 0) * 3,
      b = vid(t, 1) * 3,
      c = vid(t, 2) * 3;
    const ux = positions[b] - positions[a],
      uy = positions[b + 1] - positions[a + 1],
      uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a],
      vy = positions[c + 1] - positions[a + 1],
      vz = positions[c + 2] - positions[a + 2];
    const cx = uy * vz - uz * vy,
      cy = uz * vx - ux * vz,
      cz = ux * vy - uy * vx;
    total += Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    cdf[t] = total;
  }
  return (count, seed = 1) => {
    const rand = mulberry32(seed);
    const pos = new Float32Array(count * 3);
    const nor = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = rand() * total;
      let lo = 0,
        hi = triCount - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cdf[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      let u = rand(),
        v = rand();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      const a = vid(lo, 0) * 3,
        b = vid(lo, 1) * 3,
        c = vid(lo, 2) * 3;
      let nx = 0,
        ny = 0,
        nz = 0;
      for (let k = 0; k < 3; k++) {
        pos[i * 3 + k] = positions[a + k] * w + positions[b + k] * u + positions[c + k] * v;
      }
      nx = normals[a] * w + normals[b] * u + normals[c] * v;
      ny = normals[a + 1] * w + normals[b + 1] * u + normals[c + 1] * v;
      nz = normals[a + 2] * w + normals[b + 2] * u + normals[c + 2] * v;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nor[i * 3] = nx / l;
      nor[i * 3 + 1] = ny / l;
      nor[i * 3 + 2] = nz / l;
    }
    return { positions: pos, normals: nor };
  };
}
