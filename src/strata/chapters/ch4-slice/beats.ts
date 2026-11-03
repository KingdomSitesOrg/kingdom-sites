// Pure functions of progress for every beat in STORYBOARD 6 / Ch4. No three.js here.
import { range } from '@/strata/story';

export const BEATS = {
  fanOpen: [0.08, 0.3],
  fanHold: [0.3, 0.4],
  line: [0.3, 0.4],
  snap: [0.4, 0.52],
  flash: [0.455, 0.47],
  lift: [0.52, 0.62],
  draw: [0.62, 0.92],
  park: [0.92, 0.97],
  dof: [0.6, 0.66],
} as const;

const sineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const power2InOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** back.out(s): overshoots past 1, then settles. */
export const backOut = (t: number, s = 1.4) => {
  const f = t - 1;
  return 1 + (s + 1) * f * f * f + s * f * f;
};

/** Fan amount: opens 0.08-0.30, holds, snaps home with back.out(1.4) over 0.40-0.52 (goes slightly negative). */
export function fanAt(p: number) {
  if (p < BEATS.snap[0]) {
    const open = power2InOut(range(p, BEATS.fanOpen[0], BEATS.fanOpen[1]));
    const breathe = range(p, BEATS.fanHold[0], BEATS.fanHold[1]);
    return open * (1 + 0.025 * Math.sin(Math.PI * breathe));
  }
  return 1 - backOut(range(p, BEATS.snap[0], BEATS.snap[1]));
}

/** Triangular pulse inside [a, b], 1 at the centre. */
export function pulse(p: number, a: number, b: number) {
  if (p <= a || p >= b) return 0;
  const t = (p - a) / (b - a);
  return 1 - Math.abs(t * 2 - 1);
}

/** Toolpath draw fraction 0..1 (constant pen speed, eased only at both ends). */
export function drawAt(p: number) {
  const t = range(p, BEATS.draw[0], BEATS.draw[1]);
  const e = 0.06;
  if (t < e) return (t * t) / (2 * e) / (1 - e);
  if (t > 1 - e) return 1 - ((1 - t) * (1 - t)) / (2 * e) / (1 - e);
  return (t - e / 2) / (1 - e);
}

/** Return travel to S1: 0..1 over 0.92-0.97. */
export const parkAt = (p: number) => sineInOut(range(p, BEATS.park[0], BEATS.park[1]));
