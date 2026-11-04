// Pure stage maths shared by the Scene and the Overlay (STORYBOARD 6, Ch2). No three.js here.
import { clamp, range } from '@/strata/story';

export interface Stage {
  label: string;
  tag: string;
  from: number;
  to: number;
  /** Where the stage strip scrolls to. */
  mid: number;
  /** Where the stage strip scrolls to in static mode (the still). */
  still: number;
}

export const STAGES: readonly Stage[] = [
  { label: 'Point cloud', tag: 'Point cloud', from: 0, to: 0.14, mid: 0.07, still: 0.07 },
  { label: 'Wireframe', tag: 'Wireframe', from: 0.14, to: 0.34, mid: 0.24, still: 0.24 },
  { label: 'Low-poly', tag: 'Low-poly', from: 0.34, to: 0.54, mid: 0.44, still: 0.44 },
  { label: 'Subdivision', tag: 'Subdivision', from: 0.54, to: 0.74, mid: 0.64, still: 0.64 },
  { label: 'Material', tag: 'Material', from: 0.74, to: 1, mid: 0.87, still: 0.9 },
];

/** Beat windows in p. Everything visual is a pure function of p through these. */
export const BEAT = {
  wire: [0.14, 0.3],
  faces: [0.34, 0.49],
  cloudDim: [0.14, 0.2],
  cloudOut: [0.34, 0.4],
  cage: [0.6, 0.7],
  refine: [0.54, 0.615],
  wireOverlay: [0.585, 0.715],
  smooth: [0.6, 0.725],
  material: [0.74, 0.86],
  light: [0.8, 0.94],
  rack: [0.74, 0.82],
  dofOpen: [0.92, 1],
} as const;

export const beat = (p: number, w: readonly [number, number]) => range(p, w[0], w[1]);

export function stageAt(p: number) {
  for (let i = STAGES.length - 1; i > 0; i--) if (p >= STAGES[i].from) return i;
  return 0;
}

export function stageFill(p: number, i: number) {
  const s = STAGES[i];
  return clamp((p - s.from) / (s.to - s.from), 0, 1);
}

export const sine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
