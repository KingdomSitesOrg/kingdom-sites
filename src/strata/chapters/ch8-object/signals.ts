import { createAnchors, createBBox } from '@/strata/story';

/**
 * Scene <-> Overlay channel (plain numbers, mutated in place). The Overlay writes the input fields, the
 * Scene integrates them in useChapterFrame and writes the rest. Initial values are what static mode shows.
 */
export const signals = {
  /** Turntable yaw, radians, and the same in whole degrees 0..359 for the slider. */
  yaw: 0,
  yawDeg: 35,
  /** Angular velocity, rad/s (inertia after a drag). */
  yawVel: 0,
  /** Material shown (index into MATERIAL_KEYS) and the swap band height in part millimetres. */
  material: 0,
  scanY: 43,

  dragging: 0,
  /** 1 while the slider has keyboard focus: the idle spin stops so each key step is exact. */
  held: 0,
  /** Horizontal drag since the Scene last read it, CSS px. */
  dragDX: 0,
  /** Pending keyboard rotation, radians (eased in by the Scene). */
  keyYaw: 0,
  /** Story time of the last pointer, key or material input (seconds). */
  lastInput: -1e9,
  /** A visitor material choice: swap from -> to starting at swapStart (story seconds). */
  swapFrom: 0,
  swapTo: 0,
  swapStart: -1e9,

  bbox: createBBox(),
  anchors: createAnchors('collar'),
};
