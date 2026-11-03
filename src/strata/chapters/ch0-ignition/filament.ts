import { BufferAttribute, BufferGeometry } from 'three';
import type { Quality } from '@/strata/story';
import { BEAD, BEAD_TOP, samplePen, type StrokeLayout, type Vec2 } from './strokes';

/**
 * The printed headline as one swept mesh. Every stroke carries a three-layer bead cross-section (squashed
 * stadium beads, 2.0 x 1.2 mm, grooves where the layers meet), swept along the stroke with rounded end caps;
 * printed dots are the same profile turned about their centre. The fragment shader rebuilds the bead normal per
 * pixel from the profile angle, so a coarse ring still shades as a smooth, round bead.
 */

/** Bead side: half-ellipse centred SIDE_U from the bead axis, radii RX (out) x RY (up). */
export const SIDE_U = 0.66;
export const RX = BEAD.width / 2 - SIDE_U;
export const RY = BEAD.height / 2;
/** Extrusion distance over which the last-laid filament still glows (mm). */
const HEAT_FALLOFF = 2.5;

interface ProfilePt {
  u: number;
  y: number;
  theta: number;
  occ: number;
  layer: number;
  /** No face between this point and the previous one (a groove: same position, different normal). */
  brk: boolean;
}

const TIER = {
  high: { tolerance: 0.012, maxStep: 2.4, stepDeg: 45, cap: 8, dot: 22 },
  medium: { tolerance: 0.03, maxStep: 3.2, stepDeg: 60, cap: 6, dot: 16 },
  low: { tolerance: 0.06, maxStep: 4.5, stepDeg: 90, cap: 4, dot: 12 },
} as const;

/** Right half of the cross-section, from the top centre out and down to the plate. */
function halfProfile(stepDeg: number): ProfilePt[] {
  const pts: ProfilePt[] = [
    { u: 0, y: BEAD_TOP, theta: Math.PI / 2, occ: 1, layer: 2, brk: false },
    { u: SIDE_U, y: BEAD_TOP, theta: Math.PI / 2, occ: 1, layer: 2, brk: false },
  ];
  for (let layer = BEAD.layers - 1; layer >= 0; layer--) {
    const yc = BEAD.height * (layer + 0.5);
    const top = layer === BEAD.layers - 1;
    for (let deg = 90; deg >= -90; deg -= stepDeg) {
      if (top && deg === 90) continue;
      const th = (deg * Math.PI) / 180;
      const s = Math.sin(th);
      const exposed = top && s > 0 ? 1 : 1 - 0.58 * Math.pow(Math.abs(s), 3);
      const occ = layer === 0 && s < 0 ? exposed * (1 - 0.35 * -s) : exposed;
      pts.push({ u: SIDE_U + RX * Math.cos(th), y: yc + RY * s, theta: th, occ, layer, brk: !top && deg === 90 });
    }
  }
  return pts;
}

class Writer {
  pos: number[] = [];
  nrm: number[] = [];
  lat: number[] = [];
  prof: number[] = [];
  data: number[] = [];
  idx: number[] = [];
  count = 0;

  vertex(x: number, y: number, z: number, lx: number, lz: number, p: ProfilePt, s: number, heat: number) {
    const c = Math.cos(p.theta) / RX;
    const v = Math.sin(p.theta) / RY;
    const len = Math.hypot(c, v) || 1;
    this.pos.push(x, y, z);
    this.nrm.push((lx * c) / len, v / len, (lz * c) / len);
    this.lat.push(lx, 0, lz);
    this.prof.push(p.theta, p.occ);
    this.data.push(s, heat);
    return this.count++;
  }

  /** Faces between two vertex rows a[] and b[] that follow the same profile; flip reverses the winding. */
  strip(a: number[], b: number[], connect: boolean[], flip: boolean) {
    for (let j = 0; j < a.length - 1; j++) {
      if (!connect[j]) continue;
      const [p, q, r, t] = [a[j], a[j + 1], b[j], b[j + 1]];
      if (flip) this.idx.push(p, r, q, q, r, t);
      else this.idx.push(p, q, r, q, t, r);
    }
  }

  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.nrm), 3));
    g.setAttribute('aLat', new BufferAttribute(new Float32Array(this.lat), 3));
    g.setAttribute('aProf', new BufferAttribute(new Float32Array(this.prof), 2));
    g.setAttribute('aData', new BufferAttribute(new Float32Array(this.data), 2));
    g.setIndex(this.count > 65535 ? new BufferAttribute(new Uint32Array(this.idx), 1) : new BufferAttribute(new Uint16Array(this.idx), 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

const LAYER_HEAT = [0.6, 0.82, 1];

export interface FilamentInfo {
  geometry: BufferGeometry;
  /** Total extrusion length, mm (the heat reference). */
  length: number;
  /** Extrusion distance at which the closing period begins. */
  periodFrom: number;
}

export function buildFilament(layout: StrokeLayout, quality: Quality): FilamentInfo {
  const tier = TIER[quality];
  const half = halfProfile(tier.stepDeg);
  // Full ring: mirrored left half (bottom-left up to the top), then the right half (top down to bottom-right).
  const ring: { p: ProfilePt; side: number }[] = [];
  for (let j = half.length - 1; j >= 1; j--) ring.push({ p: half[j], side: -1 });
  for (let j = 0; j < half.length; j++) ring.push({ p: half[j], side: 1 });
  const ringConnect = ring.map((_, i) => {
    if (i === ring.length - 1) return false;
    const a = ring[i];
    const b = ring[i + 1];
    if (b.side > 0) return !b.p.brk;
    return !a.p.brk;
  });
  const halfConnect = half.map((_, j) => j < half.length - 1 && !half[j + 1].brk);

  const total = layout.strokes.reduce((a, s) => a + s.length, 0);
  const heatOf = (s: number, layer: number) => Math.exp(-(total - s) / HEAT_FALLOFF) * LAYER_HEAT[layer];
  const w = new Writer();
  let s0 = 0;

  for (const stroke of layout.strokes) {
    if (stroke.kind === 'dot') {
      const r0 = Math.max(0, stroke.radius - BEAD.width / 2);
      const prof: ProfilePt[] = [{ ...half[0], u: -r0 }, ...half];
      const connect = prof.map((_, j) => j < prof.length - 1 && !prof[j + 1].brk);
      const [cx, cz] = stroke.center;
      const rows: number[][] = [];
      for (let k = 0; k <= tier.dot; k++) {
        const phi = (k / tier.dot) * Math.PI * 2;
        const dx = Math.cos(phi);
        const dz = Math.sin(phi);
        rows.push(
          prof.map((p) => {
            const rr = r0 + p.u;
            return w.vertex(cx + dx * rr, p.y, cz + dz * rr, dx, dz, p, s0 + stroke.length, heatOf(s0 + stroke.length, p.layer));
          }),
        );
      }
      for (let k = 0; k < tier.dot; k++) w.strip(rows[k], rows[k + 1], connect, true);
      s0 += stroke.length;
      continue;
    }

    const pts = samplePen(stroke, tier.tolerance, tier.maxStep);
    const n = pts.length;
    const closed = stroke.closed;
    const arc: number[] = [0];
    for (let i = 1; i < n; i++) arc.push(arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tangent = (i: number): Vec2 => {
      const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
      const b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    };
    const rows: number[][] = [];
    for (let i = 0; i < n; i++) {
      const [tx, tz] = tangent(i);
      const nx = -tz;
      const nz = tx;
      const [x, z] = pts[i];
      const s = s0 + arc[i];
      rows.push(ring.map(({ p, side }) => w.vertex(x + nx * p.u * side, p.y, z + nz * p.u * side, nx * side, nz * side, p, s, heatOf(s, p.layer))));
    }
    for (let i = 0; i < n - 1; i++) w.strip(rows[i], rows[i + 1], ringConnect, false);
    if (closed) w.strip(rows[n - 1], rows[0], ringConnect, false);
    else {
      cap(w, pts[n - 1], tangent(n - 1), half, halfConnect, tier.cap, s0 + arc[n - 1], heatOf, false);
      cap(w, pts[0], tangent(0), half, halfConnect, tier.cap, s0, heatOf, true);
    }
    s0 += stroke.length;
  }

  const last = layout.strokes[layout.strokes.length - 1];
  return { geometry: w.geometry(), length: total, periodFrom: total - last.length - 0.01 };
}

/** Rounded end: the right half-profile turned 180 degrees about the stroke end, from +N through the tangent to -N. */
function cap(
  w: Writer,
  at: Vec2,
  t: Vec2,
  half: ProfilePt[],
  connect: boolean[],
  steps: number,
  s: number,
  heatOf: (s: number, layer: number) => number,
  start: boolean,
) {
  const [tx, tz] = start ? [-t[0], -t[1]] : t;
  const nx = -tz;
  const nz = tx;
  const rows: number[][] = [];
  for (let k = 0; k <= steps; k++) {
    const phi = (k / steps) * Math.PI;
    const dx = Math.cos(phi) * nx + Math.sin(phi) * tx;
    const dz = Math.cos(phi) * nz + Math.sin(phi) * tz;
    rows.push(half.map((p) => w.vertex(at[0] + dx * p.u, p.y, at[1] + dz * p.u, dx, dz, p, s, heatOf(s, p.layer))));
  }
  for (let k = 0; k < steps; k++) w.strip(rows[k], rows[k + 1], connect, false);
}
