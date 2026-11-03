import type { CameraPose, Vec3Like } from './framing';

/**
 * Shared handoff cameras (STORYBOARD 4). Both neighbours render `handoffPose(boundary, s)` while a
 * handoff runs (s = outgoing exit = incoming enter), so the camera is one camera across two scenes.
 * Linear in pos, target, fov and fx; up is slerped. The outgoing chapter's last key equals s = 0, the
 * incoming chapter's first key equals s = 1. Pure (type-only imports): node tests load it directly.
 */
export type Boundary = '0-1' | '1-2' | '2-3' | '3-4' | '4-5' | '6-7';
type V3 = readonly [number, number, number];

interface HandoffSpec {
  a: V3;
  b: V3;
  target: V3;
  fov: number;
  fx: number;
  /** fx at s = 1 when it differs (linear between). */
  fxB?: number;
  /** Up at s = 0, and at s = 1 when it differs (slerped between). */
  up: V3;
  upB?: V3;
  portraitUp?: V3;
  portraitUpB?: V3;
  /** pos and target are offsets from a caller-supplied point (H1: the molten dot). */
  relative?: boolean;
}

const Y_UP: V3 = [0, 1, 0];
const ZERO: V3 = [0, 0, 0];
/** Mirrors FRAMING.portraitFy (kept local so this file has no runtime imports). */
const PORTRAIT_FY = 0.58;
const PIVOT_H4: V3 = [0, 20, 0];
const A_H4: V3 = [150, 80, 190];

function rotateY(p: V3, pivot: V3, deg: number): V3 {
  const r = (deg * Math.PI) / 180;
  const x = p[0] - pivot[0];
  const z = p[2] - pivot[2];
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [pivot[0] + x * c + z * s, p[1], pivot[2] - x * s + z * c];
}

export const HANDOFFS: Record<Boundary, HandoffSpec> = {
  '0-1': { a: [0, 27, 57], b: [0, 18.8, 40], target: [0, 1.2, 0], fov: 22, fx: 0.5, up: Y_UP, relative: true },
  '1-2': { a: [-150, 80, 180], b: [-161, 80, 170], target: [0, 20, 0], fov: 28, fx: 0.6, up: Y_UP },
  '2-3': { a: [190, 70, 150], b: [198, 70, 139], target: [0, 20, 0], fov: 28, fx: 0.6, up: Y_UP },
  '3-4': { a: A_H4, b: rotateY(A_H4, PIVOT_H4, 2), target: PIVOT_H4, fov: 26, fx: 0.6, fxB: 0.65, up: Y_UP },
  '4-5': { a: [0, 170, 25], b: [0, 160, 24], target: [0, 0, 0], fov: 30, fx: 0.6, up: Y_UP, portraitUp: [1, 0, 0] },
  '6-7': { a: [0, 120, 2900], b: [0, 120, 3200], target: [0, 50, 0], fov: 30, fx: 0.5, up: Y_UP },
};

/** The boundary leaving chapter `outgoing`, or null where the storyboard has none (5 -> 6 wipe, 7 -> 8 cut). */
export function boundaryAfter(outgoing: number): Boundary | null {
  const b = `${outgoing}-${outgoing + 1}`;
  return b in HANDOFFS ? (b as Boundary) : null;
}

const comp = (v: Vec3Like, i: 0 | 1 | 2) =>
  'x' in v ? (i === 0 ? v.x : i === 1 ? v.y : v.z) : (v as ArrayLike<number>)[i];

function slerpUnit(a: V3, b: V3, t: number, out: [number, number, number]) {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const th = Math.acos(d);
  let wa = 1 - t;
  let wb = t;
  if (th > 1e-4) {
    const s = Math.sin(th);
    wa = Math.sin((1 - t) * th) / s;
    wb = Math.sin(t * th) / s;
  }
  const x = a[0] * wa + b[0] * wb;
  const y = a[1] * wa + b[1] * wb;
  const z = a[2] * wa + b[2] * wb;
  const l = Math.hypot(x, y, z) || 1;
  out[0] = x / l;
  out[1] = y / l;
  out[2] = z / l;
}

/**
 * The shared camera at handoff fraction s (clamped 0..1) of `boundary`. `dot` is required for '0-1'
 * (Ch0 passes P, Ch1 passes D). Pass `out` inside frame loops to avoid allocating. Feed the result to
 * poseCamera(camera, pose, { portrait }) so both chapters apply the same framing.
 */
export function handoffPose(
  boundary: Boundary,
  s: number,
  portrait = false,
  dot?: Vec3Like,
  out?: CameraPose,
): CameraPose {
  const h = HANDOFFS[boundary];
  if (h.relative && !dot) throw new Error(`handoffPose('${boundary}') needs the dot position`);
  const t = s < 0 ? 0 : s > 1 ? 1 : s;
  const pose: CameraPose = out ?? { pos: [0, 0, 0], target: [0, 0, 0], fov: 30, up: [0, 1, 0], fx: 0.6, fy: 0.58 };
  const o = h.relative && dot ? dot : ZERO;
  for (let i = 0; i < 3; i++) {
    const c = comp(o, i as 0 | 1 | 2);
    pose.pos[i] = c + h.a[i] + (h.b[i] - h.a[i]) * t;
    pose.target[i] = c + h.target[i];
  }
  pose.fov = h.fov;
  pose.fx = h.fx + ((h.fxB ?? h.fx) - h.fx) * t;
  pose.fy = PORTRAIT_FY;
  const upA = portrait && h.portraitUp ? h.portraitUp : h.up;
  const upB = portrait && h.portraitUp ? (h.portraitUpB ?? h.portraitUp) : (h.upB ?? h.up);
  slerpUnit(upA, upB, t, pose.up);
  return pose;
}
