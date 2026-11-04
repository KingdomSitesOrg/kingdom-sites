// One continuous nozzle path per layer: perimeters, infill and the travel moves between them, in print order.
import { contains, rotateToNearest, type Slice } from './slicer';

/** 0 outer perimeter, 1 inset perimeter, 2 infill, 3 travel. */
export type ToolpathClass = 0 | 1 | 2 | 3;
export const TOOLPATH_CLASS = { outer: 0, inset: 1, infill: 2, travel: 3 } as const;

export type Toolpath = {
  /** Layer height (mm). */
  y: number;
  /** Every nozzle position in print order as (x, z) pairs (mm); printed and travel moves form one continuous path. */
  xz: Float32Array;
  /** Cumulative arc length (mm) at each point, travel included; dist[0] = 0. */
  dist: Float32Array;
  /** Class of the move that ends at each point; cls[0] repeats the first move's class (0). */
  cls: Uint8Array;
  /** Runs of one class as (class, first point, last point) triples, in order; consecutive runs share a point. */
  runs: Int32Array;
  /** S1: where the outer perimeter starts, which is also xz[0], xz[1] ([0, 0] for a layer above the part). */
  start: [number, number];
  /** Path length per class (mm): outer, inset, infill, travel. */
  lengths: [number, number, number, number];
  /** Printed length (classes 0-2) and the whole path including travel (= dist[last]). */
  printedMM: number;
  totalMM: number;
};

const EPS2 = 1e-8;

export function buildToolpath(s: Slice): Toolpath {
  const xs: number[] = [];
  const cl: number[] = [];
  let px = NaN,
    pz = NaN;

  const piece = (l: Float32Array, c: ToolpathClass, reverse = false) => {
    const n = l.length / 2;
    const at = (i: number) => (reverse ? n - 1 - i : i) * 2;
    const sx = l[at(0)],
      sz = l[at(0) + 1];
    if (xs.length === 0) {
      xs.push(sx, sz);
      cl.push(c);
    } else if ((sx - px) ** 2 + (sz - pz) ** 2 > EPS2) {
      xs.push(sx, sz);
      cl.push(3);
    }
    for (let i = 1; i < n; i++) {
      const o = at(i);
      xs.push(l[o], l[o + 1]);
      cl.push(c);
    }
    px = l[at(n - 1)];
    pz = l[at(n - 1) + 1];
  };

  // infill lines belong to the smallest island that contains their first point
  const islandArea = s.outer.map((o) => {
    let a = 0;
    for (let i = 0; i < o.length - 2; i += 2) a += o[i] * o[i + 3] - o[i + 2] * o[i + 1];
    return a / 2;
  });
  const infillOf: Float32Array[][] = s.outer.map(() => []);
  for (const line of s.infill) {
    let best = -1;
    for (let i = 0; i < s.outer.length; i++) {
      if ((best < 0 || islandArea[i] < islandArea[best]) && contains(s.outer[i], line[0], line[1])) best = i;
    }
    infillOf[best < 0 ? s.outer.length - 1 : best]?.push(line);
  }

  for (let isl = 0; isl < s.outer.length; isl++) {
    const loops = s.perimeters[isl];
    const levels = s.perimeterLevels[isl];
    // each closed loop starts at its point nearest the nozzle (the first one nearest the front-left corner)
    for (let i = 0; i < loops.length; i++) {
      const from = xs.length ? [px, pz] : [s.outer[0][0], s.outer[0][1]];
      piece(rotateToNearest(loops[i], from[0], from[1]), levels[i] === 0 ? 0 : 1);
    }
    // nearest-neighbour order inside the island, flipping lines so each starts near the previous end
    const left = infillOf[isl].slice();
    while (left.length) {
      let best = 0,
        flip = false,
        bestD = Infinity;
      for (let i = 0; i < left.length; i++) {
        const l = left[i];
        const d0 = (l[0] - px) ** 2 + (l[1] - pz) ** 2;
        const d1 = (l[l.length - 2] - px) ** 2 + (l[l.length - 1] - pz) ** 2;
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
      piece(left[best], 2, flip);
      left[best] = left[left.length - 1];
      left.pop();
    }
  }

  const n = xs.length / 2;
  const xz = new Float32Array(xs);
  const cls = Uint8Array.from(cl);
  const dist = new Float32Array(n);
  const lengths: [number, number, number, number] = [0, 0, 0, 0];
  let acc = 0;
  for (let i = 1; i < n; i++) {
    const seg = Math.hypot(xs[i * 2] - xs[i * 2 - 2], xs[i * 2 + 1] - xs[i * 2 - 1]);
    acc += seg;
    dist[i] = acc;
    lengths[cls[i]] += seg;
  }
  const runs: number[] = [];
  for (let i = 1; i < n; i++) {
    if (runs.length && runs[runs.length - 3] === cls[i] && runs[runs.length - 1] === i - 1) runs[runs.length - 1] = i;
    else runs.push(cls[i], i - 1, i);
  }
  return {
    y: s.y,
    xz,
    dist,
    cls,
    runs: Int32Array.from(runs),
    start: n ? [xs[0], xs[1]] : [0, 0],
    lengths,
    printedMM: lengths[0] + lengths[1] + lengths[2],
    totalMM: acc,
  };
}

/** Nozzle position at arc length `d` (mm), clamped to the path; writes into `out` and returns the move's class. */
export function toolpathAt(tp: Toolpath, d: number, out: { x: number; z: number }): ToolpathClass {
  const { dist, xz } = tp;
  const n = dist.length;
  if (n === 0) {
    out.x = 0;
    out.z = 0;
    return 3;
  }
  if (d <= 0 || n === 1) {
    out.x = xz[0];
    out.z = xz[1];
    return tp.cls[0] as ToolpathClass;
  }
  if (d >= dist[n - 1]) {
    out.x = xz[(n - 1) * 2];
    out.z = xz[(n - 1) * 2 + 1];
    return tp.cls[n - 1] as ToolpathClass;
  }
  let lo = 0,
    hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (dist[mid] <= d) lo = mid;
    else hi = mid;
  }
  const t = (d - dist[lo]) / (dist[hi] - dist[lo] || 1);
  out.x = xz[lo * 2] + (xz[hi * 2] - xz[lo * 2]) * t;
  out.z = xz[lo * 2 + 1] + (xz[hi * 2 + 1] - xz[lo * 2 + 1]) * t;
  return tp.cls[hi] as ToolpathClass;
}

/**
 * Line-segment buffers for the given classes, ready for LineSegmentsGeometry.setPositions (or a plain
 * LineSegments): positions are (x, y, z) pairs at the layer height plus `lift`, and `dist` holds each vertex's
 * cumulative arc length (two per segment) for a draw-on by `uDrawMM`.
 */
export function toolpathSegments(
  tp: Toolpath,
  classes: readonly ToolpathClass[],
  lift = 0,
): { positions: Float32Array; dist: Float32Array; count: number } {
  const want = [false, false, false, false];
  for (const c of classes) want[c] = true;
  let count = 0;
  for (let i = 1; i < tp.cls.length; i++) if (want[tp.cls[i]]) count++;
  const positions = new Float32Array(count * 6);
  const dist = new Float32Array(count * 2);
  const y = tp.y + lift;
  let o = 0;
  for (let i = 1; i < tp.cls.length; i++) {
    if (!want[tp.cls[i]]) continue;
    const p = o * 6;
    positions[p] = tp.xz[i * 2 - 2];
    positions[p + 1] = y;
    positions[p + 2] = tp.xz[i * 2 - 1];
    positions[p + 3] = tp.xz[i * 2];
    positions[p + 4] = y;
    positions[p + 5] = tp.xz[i * 2 + 1];
    dist[o * 2] = tp.dist[i - 1];
    dist[o * 2 + 1] = tp.dist[i];
    o++;
  }
  return { positions, dist, count };
}

/** Typed arrays to transfer out of a worker. */
export function toolpathBuffers(tp: Toolpath): ArrayBuffer[] {
  return [tp.xz.buffer, tp.dist.buffer, tp.cls.buffer, tp.runs.buffer] as ArrayBuffer[];
}
