import { createBBox } from '@/strata/story';

/**
 * Scene <-> Overlay channel for Ch1. Plain numbers and typed arrays only.
 * The Overlay writes the prompt's geometry (on resize only); the Scene writes the live readouts.
 * The initial values are what static mode shows.
 */
export const signals = {
  /** Caret start (left edge of the prompt, vertical centre of its line) in CSS px of the sticky container. */
  caret: new Float32Array([604, 571]),
  /** The prompt's text box: min x, min y, max x, max y in CSS px. */
  textRect: new Float32Array([604, 557, 1014, 585]),
  /** Glyph ink samples of the typed prompt: x, y (CSS px), xNorm (0..1 across the prompt). Null until measured. */
  ink: null as Float32Array | null,
  /** Bumped whenever caret, textRect or ink change. */
  layoutVersion: 0,
  /** Cloud samples that have landed on the part. */
  landed: 24000,
  /** Samples in this tier's cloud. */
  samples: 24000,
  /** Projected bounds of the part: the bbox brackets. */
  bbox: createBBox(),
};
