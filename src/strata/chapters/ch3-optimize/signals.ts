import { createAnchors } from '@/strata/story';

/**
 * Scene -> Overlay channel: written inside useChapterFrame, read by the HUD on the ticker. Plain numbers and the
 * screen-signal arrays only. Readout values are also pure functions of p (timeline.ts), which static mode uses.
 */
export const signals = {
  mass: 412,
  saved: 0,
  sigma: 0,
  /** Projected load-arrow tail and the highest-stress vertex: [x CSS px, y CSS px, visible 0|1]. */
  anchors: createAnchors('load', 'sigma'),
};
