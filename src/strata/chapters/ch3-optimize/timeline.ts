// Every Ch3 story value as a pure function of p (STORYBOARD Ch3 beats). Shared by the Scene and the Overlay,
// so static mode reads the same numbers the canvas shows. No three.js here.
import { facts } from '@/strata/story/facts';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sineInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const cubicOut = (t: number) => 1 - (1 - t) ** 3;
const quartOut = (t: number) => 1 - (1 - t) ** 4;

/** Erosion window: the solid dissolves into the optimized truss. */
export const ERODE = [0.08, 0.55] as const;
/** Readout windows (desktop cap: 4 on screen). */
export const WINDOWS = {
  load: [0.02, 0.44],
  mass: [0.03, 0.95],
  saved: [0.03, 0.95],
  sigma: [0.52, 0.72],
  infill: [0.72, 0.92],
} as const;

/** Fraction of erodible surface already removed (0..1), eased so the visible erosion runs evenly. */
export function erosion(p: number) {
  return sineInOut(range(p, ERODE[0], ERODE[1]));
}

const { solid: M0, optimized: M1 } = facts.part.massG;
export function massAt(p: number) {
  return Math.round(lerp(M0, M1, erosion(p)));
}
export function savedAt(p: number) {
  return Math.round(facts.part.massSavedPct * erosion(p));
}

/** Load case draw-on (0..1) and fade-out (1..0). */
export function loadDraw(p: number) {
  return cubicOut(range(p, 0.005, 0.1));
}
export function loadFade(p: number) {
  return 1 - sineInOut(range(p, 0.44, 0.52));
}

/**
 * Stress front: 0 at the load point, 1 at the far bolt hole (overshoots to clear the last fringe). At the end it
 * runs back, draining the heatmap into the load point.
 */
export function stressFront(p: number) {
  if (p < 0.9) return 1.12 * sineInOut(range(p, 0.5, 0.64));
  return 1.12 - 1.3 * sineInOut(range(p, 0.9, 0.98));
}
/** Heatmap strength (the front edge glints only while it moves). */
export function stressAmount(p: number) {
  return p >= 0.5 ? 1 : 0;
}
export function sigmaAt(p: number) {
  return Math.round(facts.load.sigmaMaxMPa * quartOut(range(p, 0.52, 0.62)));
}

/** Section plane z (mm): +22 is clear of the part; it parks through the chords' core, where the lattice is. */
export const CUT_CLEAR = 22;
export const CUT_HOLD = 9.5;
export function cutZ(p: number) {
  if (p < 0.9) return lerp(CUT_CLEAR, CUT_HOLD, sineInOut(range(p, 0.7, 0.8)));
  return lerp(CUT_HOLD, CUT_CLEAR, sineInOut(range(p, 0.9, 0.97)));
}

/** Infill reveal (0..1), its swing into place (radians about y, pivoting on the section plane) and scale. */
export const INFILL_PIVOT = [-6, 0, CUT_HOLD] as const;
export function infillReveal(p: number) {
  return p < 0.9 ? sineInOut(range(p, 0.74, 0.8)) : 1 - sineInOut(range(p, 0.9, 0.95));
}
export function infillTurn(p: number) {
  return (-25 * Math.PI) / 180 * (1 - cubicOut(range(p, 0.7, 0.84)));
}
export function infillScale(p: number) {
  return lerp(0.92, 1, cubicOut(range(p, 0.7, 0.84)));
}

/** Depth of field: on inside 0.70-0.90 with a soft ramp so it never pops. */
export function dofBokeh(p: number) {
  return DOF_BOKEH * range(p, 0.7, 0.72) * (1 - range(p, 0.88, 0.9));
}
/** Softer than the storyboard's 2.5: the full-frame blur haloes the lit section on the black void. */
const DOF_BOKEH = 1.5;

/** Exit wipe: the slicing heat rides the renderer's seam, faded in and out with the seam line itself. */
export function sliceGlow(t: number) {
  return range(t, 0, 0.03) * (1 - range(t, 0.97, 1));
}

/** Readout opacity target for a window (the HUD fades with CSS transitions). */
export function inWindow(p: number, w: readonly [number, number]) {
  return p >= w[0] && p <= w[1];
}
