import { facts } from '@/strata/story/facts';

/**
 * Scene -> Overlay channel: written inside useChapterFrame, read by HUD getters. Plain numbers only.
 * The initial values are what static mode shows: the fully drawn layer 1.
 */
export const signals = {
  /** Layer shown in the toolpath phase. */
  layer: 1,
  /** Printed toolpath drawn so far on layer 1, mm (travel excluded). */
  drawMM: facts.layer.layer1PathMM as number,
  /** Pen point in world mm (x, y, z). */
  penWorld: new Float32Array(3),
};
