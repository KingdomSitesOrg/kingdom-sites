// Signed distance functions for the STRATA bracket, in millimetres (y-up, base on y = 0).
// glsl.ts mirrors every function here line for line; strut data is shared, so both stay in sync.

import { INFILL } from './constants';

export type Vec3Like = { x: number; y: number; z: number };

export const COLLAR = { x0: 18, x1: 44, y: 28.4, rOuter: 12, rInner: 8, rStop: 6.8, stopX: 20.6, round: 1.2 } as const;
export const EAR_K = 4.2;
export const RIM = { x: 20.4, major: 11.3, minor: 2.3 } as const;
export const EAR = { x: 35.5, y: 12.6, r: 5.4, halfZ: 6.2, round: 1.2 } as const;
export const SLOT = { x0: 29.2, half: 0.7, yTop: 21.9, relief: 1.15 } as const;
export const SCREW = { x: 35.5, y: 12.2, r: 1.65, cbR: 2.9, cbZ: 4.4, nutR: 3.2, nutZ: -4.4 } as const;
export const BOSS = { x: [-39, -9], z: 15, r: 5, top: 7, hole: 1.6, keepOut: 5.7, round: 1 } as const;
export const FLANGE = { x0: -44, x1: 2, z: 20, t: 5, corner: 6, round: 0.9 } as const;
export const GYROID = INFILL;
/** Edge break where holes and slots meet the surface. */
export const CUT_K = 1.8;
/** Edge break where the part meets the build plate. */
export const FLOOR_K = 0.9;
/** The storyboard envelope (88 x 42 x 40 mm): both designs are trimmed to it with this edge break. */
export const ENVELOPE = { x: 44, y: 42, z: 20, k: 0.6 } as const;

// ---------- scalar helpers ----------
export function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function smax(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}
function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
// Math.hypot is several times slower than this in V8, and this runs millions of times.
function hyp(a: number, b: number): number {
  return Math.sqrt(a * a + b * b);
}
// Rounded cylinder from a radial distance and an axial offset.
function roundCyl(radial: number, axial: number, r: number, half: number, rr: number): number {
  const dx = radial - r + rr;
  const dy = Math.abs(axial) - half + rr;
  return Math.min(Math.max(dx, dy), 0) + hyp(Math.max(dx, 0), Math.max(dy, 0)) - rr;
}

// ---------- struts: quadratic Bezier tubes through a mid point, radius profile through three radii ----------
type P3 = [number, number, number];
/** A point, or a point on an earlier strut's centre curve at parameter t (keeps branches embedded). */
type Anchor = P3 | { on: number; t: number };
export type Strut = {
  a: Anchor;
  m: Anchor;
  b: Anchor;
  r: [number, number, number];
  k: number; // blend radius into everything before it
  load: number; // structural weight for the stress reading
};

// z >= 0 half; the part is mirrored in z.
export const STRUTS: Strut[] = [
  // 0 upper chord: far boss -> collar crown
  { a: [-38.2, 3.6, 13.4], m: [-15, 18.3, 9.4], b: [20.6, 35.6, 7.0], r: [4.2, 3.3, 3.9], k: 3.8, load: 1.0 },
  // 1 lower chord: near boss -> collar flank
  { a: [-8.6, 3.8, 13.2], m: [6.2, 11.5, 10.8], b: [21.2, 19.8, 8.7], r: [4.6, 3.6, 4.4], k: 3.8, load: 1.0 },
  // 2 diagonal: near boss -> upper chord node
  { a: [-10.2, 4.8, 13.0], m: [-13.2, 12.0, 11.4], b: { on: 0, t: 0.5 }, r: [3.3, 2.6, 3.0], k: 3.2, load: 0.62 },
  // 3 web: lower chord -> upper chord
  { a: { on: 1, t: 0.5 }, m: [4.6, 19.4, 9.9], b: { on: 0, t: 0.72 }, r: [3.0, 2.35, 2.8], k: 3.2, load: 0.55 },
  // 4 side rail between the bosses, pinched inwards
  { a: [-37.6, 2.6, 14.2], m: [-24, 2.5, 12.2], b: [-10.4, 2.6, 14.2], r: [2.9, 2.2, 2.9], k: 2.8, load: 0.4 },
  // 5 front tie across the far bosses
  { a: [-38.4, 2.6, 11.2], m: [-35.2, 2.5, 5.6], b: [-34.2, 2.6, 0], r: [2.9, 2.3, 2.2], k: 2.8, load: 0.32 },
  // 6 rear tie across the near bosses
  { a: [-9.6, 2.6, 11.2], m: [-12.8, 2.5, 5.6], b: [-13.8, 2.6, 0], r: [3.0, 2.4, 2.3], k: 2.8, load: 0.38 },
  // 7 upper cross tie between the chord nodes
  { a: { on: 0, t: 0.5 }, m: [-13.6, 17.1, 4.6], b: [-13.2, 16.7, 0], r: [2.9, 2.3, 2.2], k: 3.0, load: 0.45 },
  // 8 landing fork off the lower chord
  { a: { on: 1, t: 0.74 }, m: [19.2, 17.3, 10.9], b: [25.6, 18.6, 10.4], r: [2.6, 2.1, 2.3], k: 2.8, load: 0.7 },
  // 9 landing fork off the upper chord
  { a: { on: 0, t: 0.82 }, m: [17.8, 35.4, 5.9], b: [26.0, 38.8, 3.6], r: [2.5, 2.0, 2.2], k: 2.8, load: 0.7 },
];
/** Calibrates the optimized part's mass (facts: 96 g of Ti-6Al-4V, 21.7 cm^3): every strut radius is scaled by it. */
export const STRUT_R_SCALE = 1.065;

// Per strut: A, a = B - A, b = A - 2B + C, kk, kx, 2|a|^2, r0, rm, r1, k, bound centre, bound radius.
export const STRUT_STRIDE = 20;
export const STRUT_COUNT = STRUTS.length;
function buildStruts(struts: Strut[]): Float64Array {
  const out = new Float64Array(struts.length * STRUT_STRIDE);
  const curves: { A: P3; B: P3; C: P3 }[] = [];
  const at = (c: { A: P3; B: P3; C: P3 }, t: number): P3 =>
    [0, 1, 2].map((i) => (1 - t) * (1 - t) * c.A[i] + 2 * (1 - t) * t * c.B[i] + t * t * c.C[i]) as P3;
  const resolve = (p: Anchor): P3 => (Array.isArray(p) ? [p[0], p[1], p[2]] : at(curves[p.on], p.t));
  struts.forEach((s, si) => {
    const A = resolve(s.a),
      C = resolve(s.b);
    const m = resolve(s.m);
    // a perfectly straight strut makes the closest-point cubic degenerate; give it a hair of sag
    const sag = [0, 1, 2].map((i) => (A[i] + C[i]) / 2 - m[i]);
    if (Math.hypot(sag[0], sag[1], sag[2]) < 0.2) m[1] += 0.25;
    const B = [0, 1, 2].map((i) => 2 * m[i] - 0.5 * (A[i] + C[i])) as P3;
    curves.push({ A, B, C });
    const a = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const b = [A[0] - 2 * B[0] + C[0], A[1] - 2 * B[1] + C[1], A[2] - 2 * B[2] + C[2]];
    const kk = 1 / (b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
    const kx = kk * (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
    const aa2 = 2 * (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    const cx = (A[0] + B[0] + C[0]) / 3,
      cy = (A[1] + B[1] + C[1]) / 3,
      cz = (A[2] + B[2] + C[2]) / 3;
    const r = s.r.map((v) => v * STRUT_R_SCALE);
    const rmax = Math.max(...r);
    const bound = Math.max(...[A, B, C].map((p) => Math.hypot(p[0] - cx, p[1] - cy, p[2] - cz))) + rmax;
    out.set(
      [A[0], A[1], A[2], a[0], a[1], a[2], b[0], b[1], b[2], kk, kx, aa2, r[0], r[1], r[2], s.k, cx, cy, cz, bound],
      si * STRUT_STRIDE,
    );
  });
  return out;
}
export const STR = buildStruts(STRUTS);

let lastT = 0;
/** Curve parameter of the closest point from the last sdStrut call (read by the stress pass). */
export const lastStrutT = () => lastT;

// Tapered tube around a quadratic Bezier: iq's closest point on the curve, minus the radius there.
export function sdStrut(px: number, py: number, pz: number, o: number): number {
  const S = STR;
  const ax = S[o + 3],
    ay = S[o + 4],
    az = S[o + 5];
  const bx = S[o + 6],
    by = S[o + 7],
    bz = S[o + 8];
  const dx = S[o] - px,
    dy = S[o + 1] - py,
    dz = S[o + 2] - pz;
  const kk = S[o + 9],
    kx = S[o + 10];
  const ky = (kk * (S[o + 11] + dx * bx + dy * by + dz * bz)) / 3;
  const kz = kk * (dx * ax + dy * ay + dz * az);
  const p = ky - kx * kx;
  const q = kx * (2 * kx * kx - 3 * ky) + kz;
  let h = q * q + 4 * p * p * p;
  let t: number;
  let dist2: number;
  if (h >= 0) {
    h = Math.sqrt(h);
    t = Math.cbrt((h - q) / 2) + Math.cbrt((-h - q) / 2) - kx;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = dx + (2 * ax + bx * t) * t,
      ey = dy + (2 * ay + by * t) * t,
      ez = dz + (2 * az + bz * t) * t;
    dist2 = ex * ex + ey * ey + ez * ez;
  } else {
    const z = Math.sqrt(-p);
    const v = Math.acos(Math.max(-1, Math.min(1, q / (p * z * 2)))) / 3;
    const m = Math.cos(v);
    const n = Math.sin(v) * 1.732050808;
    let t0 = (m + m) * z - kx,
      t1 = (-n - m) * z - kx;
    t0 = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
    t1 = t1 < 0 ? 0 : t1 > 1 ? 1 : t1;
    let ex = dx + (2 * ax + bx * t0) * t0,
      ey = dy + (2 * ay + by * t0) * t0,
      ez = dz + (2 * az + bz * t0) * t0;
    const d0 = ex * ex + ey * ey + ez * ez;
    ex = dx + (2 * ax + bx * t1) * t1;
    ey = dy + (2 * ay + by * t1) * t1;
    ez = dz + (2 * az + bz * t1) * t1;
    const d1 = ex * ex + ey * ey + ez * ez;
    if (d0 <= d1) {
      t = t0;
      dist2 = d0;
    } else {
      t = t1;
      dist2 = d1;
    }
  }
  lastT = t;
  // Lagrange through (0, r0), (0.5, rm), (1, r1)
  const r = S[o + 12] * (2 * t - 1) * (t - 1) - 4 * S[o + 13] * t * (t - 1) + S[o + 14] * t * (2 * t - 1);
  return Math.sqrt(dist2) - r;
}

// ---------- shared interfaces: collar (+ rim and clamp ear) and the bolt bosses ----------
/** `rim: false` drops the inboard rim, which the solid's block already covers. */
export function sdCollarGroup(x: number, y: number, z: number, rim = true): number {
  const ry = y - COLLAR.y;
  const radial = hyp(ry, z);
  const half = (COLLAR.x1 - COLLAR.x0) / 2;
  let d = roundCyl(radial, x - (COLLAR.x0 + half), COLLAR.rOuter, half, COLLAR.round);
  if (rim) d = smin(d, hyp(radial - RIM.major, x - RIM.x) - RIM.minor, 2.2);
  const ear = roundCyl(hyp(x - EAR.x, y - EAR.y), z, EAR.r, EAR.halfZ, EAR.round);
  return smin(d, ear, EAR_K);
}

// Bosses for the z >= 0 half (z already folded).
export function sdBosses(x: number, y: number, z: number): number {
  const half = BOSS.top / 2 + 0.5;
  const d0 = roundCyl(hyp(x - BOSS.x[0], z - BOSS.z), y - (BOSS.top / 2 - 0.5), BOSS.r, half, BOSS.round);
  const d1 = roundCyl(hyp(x - BOSS.x[1], z - BOSS.z), y - (BOSS.top / 2 - 0.5), BOSS.r, half, BOSS.round);
  return Math.min(d0, d1);
}

// Everything removed from both designs; takes the unfolded point (the clamp screw is not symmetric).
export function sdCuts(x: number, y: number, z: number): number {
  // arm-tube bore with a tube stop at the inboard end
  const radial = hyp(y - COLLAR.y, z);
  const bore = smin(smax(radial - COLLAR.rInner, COLLAR.stopX - x, 0.8), radial - COLLAR.rStop, 0.8);
  // clamp split slot with a stress-relief hole at its end
  const sx = Math.max(SLOT.x0 - x, Math.abs(z) - SLOT.half, y - SLOT.yTop);
  const relief = Math.max(hyp(x - SLOT.x0, z) - SLOT.relief, y - SLOT.yTop);
  const slot = Math.min(sx, relief);
  // clamp screw: clearance, counterbore on +z, hex nut pocket on -z
  const sq = hyp(x - SCREW.x, y - SCREW.y);
  let screw = sq - SCREW.r;
  screw = Math.min(screw, Math.max(sq - SCREW.cbR, SCREW.cbZ - z));
  const hx = Math.abs(x - SCREW.x),
    hy = Math.abs(y - SCREW.y);
  const hex = Math.max(hx * 0.866025 + hy * 0.5, hy) - SCREW.nutR * 0.866025;
  screw = Math.min(screw, Math.max(hex, z - SCREW.nutZ));
  // bolt holes and the tool-access keep-out above every boss
  const az = Math.abs(z);
  let bolts = 1e9;
  for (let i = 0; i < 2; i++) {
    const q = hyp(x - BOSS.x[i], az - BOSS.z);
    bolts = Math.min(bolts, q - BOSS.hole, smax(q - BOSS.keepOut, BOSS.top - y, 1.6));
  }
  return Math.min(bore, slot, screw, bolts);
}

function envelope(x: number, y: number, z: number): number {
  return Math.max(Math.abs(x) - ENVELOPE.x, y - ENVELOPE.y, Math.abs(z) - ENVELOPE.z);
}
function applyCuts(d: number, x: number, y: number, z: number): number {
  d = smax(d, -sdCuts(x, y, z), CUT_K);
  d = smax(d, envelope(x, y, z), ENVELOPE.k);
  return smax(d, -y, FLOOR_K);
}
function applyCutsNoFloor(d: number, x: number, y: number, z: number): number {
  d = smax(d, -sdCuts(x, y, z), CUT_K);
  return smax(d, envelope(x, y, z), ENVELOPE.k);
}

// ---------- the solid (the AI's first design) ----------
// A chunky machined block: full-width body with a raked top, a relief under the collar, chamfered edges.
export const BODY = {
  front: -44,
  back: 28.6,
  top: 42.6,
  side: 20,
  sideSlope: 0.012,
  topA: [-44, 33.4],
  topN: [-10, 44],
  underA: [20, 0],
  underN: [19.5, -23],
  chamfer: [1.9, 2.0, 1.6],
} as const;
const N_TOP = norm2(BODY.topN[0], BODY.topN[1]);
const N_UNDER = norm2(BODY.underN[0], BODY.underN[1]);
const SIDE_S = BODY.sideSlope;
const SIDE_N = 1 / hyp(1, SIDE_S);
function norm2(x: number, y: number): [number, number] {
  const l = hyp(x, y);
  return [x / l, y / l];
}
const CH_FRONT = 1 / hyp(-1 + N_TOP[0], N_TOP[1]);
const CH_SIDE = 1 / Math.hypot(N_TOP[0], N_TOP[1] + SIDE_S * SIDE_N, SIDE_N);
const CH_UNDER = 1 / Math.hypot(N_UNDER[0], N_UNDER[1] + SIDE_S * SIDE_N, SIDE_N);
export const BODY_PLANES = { N_TOP, N_UNDER, SIDE_S, SIDE_N, CH_FRONT, CH_SIDE, CH_UNDER } as const;

export function sdBody(x: number, y: number, z: number): number {
  const az = Math.abs(z);
  const dFront = BODY.front - x;
  const dTop = (x - BODY.topA[0]) * N_TOP[0] + (y - BODY.topA[1]) * N_TOP[1];
  const dUnder = (x - BODY.underA[0]) * N_UNDER[0] + (y - BODY.underA[1]) * N_UNDER[1];
  const dBack = x - BODY.back;
  const dCap = y - BODY.top;
  const dSide = (az + SIDE_S * y - BODY.side) * SIDE_N;
  const k = 1.4;
  let d = smax(-y, dFront, k);
  d = smax(d, dTop, k);
  d = smax(d, dUnder, k);
  d = smax(d, dBack, k);
  d = smax(d, dCap, k);
  d = smax(d, dSide, k);
  d = smax(d, (dFront + dTop) * CH_FRONT + BODY.chamfer[0], k);
  d = smax(d, (dSide + dTop) * CH_SIDE + BODY.chamfer[1], k);
  d = smax(d, (dSide + dUnder) * CH_UNDER + BODY.chamfer[2], k);
  return d;
}

export function sdFlange(x: number, y: number, z: number): number {
  const cx = (FLANGE.x0 + FLANGE.x1) / 2;
  const hx = (FLANGE.x1 - FLANGE.x0) / 2;
  const qx = Math.abs(x - cx) - hx + FLANGE.corner;
  const qz = Math.abs(z) - FLANGE.z + FLANGE.corner;
  const d2 = Math.min(Math.max(qx, qz), 0) + hyp(Math.max(qx, 0), Math.max(qz, 0)) - FLANGE.corner;
  const wx = d2 + FLANGE.round;
  const wy = Math.abs(y - FLANGE.t / 2) - FLANGE.t / 2 + FLANGE.round;
  return Math.min(Math.max(wx, wy), 0) + hyp(Math.max(wx, 0), Math.max(wy, 0)) - FLANGE.round;
}

export function sdSolidXYZ(x: number, y: number, z: number): number {
  const az = Math.abs(z);
  let d = smin(sdFlange(x, y, az), sdBody(x, y, az), 4.0);
  d = smin(d, sdCollarGroup(x, y, az, false), 3.0);
  d = Math.min(d, sdBosses(x, y, az));
  return applyCuts(d, x, y, z);
}

// ---------- the optimized part ----------
function unionOptimized(
  x: number,
  y: number,
  az: number,
  list: Int32Array | null,
  n: number,
  collar = true,
  bosses = true,
): number {
  let d = Math.min(collar ? sdCollarGroup(x, y, az) : 1e9, bosses ? sdBosses(x, y, az) : 1e9);
  const count = list ? n : STRUT_COUNT;
  for (let i = 0; i < count; i++) {
    const o = (list ? list[i] : i) * STRUT_STRIDE;
    d = smin(d, sdStrut(x, y, az, o), STR[o + 15]);
  }
  return d;
}

export function sdOptimizedXYZ(x: number, y: number, z: number): number {
  return applyCuts(unionOptimized(x, y, Math.abs(z), null, 0), x, y, z);
}

// ---------- gyroid infill ----------
// |grad g| averages about 1.2 k on the zero set; dividing by 1.2k keeps sheet thickness close to `thickness`.
export function sdGyroidXYZ(x: number, y: number, z: number, cell: number, thickness: number): number {
  const k = (2 * Math.PI) / cell;
  const g = Math.sin(k * x) * Math.cos(k * y) + Math.sin(k * y) * Math.cos(k * z) + Math.sin(k * z) * Math.cos(k * x);
  return Math.abs(g) / (k * 1.2) - thickness * 0.5;
}

export function sdInfillXYZ(x: number, y: number, z: number): number {
  return Math.max(sdGyroidXYZ(x, y, z, GYROID.cell, GYROID.wall), sdOptimizedXYZ(x, y, z) + GYROID.shell);
}

// ---------- erosion morph ----------
function hash3(ix: number, iy: number, iz: number): number {
  let h = (Math.imul(ix, 0x8da6b343) ^ Math.imul(iy, 0xd8163841) ^ Math.imul(iz, 0xcb1ab31f)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h / 4294967295) * 2 - 1;
}
export function valueNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const fx = x - ix,
    fy = y - iy,
    fz = z - iz;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const x00 = lerp(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), ux);
  const x10 = lerp(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), ux);
  const x01 = lerp(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), ux);
  const x11 = lerp(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz);
}

export const ERODE = { reach: 30, low: 5, curve: 8, noise: 0.65, coarse: 5.5, fine: 1.6, coarseFreq: 0.075, fineFreq: 0.26, blend: 2.5 } as const;

// t = 0 is the solid, t = 1 the optimized part. The optimized part sits inside the solid (the design space), so
// the morph only ever removes material: an inflated copy of the optimized part, with a noisy erosion front,
// shrinks onto its final surface.
export function sdPartXYZ(x: number, y: number, z: number, t: number): number {
  const e = clamp(t, 0, 1);
  const dOpt = sdOptimizedXYZ(x, y, z);
  if (e >= 1) return dOpt;
  // design space: the solid, growing to cover the few tenths of a millimetre where fillets poke out of it
  const ds = sdSolidXYZ(x, y, z);
  const space = ds - e * Math.max(ds - dOpt, 0);
  const n =
    ERODE.coarse * valueNoise(x * ERODE.coarseFreq, y * ERODE.coarseFreq, z * ERODE.coarseFreq) +
    ERODE.fine * valueNoise(x * ERODE.fineFreq + 17.3, y * ERODE.fineFreq, z * ERODE.fineFreq - 9.1);
  // a long tail of shallow reach, because the solid's faces sit only a few millimetres off the struts
  const u = 1 - e;
  const reach = ERODE.low * u + (ERODE.reach - ERODE.low) * Math.pow(u, ERODE.curve) + ERODE.noise * u * n;
  return smax(space, dOpt - reach, ERODE.blend * (1 - e) + 0.001);
}

// Vector forms for consumers.
export const sdSolid = (p: Vec3Like) => sdSolidXYZ(p.x, p.y, p.z);
export const sdOptimized = (p: Vec3Like) => sdOptimizedXYZ(p.x, p.y, p.z);
export const sdGyroid = (p: Vec3Like, cell: number = GYROID.cell, thickness: number = GYROID.wall) =>
  sdGyroidXYZ(p.x, p.y, p.z, cell, thickness);
export const sdInfill = (p: Vec3Like) => sdInfillXYZ(p.x, p.y, p.z);
export const sdPart = (p: Vec3Like, t: number) => sdPartXYZ(p.x, p.y, p.z, t);

// ---------- fields for the mesher: block-level culling of strut segments ----------
export interface Field {
  /** Distance at a point (using the culled segment list while a block is active). */
  eval(x: number, y: number, z: number): number;
  /** Prepare for a block centred at c with radius r; returns the exact distance at c. */
  block(cx: number, cy: number, cz: number, r: number): number;
  /** Back to full evaluation. */
  clear(): void;
}

/** `floor: false` drops the y >= 0 cut, which the slicer needs so the first layers keep their full depth. */
export function createOptimizedField({ floor = true }: { floor?: boolean } = {}): Field {
  const cuts = floor ? applyCuts : applyCutsNoFloor;
  const list = new Int32Array(STRUT_COUNT);
  const dist = new Float64Array(STRUT_COUNT);
  let n = 0;
  let active = false;
  let useCollar = true;
  let useBosses = true;
  let useCuts = true;
  let useEnv = true;
  return {
    eval(x, y, z) {
      if (!active) return cuts(unionOptimized(x, y, Math.abs(z), null, 0), x, y, z);
      const d = unionOptimized(x, y, Math.abs(z), list, n, useCollar, useBosses);
      if (useCuts) return cuts(d, x, y, z);
      const e = useEnv ? smax(d, envelope(x, y, z), ENVELOPE.k) : d;
      return floor ? smax(e, -y, FLOOR_K) : e;
    },
    block(cx, cy, cz, r) {
      active = false;
      const az = Math.abs(cz);
      const dc = sdCollarGroup(cx, cy, az);
      const db = sdBosses(cx, cy, az);
      const union = unionOptimized(cx, cy, az, null, 0);
      const cut = sdCuts(cx, cy, cz);
      const v = cuts(union, cx, cy, cz);
      if (Math.abs(v) > r) return v;
      let dmin = Math.min(dc, db);
      for (let s = 0; s < STRUT_COUNT; s++) {
        const o = s * STRUT_STRIDE;
        const dx = cx - STR[o + 16],
          dy = cy - STR[o + 17],
          dz = az - STR[o + 18];
        // cheap bound first, exact only when it might matter
        const b = Math.sqrt(dx * dx + dy * dy + dz * dz) - STR[o + 19];
        dist[s] = b > dmin + 2 * r + 4 ? b : sdStrut(cx, cy, az, o);
        if (dist[s] < dmin) dmin = dist[s];
      }
      n = 0;
      for (let s = 0; s < STRUT_COUNT; s++) {
        if (dist[s] < dmin + 2 * r + STR[s * STRUT_STRIDE + 15] + 0.5) list[n++] = s;
      }
      useCollar = dc < dmin + 2 * r + 4.2;
      useBosses = db < dmin + 2 * r + 4.2;
      // a cut can only matter where it reaches into the material that is near this block
      useCuts = cut + union < 2 * r + 1.5;
      useEnv = envelope(cx, cy, cz) - union > -(2 * r + ENVELOPE.k + 0.5);
      active = true;
      return v;
    },
    clear() {
      active = false;
    },
  };
}

export function createSolidField(): Field {
  return {
    eval: sdSolidXYZ,
    block: (cx, cy, cz) => sdSolidXYZ(cx, cy, cz),
    clear() {},
  };
}

export function createInfillField(): Field {
  const opt = createOptimizedField();
  const k = (2 * Math.PI) / GYROID.cell;
  const norm = 1 / (k * 1.2);
  let deep = false;
  // the mesher walks rows of constant y and z, so their sines are reused
  let ly = NaN,
    lz = NaN,
    sy = 0,
    cy = 0,
    sz = 0,
    cz = 0;
  const gyroid = (x: number, y: number, z: number) => {
    if (y !== ly) {
      ly = y;
      sy = Math.sin(k * y);
      cy = Math.cos(k * y);
    }
    if (z !== lz) {
      lz = z;
      sz = Math.sin(k * z);
      cz = Math.cos(k * z);
    }
    const g = Math.sin(k * x) * cy + sy * cz + sz * Math.cos(k * x);
    return Math.abs(g) * norm - GYROID.wall * 0.5;
  };
  // A 3x3x3 lattice of the hull distance per block, trilinearly interpolated, tells where the gyroid alone
  // decides the value; everywhere else the hull is evaluated exactly, so the result is always exact.
  const lat = new Float64Array(27);
  let lx = 0,
    lyy = 0,
    lzz = 0,
    la = 1,
    hasLat = false;
  const ERR = 0.9;
  const hullEstimate = (x: number, y: number, z: number) => {
    const u = (x - lx) / la,
      v = (y - lyy) / la,
      w = (z - lzz) / la;
    if (u < 0 || v < 0 || w < 0 || u > 2 || v > 2 || w > 2) return -Infinity;
    const i = u >= 1 ? 1 : 0,
      j = v >= 1 ? 1 : 0,
      q = w >= 1 ? 1 : 0;
    const fu = u - i,
      fv = v - j,
      fw = w - q;
    const at = (a: number, b: number, c: number) => lat[a + b * 3 + c * 9];
    const c00 = at(i, j, q) + (at(i + 1, j, q) - at(i, j, q)) * fu;
    const c10 = at(i, j + 1, q) + (at(i + 1, j + 1, q) - at(i, j + 1, q)) * fu;
    const c01 = at(i, j, q + 1) + (at(i + 1, j, q + 1) - at(i, j, q + 1)) * fu;
    const c11 = at(i, j + 1, q + 1) + (at(i + 1, j + 1, q + 1) - at(i, j + 1, q + 1)) * fu;
    const c0 = c00 + (c10 - c00) * fv;
    const c1 = c01 + (c11 - c01) * fv;
    return c0 + (c1 - c0) * fw;
  };
  return {
    eval(x, y, z) {
      const g = gyroid(x, y, z);
      if (deep) return g;
      if (hasLat) {
        const s = hullEstimate(x, y, z);
        if (s !== -Infinity && s + GYROID.shell + ERR < g) return g;
      }
      return Math.max(g, opt.eval(x, y, z) + GYROID.shell);
    },
    block(cx, cy, cz, r) {
      deep = false;
      hasLat = false;
      const dOpt = opt.block(cx, cy, cz, r);
      const g = gyroid(cx, cy, cz);
      const v = Math.max(g, dOpt + GYROID.shell);
      // the gyroid is not an exact distance; report "far" only when the hull test alone proves it
      if (dOpt + GYROID.shell > r * 1.01) return v;
      // the whole block is so far inside that the shell offset can never win over the sheet
      if (dOpt + GYROID.shell + r < -GYROID.wall) deep = true;
      else {
        la = r / Math.sqrt(3);
        lx = cx - la;
        lyy = cy - la;
        lzz = cz - la;
        for (let c = 0; c < 3; c++)
          for (let b = 0; b < 3; b++)
            for (let a = 0; a < 3; a++) lat[a + b * 3 + c * 9] = opt.eval(lx + a * la, lyy + b * la, lzz + c * la);
        hasLat = true;
      }
      return Math.min(Math.abs(v), r * 0.5) * Math.sign(v || 1);
    },
    clear() {
      deep = false;
      hasLat = false;
      opt.clear();
    },
  };
}
