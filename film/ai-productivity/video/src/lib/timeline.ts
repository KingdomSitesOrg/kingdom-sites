// The sheet (timeline.json, written by timeline/build.mjs) and small helpers.
// Everything a frame shows comes from here and the frame number.

import sheet from "../../timeline.json";

export type Sheet = typeof sheet;
export const tl: Sheet = sheet;
export type Scene = Sheet["scenes"][number];

/** The scene a film frame belongs to (film frame 0 belongs to scene 1). */
export const sceneAt = (f: number): Scene => tl.scenes.find((s) => f >= s.start && f <= s.end) ?? tl.scenes[0];

/** Scene-local frame (1-based, as Blender renders it) for a film frame. Film frame 0 → scene 1's local 1. */
export const localFrame = (s: Scene, f: number): number => Math.max(1, f - s.start + 1);
