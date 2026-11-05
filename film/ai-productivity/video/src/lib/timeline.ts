// The sheet (timeline.json, written by timeline/build.mjs), the scene
// manifest (scenes.generated.json, written by tools/scan-scenes.mjs) and small
// helpers. Everything a frame shows comes from these and the frame number.

import sheet from "../../timeline.json";
import manifestJson from "../scenes.generated.json";
import cursorSprite from "../../public/cursor.json";
import { cursorAt, type CursorKey, type CursorState, type Sprite } from "./cursor.ts";

export type Sheet = typeof sheet;
export const tl: Sheet = sheet;
export type Scene = Sheet["scenes"][number];

export type SourceKind = "frames" | "clip" | "drafts" | "latest" | "placeholder";
export type SceneEntry = {
  id: string;
  name: string;
  start: number;
  length: number;
  render: SourceKind;
  review: SourceKind;
  frames: { dir: string; count: number; complete: boolean; missing: number };
  clip: { file: string; frames: number; complete: boolean; fresh: boolean } | null;
  drafts: { set: string; stills: { localFrame: number; file: string }[] } | null;
  latest: string | null;
};
export type Manifest = {
  durationInFrames: number;
  scenes: SceneEntry[];
  audio: { mix: boolean; voice: { line: number; start: number; file: string; exists: boolean }[] };
};
export const bundledManifest = manifestJson as Manifest;

/** The scene a film frame belongs to (film frame 0 belongs to scene 1). */
export const sceneAt = (f: number): Scene => tl.scenes.find((s) => f >= s.start && f <= s.end) ?? tl.scenes[0];

/** Scene-local frame (1-based, as Blender renders it) for a film frame. Film frame 0 → scene 1's local 1. */
export const localFrame = (s: Scene, f: number): number => Math.max(1, f - s.start + 1);

// ── the one pointer ──────────────────────────────────────────────────────────
export const SPRITE: Sprite = { tipX: cursorSprite.tipX, tipY: cursorSprite.tipY, width: cursorSprite.width, height: cursorSprite.height };
export const CURSOR_KEYS = tl.cursor as CursorKey[];
export const cursorState = (f: number): CursorState => cursorAt(CURSOR_KEYS, SPRITE, tl.width, tl.height, f);

/** Every press in the film, with its target pixel. */
export const PRESSES = tl.scenes.flatMap((s) => s.presses.map((p) => ({ scene: s.id, name: p.name, frame: p.frame, x: p.x, y: p.y, source: p.source })));

/** The end: white then black, from s10's beats. */
type Fade = { whiteFrom: number; whiteFull: number; blackFull: number };
export const FADE: Fade | null = ((tl.scenes.find((s) => (s as { fade?: Fade }).fade) as { fade?: Fade } | undefined)?.fade) ?? null;
