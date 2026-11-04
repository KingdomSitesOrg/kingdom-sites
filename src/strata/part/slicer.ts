// Slices the optimized part with marching squares on its SDF: outlines, inset perimeters and gyroid infill.
import { TOOLPATH } from './constants';
import { createOptimizedField, type Field } from './sdf';

export type Slice = {
  y: number;
  /** Closed outer loops as (x, z) pairs, counter-clockwise (positive shoelace area in x-z), first point repeated last. */
  outer: Float32Array[];
  /** Closed hole loops, clockwise, first point repeated last. */
  holes: Float32Array[];
  /** Per island (same order as `outer`): inset loops, outermost level first; the holes' insets are included. */
  perimeters: Float32Array[][];
  /** Per island, the inset level of each loop in `perimeters` (0 = the outer perimeter, against the wall). */
  perimeterLevels: number[][];
  /** Open gyroid infill polylines (x, z) inside the innermost perimeter, in print order. */
  infill: Float32Array[];
};

const X0 = -45.5,
  X1 = 45.5,
  Z0 = -21.5,
  Z1 = 21.5;
const BLOCK = 8;

type Seg = { a: number; b: number; ax: number; az: number; bx: number; bz: number };

/** Directed marching squares: each segment keeps the region below `level` on its left. */
function contour(f: Float32Array, nx: number, nz: number, c: number, level: number): Seg[] {
  const segs: Seg[] = [];
  const P = [0, 0, 0, 0];
  const pt = (edge: number, i: number, j: number): [number, number, number] => {
    // edge 0: (i,j)-(i+1,j); 1: (i+1,j)-(i+1,j+1); 2: (i,j+1)-(i+1,j+1); 3: (i,j)-(i,j+1)
    let ia: number, ja: number, ib: number, jb: number, id: number;
    if (edge === 0) [ia, ja, ib, jb, id] = [i, j, i + 1, j, (j * nx + i) * 2];
    else if (edge === 1) [ia, ja, ib, jb, id] = [i + 1, j, i + 1, j + 1, (j * nx + i + 1) * 2 + 1];
    else if (edge === 2) [ia, ja, ib, jb, id] = [i, j + 1, i + 1, j + 1, ((j + 1) * nx + i) * 2];
    else [ia, ja, ib, jb, id] = [i, j, i, j + 1, (j * nx + i) * 2 + 1];
    const va = f[ja * nx + ia] - level,
      vb = f[jb * nx + ib] - level;
    const t = va / (va - vb);
    return [id, X0 + (ia + (ib - ia) * t) * c, Z0 + (ja + (jb - ja) * t) * c];
  };
  const crossA: number[] = [],
    crossB: number[] = [];
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      P[0] = f[j * nx + i] - level;
      P[1] = f[j * nx + i + 1] - level;
      P[2] = f[(j + 1) * nx + i + 1] - level;
      P[3] = f[(j + 1) * nx + i] - level;
      const in0 = P[0] < 0,
        in1 = P[1] < 0,
        in2 = P[2] < 0,
        in3 = P[3] < 0;
      if (in0 === in1 && in1 === in2 && in2 === in3) continue;
      crossA.length = 0;
      crossB.length = 0;
      const ins = [in0, in1, in2, in3];
      const order: number[] = [];
      for (let e = 0; e < 4; e++) {
        const s = ins[e],
          t = ins[(e + 1) % 4];
        if (s === t) continue;
        order.push(e);
        if (s) crossA.push(e);
        else crossB.push(e);
      }
      const emit = (ea: number, eb: number) => {
        const A = pt(ea, i, j),
          B = pt(eb, i, j);
        segs.push({ a: A[0], b: B[0], ax: A[1], az: A[2], bx: B[1], bz: B[2] });
      };
      if (order.length === 2) emit(crossA[0], crossB[0]);
      else {
        const centreInside = (P[0] + P[1] + P[2] + P[3]) * 0.25 < 0;
        // walk the four crossings counter-clockwise: A,B,A,B; pair each A with the next B or the previous one
        for (let k = 0; k < 4; k++) {
          const e = order[k];
          if (!crossA.includes(e)) continue;
          const pair = centreInside ? order[(k + 1) % 4] : order[(k + 3) % 4];
          emit(e, pair);
        }
      }
    }
  return segs;
}

/** Chains directed segments into closed loops (x, z pairs, first point repeated). */
function loops(segs: Seg[]): Float32Array[] {
  const byStart = new Map<number, number>();
  segs.forEach((s, i) => byStart.set(s.a, i));
  const used = new Uint8Array(segs.length);
  const out: Float32Array[] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const pts: number[] = [];
    let cur = i;
    while (cur !== undefined && !used[cur]) {
      used[cur] = 1;
      pts.push(segs[cur].ax, segs[cur].az);
      cur = byStart.get(segs[cur].b)!;
    }
    if (pts.length >= 6) {
      pts.push(pts[0], pts[1]);
      out.push(new Float32Array(pts));
    }
  }
  return out;
}

export function area(l: Float32Array) {
  let a = 0;
  for (let i = 0; i < l.length - 2; i += 2) a += l[i] * l[i + 3] - l[i + 2] * l[i + 1];
  return a / 2;
}

export function contains(l: Float32Array, x: number, z: number) {
  let inside = false;
  for (let i = 0, j = l.length - 4; i < l.length - 2; j = i, i += 2) {
    const xi = l[i],
      zi = l[i + 1],
      xj = l[j],
      zj = l[j + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Ramer-Douglas-Peucker on a closed or open (x, z) polyline. */
export function simplify(l: Float32Array, tol: number): Float32Array {
  const n = l.length / 2;
  if (n < 4) return l;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = l[a * 2],
      az = l[a * 2 + 1],
      bx = l[b * 2],
      bz = l[b * 2 + 1];
    const dx = bx - ax,
      dz = bz - az;
    const len2 = dx * dx + dz * dz;
    let best = -1,
      bestD = t2;
    for (let i = a + 1; i < b; i++) {
      const px = l[i * 2] - ax,
        pz = l[i * 2 + 1] - az;
      let d: number;
      if (len2 < 1e-12) d = px * px + pz * pz;
      else {
        const t = Math.max(0, Math.min(1, (px * dx + pz * dz) / len2));
        d = (px - t * dx) ** 2 + (pz - t * dz) ** 2;
      }
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  // a closed loop's start and end coincide, so also keep its far point
  if (l[0] === l[l.length - 2] && l[1] === l[l.length - 1]) keep[Math.floor(n / 2)] = 1;
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(l[i * 2], l[i * 2 + 1]);
  return new Float32Array(out);
}

export function rotateToNearest(l: Float32Array, x: number, z: number): Float32Array {
  const n = l.length / 2 - 1;
  let best = 0,
    bestD = Infinity;
  for (let i = 0; i < n; i++) {
    const d = (l[i * 2] - x) ** 2 + (l[i * 2 + 1] - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  if (best === 0) return l;
  const out = new Float32Array(l.length);
  for (let i = 0; i <= n; i++) {
    const s = (best + i) % n;
    out[i * 2] = l[s * 2];
    out[i * 2 + 1] = l[s * 2 + 1];
  }
  return out;
}

export class Slicer {
  private field: Field = createOptimizedField({ floor: false });
  private cache = new Map<string, Slice>();
  private readonly nx: number;
  private readonly nz: number;
  private readonly f: Float32Array;
  private readonly g: Float32Array;

  private readonly cell: number;

  constructor(cell: number) {
    this.cell = cell;
    this.nx = Math.ceil((X1 - X0) / cell) + 1;
    this.nz = Math.ceil((Z1 - Z0) / cell) + 1;
    this.f = new Float32Array(this.nx * this.nz);
    this.g = new Float32Array(this.nx * this.nz);
  }

  slice(y: number): Slice {
    const key = y.toFixed(4);
    const hit = this.cache.get(key);
    if (hit) return hit;
    const s = this.compute(y);
    if (this.cache.size > 600) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, s);
    return s;
  }

  private sample(y: number) {
    const { nx, nz, cell: c, f, field } = this;
    const r = ((BLOCK - 1) / 2) * c * Math.SQRT2;
    const deepest = TOOLPATH.lineWidth * TOOLPATH.perimeters + 0.6;
    for (let jb = 0; jb < nz; jb += BLOCK)
      for (let ib = 0; ib < nx; ib += BLOCK) {
        const i1 = Math.min(ib + BLOCK, nx),
          j1 = Math.min(jb + BLOCK, nz);
        const cx = X0 + ((ib + i1 - 1) / 2) * c,
          cz = Z0 + ((jb + j1 - 1) / 2) * c;
        const v = field.block(cx, y, cz, r + c);
        const far = v > r + c || v < -(r + c + deepest);
        for (let j = jb; j < j1; j++)
          for (let i = ib; i < i1; i++) f[j * nx + i] = far ? v : field.eval(X0 + i * c, y, Z0 + j * c);
      }
    field.clear();
  }

  private sampleGyroid(y: number) {
    const { nx, nz, cell: c } = this;
    const k = (2 * Math.PI) / TOOLPATH.infillCell;
    const sy = Math.sin(k * y),
      cy = Math.cos(k * y);
    for (let j = 0; j < nz; j++) {
      const z = Z0 + j * c;
      const sz = Math.sin(k * z),
        cz = Math.cos(k * z);
      for (let i = 0; i < nx; i++) {
        const x = X0 + i * c;
        this.g[j * nx + i] = Math.sin(k * x) * cy + sy * cz + sz * Math.cos(k * x);
      }
    }
  }

  /** Outer and hole loops only (no perimeters or infill), simplified to `tol` mm. Not cached. */
  outline(y: number, tol: number): { outer: Float32Array[]; holes: Float32Array[] } {
    const { nx, nz, cell: c, f } = this;
    this.sample(y);
    const all = loops(contour(f, nx, nz, c, 0)).map((l) => simplify(l, tol));
    return { outer: all.filter((l) => area(l) > 0), holes: all.filter((l) => area(l) < 0) };
  }

  private compute(y: number): Slice {
    const { nx, nz, cell: c, f } = this;
    this.sample(y);
    this.sampleGyroid(y);
    const w = TOOLPATH.lineWidth;
    const tol = Math.min(0.03, c * 0.12);
    const all = loops(contour(f, nx, nz, c, 0)).map((l) => simplify(l, tol));
    const outerRaw = all.filter((l) => area(l) > 0);
    const holeRaw = all.filter((l) => area(l) < 0);
    const islandOf = (l: Float32Array) => {
      let best = -1,
        bestA = Infinity;
      outerRaw.forEach((o, i) => {
        const a = area(o);
        if (a < bestA && contains(o, l[0], l[1])) {
          best = i;
          bestA = a;
        }
      });
      return best;
    };
    const levels: Float32Array[][] = [];
    for (let p = 0; p < TOOLPATH.perimeters; p++) {
      levels.push(loops(contour(f, nx, nz, c, -(w / 2 + p * w))).map((l) => simplify(l, tol)));
    }

    // island print order: greedy nearest neighbour from the front-left corner (-x, -z)
    const centroids = outerRaw.map((o) => {
      let x = 0,
        z = 0;
      const n = o.length / 2 - 1;
      for (let i = 0; i < n; i++) {
        x += o[i * 2];
        z += o[i * 2 + 1];
      }
      return [x / n, z / n];
    });
    const order: number[] = [];
    const done = new Uint8Array(outerRaw.length);
    let cx = X0,
      cz = Z0;
    for (let k = 0; k < outerRaw.length; k++) {
      let best = -1,
        bestD = Infinity;
      for (let i = 0; i < outerRaw.length; i++) {
        if (done[i]) continue;
        const d = (centroids[i][0] - cx) ** 2 + (centroids[i][1] - cz) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      done[best] = 1;
      order.push(best);
      [cx, cz] = centroids[best];
    }
    const remap = new Int32Array(outerRaw.length);
    order.forEach((o, i) => (remap[o] = i));

    let px = X0,
      pz = Z0;
    const outer = order.map((i) => {
      const l = rotateToNearest(outerRaw[i], px, pz);
      px = l[0];
      pz = l[1];
      return l;
    });
    const holes = holeRaw.map((l) => rotateToNearest(l, px, pz));
    const perimeters: Float32Array[][] = outer.map(() => []);
    const perimeterLevels: number[][] = outer.map(() => []);
    levels.forEach((lv, level) => {
      for (const l of lv) {
        const isl = islandOf(l);
        if (isl < 0) continue;
        perimeters[remap[isl]].push(l);
        perimeterLevels[remap[isl]].push(level);
      }
    });
    for (const list of perimeters) {
      for (let i = 0; i < list.length; i++) {
        list[i] = rotateToNearest(list[i], px, pz);
        px = list[i][0];
        pz = list[i][1];
      }
    }

    return { y, outer, holes, perimeters, perimeterLevels, infill: this.infill(px, pz) };
  }

  private infill(startX: number, startZ: number): Float32Array[] {
    const { nx, nz, cell: c, f, g } = this;
    const limit = -(TOOLPATH.lineWidth * TOOLPATH.perimeters) + 0.1;
    const segs = contour(g, nx, nz, c, 0);
    // value of the part field at a point on a grid edge
    const maskAt = (x: number, z: number) => {
      const u = (x - X0) / c,
        v = (z - Z0) / c;
      const i = Math.min(nx - 2, Math.max(0, Math.floor(u))),
        j = Math.min(nz - 2, Math.max(0, Math.floor(v)));
      const fu = u - i,
        fv = v - j;
      const a = f[j * nx + i] + (f[j * nx + i + 1] - f[j * nx + i]) * fu;
      const b = f[(j + 1) * nx + i] + (f[(j + 1) * nx + i + 1] - f[(j + 1) * nx + i]) * fu;
      return a + (b - a) * fv - limit;
    };
    type Clip = Seg & { cutA: boolean; cutB: boolean };
    const kept: Clip[] = [];
    for (const s of segs) {
      const ma = maskAt(s.ax, s.az),
        mb = maskAt(s.bx, s.bz);
      if (ma >= 0 && mb >= 0) continue;
      if (ma < 0 && mb < 0) {
        kept.push({ ...s, cutA: false, cutB: false });
        continue;
      }
      const t = ma / (ma - mb);
      const x = s.ax + (s.bx - s.ax) * t,
        z = s.az + (s.bz - s.az) * t;
      if (ma < 0) kept.push({ ...s, bx: x, bz: z, cutA: false, cutB: true });
      else kept.push({ ...s, ax: x, az: z, cutA: true, cutB: false });
    }
    const byStart = new Map<number, number>();
    const byEnd = new Map<number, number>();
    kept.forEach((s, i) => {
      if (!s.cutA) byStart.set(s.a, i);
      if (!s.cutB) byEnd.set(s.b, i);
    });
    const used = new Uint8Array(kept.length);
    const lines: Float32Array[] = [];
    const walk = (i: number) => {
      const pts: number[] = [kept[i].ax, kept[i].az];
      let cur: number | undefined = i;
      while (cur !== undefined && !used[cur]) {
        used[cur] = 1;
        const s: Clip = kept[cur];
        pts.push(s.bx, s.bz);
        cur = s.cutB ? undefined : byStart.get(s.b);
      }
      if (pts.length >= 4) lines.push(simplify(new Float32Array(pts), 0.02));
    };
    // open chains first (they start at a clip or a dangling end), then closed rings
    kept.forEach((s, i) => {
      if (!used[i] && (s.cutA || !byEnd.has(s.a))) walk(i);
    });
    kept.forEach((_, i) => {
      if (!used[i]) walk(i);
    });

    // greedy print order, flipping lines so each starts near the previous end
    const out: Float32Array[] = [];
    const left = new Set(lines.keys());
    let x = startX,
      z = startZ;
    while (left.size) {
      let best = -1,
        flip = false,
        bestD = Infinity;
      for (const i of left) {
        const l = lines[i];
        const d0 = (l[0] - x) ** 2 + (l[1] - z) ** 2;
        const d1 = (l[l.length - 2] - x) ** 2 + (l[l.length - 1] - z) ** 2;
        if (d0 < bestD) {
          bestD = d0;
          best = i;
          flip = false;
        }
        if (d1 < bestD) {
          bestD = d1;
          best = i;
          flip = true;
        }
      }
      left.delete(best);
      let l = lines[best];
      if (flip) {
        const r = new Float32Array(l.length);
        for (let i = 0; i < l.length; i += 2) {
          r[i] = l[l.length - 2 - i];
          r[i + 1] = l[l.length - 1 - i];
        }
        l = r;
      }
      out.push(l);
      x = l[l.length - 2];
      z = l[l.length - 1];
    }
    return out;
  }
}
