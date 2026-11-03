/**
 * Scene -> Overlay channel: written inside useChapterFrame, read by HUD getters. Plain numbers only.
 * The initial values are what static mode shows, so make them representative.
 */
export const signals = {
  /** Nozzle temperature, C (STORYBOARD Ch0 HUD; static shows 270). */
  temp: 270,
  /** Layers printed / total. */
  layer: 3,
  /** Bead-top height, mm. */
  z: 3.6,
  /** Nozzle tip on screen, 0..1 from the top-left. */
  tipX: 0.5,
  tipY: 0.5,
};
