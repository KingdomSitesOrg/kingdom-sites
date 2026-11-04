// The nozzle as a pure function of p. Layers 1-3 follow their exact toolpaths (STORYBOARD Ch5 layer mapping);
// the time-lapse runs one continuous playhead across the representative layers, so the head never teleports
// when the cached layer changes: each switch starts at the point nearest the old position, after a short travel.
import type { Toolpath } from '@/strata/part';
import { BEAT, layerAt, parkAt } from './timeline';

/** Travel moves count at this fraction of their length (the head travels faster than it prints). */
const TRAVEL_W = 0.35;
/** Time-lapse playhead speed in path millimetres per unit p. */
const LAPSE_SPEED = 2600;
/** Trail length behind the nozzle (mm of printed path) and the longest piece. */
export const TRAIL_MM = 40;
const PIECE_MM = 0.6;

export const PARK = { x: -116, lift: 10, z: -104 } as const;

interface Timed {
  tp: Toolpath;
  /** Time-weighted cumulative length per point (printed mm count 1, travel TRAVEL_W). */
  t: Float32Array;
  total: number;
  /** total + the closing travel back to the start. */
  cyclic: number;
  close: number;
}

interface Seg {
  p0: number;
  path: Timed;
  tau0: number;
  leadX: number;
  leadZ: number;
  leadLen: number;
}

export interface XZ {
  x: number;
  z: number;
}

function timed(tp: Toolpath): Timed {
  const n = tp.dist.length;
  const t = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    const seg = tp.dist[i] - tp.dist[i - 1];
    t[i] = t[i - 1] + seg * (tp.cls[i] === 3 ? TRAVEL_W : 1);
  }
  const total = n ? t[n - 1] : 0;
  const ex = n ? tp.xz[(n - 1) * 2] - tp.xz[0] : 0;
  const ez = n ? tp.xz[(n - 1) * 2 + 1] - tp.xz[1] : 0;
  const close = Math.hypot(ex, ez) * TRAVEL_W;
  return { tp, t, total, cyclic: total + close, close };
}

/** Index i with t[i] <= tau < t[i + 1] (clamped). */
function seek(t: Float32Array, tau: number): number {
  let lo = 0,
    hi = t.length - 1;
  if (tau <= 0) return 0;
  if (tau >= t[hi]) return Math.max(0, hi - 1);
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid] <= tau) lo = mid;
    else hi = mid;
  }
  return lo;
}

function pointAt(path: Timed, tau: number, out: XZ): number {
  const { t, tp } = path;
  const n = t.length;
  if (n === 0) {
    out.x = 0;
    out.z = 0;
    return 3;
  }
  if (tau >= path.total) {
    // closing travel back to the start (cyclic playhead)
    const u = path.close > 0 ? Math.min(1, (tau - path.total) / path.close) : 1;
    out.x = tp.xz[(n - 1) * 2] + (tp.xz[0] - tp.xz[(n - 1) * 2]) * u;
    out.z = tp.xz[(n - 1) * 2 + 1] + (tp.xz[1] - tp.xz[(n - 1) * 2 + 1]) * u;
    return 3;
  }
  const i = seek(t, tau);
  const j = Math.min(n - 1, i + 1);
  const u = t[j] > t[i] ? (tau - t[i]) / (t[j] - t[i]) : 0;
  out.x = tp.xz[i * 2] + (tp.xz[j * 2] - tp.xz[i * 2]) * u;
  out.z = tp.xz[i * 2 + 1] + (tp.xz[j * 2 + 1] - tp.xz[i * 2 + 1]) * u;
  return tp.cls[j];
}

/** Inverse of layerAt over the time-lapse (monotonic): bisection. */
function pForLayer(L: number): number {
  let lo: number = BEAT.macro,
    hi: number = BEAT.close;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (layerAt(mid) < L) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const tmp: XZ = { x: 0, z: 0 };

export class NozzleMotion {
  readonly start: [number, number];
  /** Layer 1's exact toolpath (Ch4 draws the same one as lines). */
  readonly layer1: Toolpath;
  private exact: Timed[];
  private segs: Seg[] = [];
  /** Layer number of each representative path, for the HUD plot. */
  readonly repLayers: number[];
  readonly repPaths: Toolpath[];

  /** exact: layers 1-4 in order. reps: representative layers above layer 4, sorted by layer. */
  constructor(exact: Toolpath[], reps: { layer: number; tp: Toolpath }[]) {
    this.exact = exact.map(timed);
    this.layer1 = exact[0];
    this.start = [exact[0].start[0], exact[0].start[1]];
    const list = [{ layer: 4, path: this.exact[3] }, ...reps.map((r) => ({ layer: r.layer, path: timed(r.tp) }))];
    this.repLayers = list.map((l) => l.layer);
    this.repPaths = list.map((l) => l.path.tp);
    const l3 = this.exact[2].tp;
    const e3x = l3.xz[l3.xz.length - 2],
      e3z = l3.xz[l3.xz.length - 1];
    const s4 = this.exact[3].tp.start;
    this.segs.push({
      p0: BEAT.macro,
      path: this.exact[3],
      tau0: 0,
      leadX: e3x,
      leadZ: e3z,
      leadLen: Math.hypot(s4[0] - e3x, s4[1] - e3z) * TRAVEL_W,
    });
    for (let k = 1; k < list.length; k++) {
      const p0 = pForLayer((list[k - 1].layer + list[k].layer) / 2);
      this.lapseAt(p0, tmp);
      const path = list[k].path;
      const xz = path.tp.xz;
      let best = 0,
        bestD = Infinity;
      for (let i = 0; i < xz.length; i += 2) {
        const d = (xz[i] - tmp.x) ** 2 + (xz[i + 1] - tmp.z) ** 2;
        if (d < bestD && path.tp.cls[i >> 1] !== 3) {
          bestD = d;
          best = i >> 1;
        }
      }
      this.segs.push({ p0, path, tau0: path.t[best], leadX: tmp.x, leadZ: tmp.z, leadLen: Math.sqrt(bestD) * TRAVEL_W });
    }
  }

  private segAt(p: number): Seg {
    let s = this.segs[0];
    for (let k = 1; k < this.segs.length; k++) {
      if (this.segs[k].p0 <= p) s = this.segs[k];
      else break;
    }
    return s;
  }

  private lapseAt(p: number, out: XZ): number {
    const s = this.segAt(p);
    const tau = Math.max(0, (p - s.p0) * LAPSE_SPEED);
    if (tau < s.leadLen) {
      pointAt(s.path, s.tau0, out);
      const u = tau / s.leadLen;
      out.x = s.leadX + (out.x - s.leadX) * u;
      out.z = s.leadZ + (out.z - s.leadZ) * u;
      return 3;
    }
    return pointAt(s.path, (s.tau0 + tau - s.leadLen) % s.path.cyclic, out);
  }

  /** Exact layers 1-3 by continuous layer L in [1, 4): position at fraction fract(L), lead-in from the last layer's end. */
  private exactAt(L: number, out: XZ): number {
    const k = Math.min(3, Math.max(1, Math.floor(L)));
    const f = Math.min(1, Math.max(0, L - k));
    const path = this.exact[k - 1];
    let lx = path.tp.start[0],
      lz = path.tp.start[1];
    if (k > 1) {
      const prev = this.exact[k - 2].tp.xz;
      lx = prev[prev.length - 2];
      lz = prev[prev.length - 1];
    }
    const lead = Math.hypot(path.tp.start[0] - lx, path.tp.start[1] - lz) * TRAVEL_W;
    const tau = f * (lead + path.total);
    if (tau < lead) {
      const u = tau / lead;
      out.x = lx + (path.tp.start[0] - lx) * u;
      out.z = lz + (path.tp.start[1] - lz) * u;
      return 3;
    }
    return pointAt(path, tau - lead, out);
  }

  /** Nozzle tip xz (mm) before the park. */
  printAt(p: number, out: XZ): number {
    if (p <= BEAT.hold) {
      out.x = this.start[0];
      out.z = this.start[1];
      return 0;
    }
    if (p < BEAT.macro) return this.exactAt(layerAt(p), out);
    return this.lapseAt(Math.min(p, BEAT.close), out);
  }

  /** Nozzle tip in world mm (print plane y = 0), including the lift and park. */
  tipAt(p: number, out: { x: number; y: number; z: number }) {
    this.printAt(p, tmp);
    const k = parkAt(p);
    out.x = tmp.x + (PARK.x - tmp.x) * k;
    out.z = tmp.z + (PARK.z - tmp.z) * k;
    out.y = PARK.lift * k;
  }

  /** Camera anchor: the mean of three nearby nozzle positions (pure smoothing, no springs). */
  anchorAt(p: number, out: XZ) {
    let sx = 0,
      sz = 0;
    for (let k = -1; k <= 1; k++) {
      if (p < BEAT.macro) {
        const L = layerAt(p) + k * 0.01;
        if (L < 1) this.printAt(BEAT.hold, tmp);
        else this.exactAt(Math.min(L, 3.9999), tmp);
      } else this.lapseAt(Math.min(p, BEAT.close) + k * 0.004, tmp);
      sx += tmp.x;
      sz += tmp.z;
    }
    out.x = sx / 3;
    out.z = sz / 3;
  }

  /** Representative path index used by the HUD plot at p. */
  plotIndexAt(p: number): number {
    if (p < BEAT.macro) return 0;
    const s = this.segAt(Math.min(p, BEAT.close));
    return Math.max(0, this.repPaths.indexOf(s.path.tp));
  }

  /**
   * The printed path behind the nozzle, newest first, as pieces of at most 0.6 mm:
   * out[i*5..] = ax, az, bx, bz, s (printed mm from the nozzle to the piece's newer end). Returns the count.
   */
  trailAt(p: number, out: Float32Array, max: number): number {
    if (p <= BEAT.hold || p >= BEAT.close) return 0;
    let path: Timed;
    let tau: number;
    if (p < BEAT.macro) {
      const L = layerAt(p);
      const k = Math.min(3, Math.max(1, Math.floor(L)));
      path = this.exact[k - 1];
      let lx = path.tp.start[0],
        lz = path.tp.start[1];
      if (k > 1) {
        const prev = this.exact[k - 2].tp.xz;
        lx = prev[prev.length - 2];
        lz = prev[prev.length - 1];
      }
      const lead = Math.hypot(path.tp.start[0] - lx, path.tp.start[1] - lz) * TRAVEL_W;
      tau = (L - k) * (lead + path.total) - lead;
    } else {
      const s = this.segAt(p);
      path = s.path;
      tau = (p - s.p0) * LAPSE_SPEED - s.leadLen;
      if (tau >= 0) tau = (s.tau0 + tau) % path.cyclic;
      if (tau > path.total) return 0;
    }
    if (tau <= 0) return 0;
    const { t, tp } = path;
    let i = seek(t, tau);
    pointAt(path, tau, tmp);
    let bx = tmp.x,
      bz = tmp.z;
    let s = 0;
    let count = 0;
    while (i >= 0 && s < TRAIL_MM && count < max) {
      const cls = tp.cls[i + 1] ?? 0;
      const ax = tp.xz[i * 2],
        az = tp.xz[i * 2 + 1];
      if (cls === 3) break;
      const len = Math.hypot(bx - ax, bz - az);
      const pieces = Math.max(1, Math.ceil(len / PIECE_MM));
      for (let k = 0; k < pieces && count < max && s < TRAIL_MM; k++) {
        const u0 = k / pieces,
          u1 = (k + 1) / pieces;
        const o = count * 5;
        out[o] = bx + (ax - bx) * u1;
        out[o + 1] = bz + (az - bz) * u1;
        out[o + 2] = bx + (ax - bx) * u0;
        out[o + 3] = bz + (az - bz) * u0;
        out[o + 4] = s + (len * k) / pieces;
        count++;
      }
      s += len;
      bx = ax;
      bz = az;
      i--;
    }
    return count;
  }
}
