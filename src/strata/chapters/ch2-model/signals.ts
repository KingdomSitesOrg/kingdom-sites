import { createAnchors, createBBox } from '@/strata/story';

/**
 * Scene -> Overlay channel, written inside useChapterFrame. Initial values are what static mode and the
 * server render show.
 */
export const signals = {
  /** Active stage 0..4. */
  stage: 0,
  /** Counts read once from the geometry at mount (high-tier values until then). */
  stageCount: { points: 24000, edges: 1228, faces: 820, subdFaces: 32988 },
  /** Projected top of the clamp collar: the stage tag's leader. */
  anchors: createAnchors('collar'),
  /** Projected bounding box of the part: the bbox brackets. */
  bbox: createBBox(),
};
