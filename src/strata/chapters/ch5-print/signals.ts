import { createAnchors } from '@/strata/story';

/**
 * Scene -> Overlay channel: written inside useChapterFrame, read by HUD getters. Plain numbers only.
 * The initial values are what static mode shows before a still is chosen, so they are representative.
 */
export const signals = {
  /** Continuous layer L (1..840). */
  L: 421,
  /** Layer on the bed, floor(L). */
  layer: 421,
  /** uZ, mm. */
  uZ: 21.05,
  /** Seconds left. */
  remaining: 5040,
  /** Nozzle temperature, °C (jittered live). */
  temp: 270,
  /** Index of the representative layer the XY plot shows. */
  layerPathId: 0,
  /** Nozzle on the XY plot, 0..1 across the plot box (x) and down it (z). */
  plotX: 0.5,
  plotY: 0.5,
  /** Projected anchors, CSS px: [x, y, visible]. */
  anchors: createAnchors('tip'),
};

/** Precomputed XY plot paths (SVG `d` per representative layer), written once when the toolpaths arrive. */
export const plot = {
  version: 0,
  paths: [] as string[],
};
