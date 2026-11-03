import type { Field } from './sdf';

export type MeshBuffers = {
  positions: Float32Array;
  normals: Float32Array;
  index: Uint32Array;
};

export type MeshStats = { evals: number; blocksSkipped: number; blocks: number; ms: number };

const BLOCK = 8;
const SQRT3 = Math.sqrt(3);

/**
 * Naive surface nets on a bounded grid with narrow-band block culling. Vertices are projected onto the
 * zero set with one Newton step and get normals from the field gradient.
 */
export function surfaceNets(
  field: Field,
  min: [number, number, number],
  max: [number, number, number],
  h: number,
  /** Dual-contouring vertex placement: crisp creases and hole rims, about twice the vertex cost. */
  sharp = true,
  /** Seam plane (grid x index) when meshing one of two x halves: faces past it belong to the other half. */
  seamI = Infinity,
): { mesh: MeshBuffers; stats: MeshStats } {
  const t0 = performance.now();
  const nx = Math.ceil((max[0] - min[0]) / h) + 1;
  const ny = Math.ceil((max[1] - min[1]) / h) + 1;
  const nz = Math.ceil((max[2] - min[2]) / h) + 1;
  const ox = min[0],
    oy = min[1],
    oz = min[2];
  const sxy = nx * ny;
  const values = new Float32Array(nx * ny * nz);
  const bx = Math.ceil(nx / BLOCK),
    by = Math.ceil(ny / BLOCK),
    bz = Math.ceil(nz / BLOCK);
  const rPoints = ((BLOCK - 1) * h * SQRT3) / 2;
  const rCull = rPoints + 2.5 * h * SQRT3;
  const blockNear = new Uint8Array(bx * by * bz);
  let evals = 0;
  let skipped = 0;

  // pass 1: grid values
  for (let kb = 0; kb < bz; kb++)
    for (let jb = 0; jb < by; jb++)
      for (let ib = 0; ib < bx; ib++) {
        const i0 = ib * BLOCK,
          j0 = jb * BLOCK,
          k0 = kb * BLOCK;
        const i1 = Math.min(i0 + BLOCK, nx),
          j1 = Math.min(j0 + BLOCK, ny),
          k1 = Math.min(k0 + BLOCK, nz);
        const cx = ox + ((i0 + i1 - 1) / 2) * h;
        const cy = oy + ((j0 + j1 - 1) / 2) * h;
        const cz = oz + ((k0 + k1 - 1) / 2) * h;
        const v = field.block(cx, cy, cz, rCull);
        evals++;
        if (Math.abs(v) > rPoints + h) {
          skipped++;
          for (let k = k0; k < k1; k++)
            for (let j = j0; j < j1; j++) {
              const row = k * sxy + j * nx;
              for (let i = i0; i < i1; i++) values[row + i] = v;
            }
          continue;
        }
        blockNear[ib + jb * bx + kb * bx * by] = 1;
        for (let k = k0; k < k1; k++) {
          const z = oz + k * h;
          for (let j = j0; j < j1; j++) {
            const y = oy + j * h;
            const row = k * sxy + j * nx;
            for (let i = i0; i < i1; i++) values[row + i] = field.eval(ox + i * h, y, z);
          }
        }
        evals += (i1 - i0) * (j1 - j0) * (k1 - k0);
      }

  // pass 2: one vertex per sign-changing cell
  const cnx = nx - 1,
    cny = ny - 1;
  const cellVert = new Int32Array(cnx * cny * (nz - 1)).fill(-1);
  const pos: number[] = [];
  const nor: number[] = [];
  const eps = h * 0.05;
  const g = { d: 0, x: 0, y: 0, z: 0 };
  const grad = (x: number, y: number, z: number) => {
    // tetrahedral differences: four samples give the value and the gradient
    const a = field.eval(x + eps, y - eps, z - eps);
    const b = field.eval(x - eps, y - eps, z + eps);
    const c = field.eval(x - eps, y + eps, z - eps);
    const d = field.eval(x + eps, y + eps, z + eps);
    g.d = (a + b + c + d) * 0.25;
    g.x = a - b - c + d;
    g.y = -a - b + c + d;
    g.z = -a + b - c + d;
    const l = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) || 1;
    g.x /= l;
    g.y /= l;
    g.z /= l;
  };
  const corner = [0, 0, 0, 0, 0, 0, 0, 0];
  const EDGES = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  for (let kb = 0; kb < bz; kb++)
    for (let jb = 0; jb < by; jb++)
      for (let ib = 0; ib < bx; ib++) {
        // a cell can straddle into the next block; check this block and its +1 neighbours for nearness
        let near = false;
        for (let dk = 0; dk < 2 && !near; dk++)
          for (let dj = 0; dj < 2 && !near; dj++)
            for (let di = 0; di < 2 && !near; di++) {
              const a = ib + di,
                b = jb + dj,
                c = kb + dk;
              if (a < bx && b < by && c < bz && blockNear[a + b * bx + c * bx * by]) near = true;
            }
        if (!near) continue;
        const i0 = ib * BLOCK,
          j0 = jb * BLOCK,
          k0 = kb * BLOCK;
        const i1 = Math.min(i0 + BLOCK, cnx),
          j1 = Math.min(j0 + BLOCK, cny),
          k1 = Math.min(k0 + BLOCK, nz - 1);
        let prepared = false;
        for (let k = k0; k < k1; k++)
          for (let j = j0; j < j1; j++)
            for (let i = i0; i < i1; i++) {
              const base = k * sxy + j * nx + i;
              let mask = 0;
              for (let c = 0; c < 8; c++) {
                const v = values[base + (c & 1) + ((c >> 1) & 1) * nx + ((c >> 2) & 1) * sxy];
                corner[c] = v;
                if (v < 0) mask |= 1 << c;
              }
              if (mask === 0 || mask === 255) continue;
              if (!prepared) {
                const cx = ox + (i0 + BLOCK / 2) * h;
                const cy = oy + (j0 + BLOCK / 2) * h;
                const cz = oz + (k0 + BLOCK / 2) * h;
                field.block(cx, cy, cz, rCull);
                prepared = true;
              }
              // dual-contouring vertex: least squares on the tangent planes at the edge crossings, pulled
              // gently towards their mass point, so creases and hole rims stay crisp instead of zig-zagging
              // only cells whose corner field bends sharply pay for the exact tangent planes
              const crease = sharp && isCrease(corner);
              let mx = 0,
                my = 0,
                mz = 0,
                cnt = 0;
              let a00 = 0,
                a01 = 0,
                a02 = 0,
                a11 = 0,
                a12 = 0,
                a22 = 0,
                b0 = 0,
                b1 = 0,
                b2 = 0;
              for (let e = 0; e < 12; e++) {
                const ea = EDGES[e][0],
                  eb = EDGES[e][1];
                const va = corner[ea],
                  vb = corner[eb];
                if (va < 0 === vb < 0) continue;
                const t = va / (va - vb);
                const cx = ox + (i + (ea & 1) + ((eb & 1) - (ea & 1)) * t) * h;
                const cy = oy + (j + ((ea >> 1) & 1) + (((eb >> 1) & 1) - ((ea >> 1) & 1)) * t) * h;
                const cz = oz + (k + ((ea >> 2) & 1) + (((eb >> 2) & 1) - ((ea >> 2) & 1)) * t) * h;
                cnt++;
                if (!crease) {
                  mx += cx;
                  my += cy;
                  mz += cz;
                  continue;
                }
                grad(cx, cy, cz);
                // snap the crossing onto the surface along its normal before using its plane
                const qx = cx - g.x * g.d,
                  qy = cy - g.y * g.d,
                  qz = cz - g.z * g.d;
                const nd = g.x * qx + g.y * qy + g.z * qz;
                a00 += g.x * g.x;
                a01 += g.x * g.y;
                a02 += g.x * g.z;
                a11 += g.y * g.y;
                a12 += g.y * g.z;
                a22 += g.z * g.z;
                b0 += g.x * nd;
                b1 += g.y * nd;
                b2 += g.z * nd;
                mx += qx;
                my += qy;
                mz += qz;
              }
              mx /= cnt;
              my /= cnt;
              mz /= cnt;
              const lam = 0.08 * cnt;
              a00 += lam;
              a11 += lam;
              a22 += lam;
              b0 += lam * mx;
              b1 += lam * my;
              b2 += lam * mz;
              const c00 = a11 * a22 - a12 * a12,
                c01 = a02 * a12 - a01 * a22,
                c02 = a01 * a12 - a02 * a11;
              const det = a00 * c00 + a01 * c01 + a02 * c02;
              let px = mx,
                py = my,
                pz = mz;
              if (crease && Math.abs(det) > 1e-12) {
                const c11 = a00 * a22 - a02 * a02,
                  c12 = a01 * a02 - a00 * a12,
                  c22 = a00 * a11 - a01 * a01;
                px = (c00 * b0 + c01 * b1 + c02 * b2) / det;
                py = (c01 * b0 + c11 * b1 + c12 * b2) / det;
                pz = (c02 * b0 + c12 * b1 + c22 * b2) / det;
              }
              // keep the vertex inside its (slightly grown) cell
              const lo = -0.25 * h,
                hi = 1.25 * h;
              px = Math.min(ox + i * h + hi, Math.max(ox + i * h + lo, px));
              py = Math.min(oy + j * h + hi, Math.max(oy + j * h + lo, py));
              pz = Math.min(oz + k * h + hi, Math.max(oz + k * h + lo, pz));
              grad(px, py, pz);
              const step = Math.max(-h, Math.min(h, g.d));
              px -= g.x * step;
              py -= g.y * step;
              pz -= g.z * step;
              grad(px, py, pz);
              evals += 8 + (crease ? cnt * 4 : 0);
              cellVert[i + j * cnx + k * cnx * cny] = pos.length / 3;
              pos.push(px, py, pz);
              nor.push(g.x, g.y, g.z);
            }
      }
  field.clear();

  // pass 3: a quad for every sign-changing grid edge
  const idx: number[] = [];
  const P = pos;
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) {
      const t = b;
      b = d;
      d = t;
    }
    // split along the shorter diagonal
    const ac = (P[a * 3] - P[c * 3]) ** 2 + (P[a * 3 + 1] - P[c * 3 + 1]) ** 2 + (P[a * 3 + 2] - P[c * 3 + 2]) ** 2;
    const bd = (P[b * 3] - P[d * 3]) ** 2 + (P[b * 3 + 1] - P[d * 3 + 1]) ** 2 + (P[b * 3 + 2] - P[d * 3 + 2]) ** 2;
    if (ac <= bd) idx.push(a, b, c, a, c, d);
    else idx.push(a, b, d, b, c, d);
  };
  const cv = (i: number, j: number, k: number) =>
    i < 0 || j < 0 || k < 0 || i >= cnx || j >= cny || k >= nz - 1 ? -1 : cellVert[i + j * cnx + k * cnx * cny];
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const base = k * sxy + j * nx + i;
        const inside = values[base] < 0;
        if (i + 1 < nx && i < seamI && inside !== values[base + 1] < 0) {
          quad(cv(i, j - 1, k - 1), cv(i, j, k - 1), cv(i, j, k), cv(i, j - 1, k), !inside);
        }
        if (j + 1 < ny && i <= seamI && inside !== values[base + nx] < 0) {
          quad(cv(i - 1, j, k - 1), cv(i - 1, j, k), cv(i, j, k), cv(i, j, k - 1), !inside);
        }
        if (k + 1 < nz && i <= seamI && inside !== values[base + sxy] < 0) {
          quad(cv(i - 1, j - 1, k), cv(i, j - 1, k), cv(i, j, k), cv(i - 1, j, k), !inside);
        }
      }

  return {
    mesh: {
      positions: new Float32Array(pos),
      normals: new Float32Array(nor),
      index: new Uint32Array(idx),
    },
    stats: { evals, blocksSkipped: skipped, blocks: bx * by * bz, ms: performance.now() - t0 },
  };
}

const CREASE_EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];
const cn: number[] = [];
/** Trilinear normals at the cell's edge crossings disagree by more than ~11 degrees. */
function isCrease(c: number[]): boolean {
  cn.length = 0;
  let ax = 0,
    ay = 0,
    az = 0;
  for (const [ea, eb] of CREASE_EDGES) {
    const va = c[ea],
      vb = c[eb];
    if (va < 0 === vb < 0) continue;
    const t = va / (va - vb);
    const u = (ea & 1) + ((eb & 1) - (ea & 1)) * t;
    const v = ((ea >> 1) & 1) + (((eb >> 1) & 1) - ((ea >> 1) & 1)) * t;
    const w = ((ea >> 2) & 1) + (((eb >> 2) & 1) - ((ea >> 2) & 1)) * t;
    const gx = (1 - v) * (1 - w) * (c[1] - c[0]) + v * (1 - w) * (c[3] - c[2]) + (1 - v) * w * (c[5] - c[4]) + v * w * (c[7] - c[6]);
    const gy = (1 - u) * (1 - w) * (c[2] - c[0]) + u * (1 - w) * (c[3] - c[1]) + (1 - u) * w * (c[6] - c[4]) + u * w * (c[7] - c[5]);
    const gz = (1 - u) * (1 - v) * (c[4] - c[0]) + u * (1 - v) * (c[5] - c[1]) + (1 - u) * v * (c[6] - c[2]) + u * v * (c[7] - c[3]);
    const l = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    cn.push(gx / l, gy / l, gz / l);
    ax += gx / l;
    ay += gy / l;
    az += gz / l;
  }
  const l = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
  for (let i = 0; i < cn.length; i += 3) if ((cn[i] * ax + cn[i + 1] * ay + cn[i + 2] * az) / l < 0.98) return true;
  return false;
}

/** Signed volume of a closed indexed triangle mesh (mm^3). */
export function meshVolume(positions: Float32Array, index: Uint32Array): number {
  let v = 0;
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t] * 3,
      b = index[t + 1] * 3,
      c = index[t + 2] * 3;
    const ax = positions[a],
      ay = positions[a + 1],
      az = positions[a + 2];
    const bx = positions[b],
      by = positions[b + 1],
      bz = positions[b + 2];
    const cx = positions[c],
      cy = positions[c + 1],
      cz = positions[c + 2];
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return v / 6;
}
