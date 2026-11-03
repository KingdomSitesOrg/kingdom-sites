/**
 * Ch0 staging numbers shared by the Scene and the Overlay (no three.js here: the Overlay is first-paint code).
 * Camera keys are STORYBOARD Ch0 (desktop, raw axis, mm); the last key is the 0 -> 1 handoff pose A1.
 */
import { desktop, type StrokeLayout } from './strokes';

type V3 = readonly [number, number, number];
export interface Key {
  t: number;
  pos: V3;
  target: V3;
  fov: number;
  fx: number;
}

const K0_POS: V3 = [0, 430, 30];
const K0_FOV = 32;

/** Height of the K0 frame at the target, mm: the SVG headline is drawn at exactly this scale. */
export const K0_VISIBLE_HEIGHT = 2 * Math.hypot(K0_POS[1], K0_POS[2]) * Math.tan(((K0_FOV / 2) * Math.PI) / 180);
/** Where the target sits on screen at K0 (0 = top): the DOM headline's 42 % line. Eases to centre by REVEAL.to. */
export const K0_SCREEN_Y = 0.42;

/** p window over which the vertical lift eases out (the copy panel leaves over 0.40-0.50). */
export const LIFT_OFF = [0.4, 0.62] as const;

/** Canvas fade-in under the SVG headline (smoothstep window in p); static mode crossfades to still 0 later. */
export const REVEAL = { from: 0.1, to: 0.3, staticFrom: 0.25, staticTo: 0.4 } as const;

/** H1, the 0 -> 1 handoff, relative to the molten dot: A at s = 0, B at s = 1. */
export const H1 = {
  a: [0, 27, 57] as V3,
  b: [0, 18.8, 40] as V3,
  target: [0, 1.2, 0] as V3,
  fov: 22,
};

const add = (p: V3, d: V3): V3 => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];

/**
 * Camera keys for a layout, fx 0.5 throughout. K3 and A1 are relative to the layout's P (A1 = handoffPose('0-1', 0));
 * phones take the framing module's portrait rule rather than keys of their own (phone layouts are out of scope).
 */
export function cameraKeys(layout: StrokeLayout): Key[] {
  const P = layout.period;
  const d = desktop.period;
  const off = (v: V3): V3 => [v[0] - d[0] + P[0], v[1] - d[1] + P[1], v[2] - d[2] + P[2]];
  return [
    { t: 0, pos: K0_POS, target: [0, 0, 0], fov: K0_FOV, fx: 0.5 },
    { t: 0.3, pos: [0, 330, 170], target: [0, 0, 0], fov: 30, fx: 0.5 },
    { t: 0.6, pos: [-150, 90, 200], target: [-6, 4, 0], fov: 33, fx: 0.5 },
    { t: 0.82, pos: off([30, 34, 115]), target: off([96, 3, 10]), fov: 24, fx: 0.5 },
    { t: 1, pos: add(P, H1.a), target: add(P, H1.target), fov: H1.fov, fx: 0.5 },
    { t: 1.5, pos: add(P, H1.b), target: add(P, H1.target), fov: H1.fov, fx: 0.5 },
  ];
}
