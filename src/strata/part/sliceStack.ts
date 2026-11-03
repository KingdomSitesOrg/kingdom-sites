// Ch4's deck: `count` evenly spaced slabs of the optimized part merged into one indexed geometry.
import { Earcut } from 'three/src/extras/Earcut.js';
import { LAYER, PART_SIZE } from './constants';
import { area, contains, type Slicer } from './slicer';

export type StackPayload = {
  positions: Float32Array;
  normals: Float32Array;
  /** Slab index per vertex, 0 (bottom) .. count - 1. */
  slice: Float32Array;
  index: Uint32Array;
  count: number;
  fill: number;
  triangles: number;
};

/**
 * Slab i is the slice at y = (i + 0.5) * spacing, extruded to `fill * spacing` and centred on that height, with
 * flat caps (normal +-y) and walls whose normals follow the outline. Slab 0 takes layer 1's section (LAYER.first),
 * so it is the shape Ch4 toolpaths.
 */
export function buildSliceStack(slicer: Slicer, count: number, fill: number, tol: number): StackPayload {
  const spacing = PART_SIZE.y / count;
  const half = (fill * spacing) / 2;
  const pos: number[] = [];
  const nrm: number[] = [];
  const sl: number[] = [];
  const idx: number[] = [];

  const vert = (x: number, y: number, z: number, nx: number, ny: number, nz: number, s: number) => {
    pos.push(x, y, z);
    nrm.push(nx, ny, nz);
    sl.push(s);
    return pos.length / 3 - 1;
  };
  // wind every triangle so its face normal agrees with the intended outward normal
  const tri = (a: number, b: number, c: number, nx: number, ny: number, nz: number) => {
    const ax = pos[a * 3],
      ay = pos[a * 3 + 1],
      az = pos[a * 3 + 2];
    const ux = pos[b * 3] - ax,
      uy = pos[b * 3 + 1] - ay,
      uz = pos[b * 3 + 2] - az;
    const vx = pos[c * 3] - ax,
      vy = pos[c * 3 + 1] - ay,
      vz = pos[c * 3 + 2] - az;
    const cx = uy * vz - uz * vy,
      cy = uz * vx - ux * vz,
      cz = ux * vy - uy * vx;
    if (cx * nx + cy * ny + cz * nz >= 0) idx.push(a, b, c);
    else idx.push(a, c, b);
  };

  for (let i = 0; i < count; i++) {
    const y = (i + 0.5) * spacing;
    const { outer, holes } = slicer.outline(i === 0 ? LAYER.first : y, tol);
    const islands = outer.map((o) => ({ o, holes: [] as Float32Array[] }));
    for (const h of holes) {
      let best = -1;
      for (let k = 0; k < outer.length; k++) {
        if ((best < 0 || area(outer[k]) < area(outer[best])) && contains(outer[k], h[0], h[1])) best = k;
      }
      if (best >= 0) islands[best].holes.push(h);
    }
    for (const isl of islands) {
      const rings = [isl.o, ...isl.holes];
      const data: number[] = [];
      const holeIndices: number[] = [];
      for (let r = 0; r < rings.length; r++) {
        if (r > 0) holeIndices.push(data.length / 2);
        const l = rings[r];
        for (let k = 0; k < l.length - 2; k += 2) data.push(l[k], l[k + 1]);
      }
      const tris = Earcut.triangulate(data, holeIndices, 2);
      for (const [yy, ny] of [
        [y + half, 1],
        [y - half, -1],
      ] as const) {
        const base = pos.length / 3;
        for (let k = 0; k < data.length; k += 2) vert(data[k], yy, data[k + 1], 0, ny, 0, i);
        for (let k = 0; k < tris.length; k += 3) tri(base + tris[k], base + tris[k + 1], base + tris[k + 2], 0, ny, 0);
      }
      // walls: the solid is on the left of every directed loop, so the outward normal is on the right
      for (const l of rings) {
        const n = l.length / 2 - 1;
        if (n < 3) continue;
        const base = pos.length / 3;
        for (let k = 0; k < n; k++) {
          const p = (k + n - 1) % n,
            q = (k + 1) % n;
          let ex = l[q * 2 + 1] - l[p * 2 + 1],
            ez = -(l[q * 2] - l[p * 2]);
          const len = Math.hypot(ex, ez) || 1;
          ex /= len;
          ez /= len;
          vert(l[k * 2], y + half, l[k * 2 + 1], ex, 0, ez, i);
          vert(l[k * 2], y - half, l[k * 2 + 1], ex, 0, ez, i);
        }
        for (let k = 0; k < n; k++) {
          const q = (k + 1) % n;
          const a = base + k * 2,
            b = base + q * 2;
          const ox = l[q * 2 + 1] - l[k * 2 + 1],
            oz = -(l[q * 2] - l[k * 2]);
          tri(a, a + 1, b + 1, ox, 0, oz);
          tri(a, b + 1, b, ox, 0, oz);
        }
      }
    }
  }
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nrm),
    slice: new Float32Array(sl),
    index: new Uint32Array(idx),
    count,
    fill,
    triangles: idx.length / 3,
  };
}

export function stackBuffers(s: StackPayload): ArrayBuffer[] {
  return [s.positions.buffer, s.normals.buffer, s.slice.buffer, s.index.buffer] as ArrayBuffer[];
}
