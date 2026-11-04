// Pure functions of progress for Ch5 (STORYBOARD 6, Ch5 "Layer mapping"). No three.js: the Overlay uses them too.
import { clamp, facts, range } from '@/strata/story';

export const LAYER_COUNT = facts.layer.count;
export const LAYER_MM = facts.layer.heightMM;
export const PRINT_S = facts.fdmProof.printTimeS;

export const BEAT = {
  hold: 0.06,
  macro: 0.25,
  lapse: 0.7,
  close: 0.86,
  park: 0.92,
} as const;

export const sineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
const quadInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Continuous layer L: 1 -> 4 linear (macro), -> 720 power1.inOut (time-lapse), -> 840 expo.out (collar). */
export function layerAt(p: number): number {
  if (p <= BEAT.hold) return 1;
  if (p <= BEAT.macro) return 1 + 3 * range(p, BEAT.hold, BEAT.macro);
  if (p <= BEAT.lapse) return 4 + 716 * quadInOut(range(p, BEAT.macro, BEAT.lapse));
  if (p <= BEAT.close) return 720 + 120 * expoOut(range(p, BEAT.lapse, BEAT.close));
  return LAYER_COUNT;
}

/** The layer on the bed for the HUD and the growth clip: floor(L), 1..840. */
export function layerNumber(p: number): number {
  return clamp(Math.floor(layerAt(p) + 1e-6), 1, LAYER_COUNT);
}

/** uZ in mm: the height of the current layer's top above the plate. */
export const zAt = (p: number) => layerNumber(p) * LAYER_MM;

/** Seconds left: 2:48:00 at layer 1, 0 at layer 840. */
export function timeLeftAt(p: number): number {
  return Math.max(0, PRINT_S * (1 - (layerAt(p) - 1) / (LAYER_COUNT - 1)));
}

/** Heat of the part's top band (0..1). Layer 1 arrives warm from Ch4's lines, the time-lapse runs hot, the end cools. */
export function heatAt(p: number): number {
  if (p < BEAT.hold) return 0.6 - 0.6 * sineInOut(p / BEAT.hold);
  if (p < 0.32) return 0.8 * sineInOut(range(p, 0.24, 0.32));
  if (p < BEAT.close) return 0.8 - 0.15 * range(p, BEAT.lapse, BEAT.close);
  return 0.65 * (1 - sineInOut(range(p, BEAT.close, 0.98)));
}

/** Camera weight on the moving nozzle anchor: 0 -> 1 over 0.06-0.14, 1 -> 0 over 0.25-0.36. */
export function anchorWeight(p: number): number {
  return sineInOut(range(p, 0.06, 0.14)) * (1 - sineInOut(range(p, 0.25, 0.36)));
}

/** Nozzle lift and park, 0..1 over 0.86-0.92. */
export const parkAt = (p: number) => sineInOut(range(p, BEAT.close, BEAT.park));

/** PRINT COMPLETE state, 0..1. */
export const completeAt = (p: number) => range(p, BEAT.close, BEAT.close + 0.02);

/** HUD values at a given p (static stills evaluate these at their own p). */
export function hudAt(p: number) {
  const layer = layerNumber(p);
  return { layer, z: layer * LAYER_MM, remaining: timeLeftAt(p), complete: p >= BEAT.close };
}
