import type { ComponentType } from 'react';
import type { PerspectiveCamera } from 'three';
import type { RootState } from '@react-three/fiber';

export type Quality = 'high' | 'medium' | 'low';
export type StoryMode = 'webgl' | 'static';
export type EnterStyle = 'wipe' | 'crossfade' | 'cut';

/** How the incoming chapter replaces the previous one during the handoff. */
export type ChapterEnter =
  | { style: 'wipe' }
  | { style: 'crossfade' }
  | { style: 'cut'; via?: 'dark' | 'flash' };

/** Live, per-frame progress for one chapter. Mutated in place; never copy it into React state. */
export interface ChapterProgress {
  /** 0 -> 1 while the section is pinned (clamped). */
  p: number;
  /** Unclamped p, linear through both handoffs: -h at the start of the entry handoff, 1 + h at the end of the exit. */
  raw: number;
  /** 0 -> 1 during the handoff from the previous chapter, 1 once pinned. Always 1 for the first chapter. */
  enter: number;
  /** 0 -> 1 during the handoff to the next chapter (or to the SaaS page for the last chapter). */
  exit: number;
  /** True while the chapter is on screen, so its scene is drawn this frame. */
  visible: boolean;
  /** Story clock in seconds. Use it for ambient motion. Deterministic in capture mode. */
  time: number;
}

export interface HazeSpot {
  /** Screen space 0..1, x from the left, y from the top. */
  x: number;
  y: number;
  /** Radius as a fraction of the viewport height. */
  radius: number;
  /** 0..1 */
  strength: number;
}

/** Mutable post-processing parameters a chapter owns. The renderer reads them every frame. */
export interface ChapterFx {
  exposure: number;
  bloom: { intensity: number; threshold: number; radius: number };
  /** Depth of field, used only while this chapter is the single chapter on screen. Distances in world units. */
  dof: { enabled: boolean; focusDistance: number; focusRange: number; bokehScale: number };
  /** Chromatic aberration 0..1, keep it under 0.3. */
  ca: number;
  /** Film grain 0..1. */
  grain: number;
  /** Vignette 0..1. */
  vignette: number;
  /** Up to four heat-shimmer spots. */
  haze: HazeSpot[];
}

export type ChapterFxInit = Partial<Omit<ChapterFx, 'bloom' | 'dof'>> & {
  bloom?: Partial<ChapterFx['bloom']>;
  dof?: Partial<ChapterFx['dof']>;
};

export type SceneModule = { default: ComponentType };

export interface ChapterDefinition {
  /** Section id and anchor: 'print' -> #print. */
  id: string;
  title: string;
  /** Section height in viewport heights. Pinned scroll is length - 1. Must be >= 1.5. */
  length: { desktop: number; mobile: number };
  /** Loader for the R3F scene module. Called to prefetch at +-2 chapters, mounted at +-1. */
  scene: () => Promise<SceneModule>;
  /** DOM overlay rendered (and server-rendered) inside the sticky container. */
  Overlay: ComponentType;
  enter: ChapterEnter;
  /** Progress points captured as stills for static mode. */
  stills: number[];
  /** Scene clear colour, also the static placeholder base: a palette token ('bg-0') or a hex. */
  background: string;
  /** Initial fx values merged over the defaults. */
  fx?: ChapterFxInit;
  /** Initial camera settings. */
  camera?: { fov?: number; near?: number; far?: number };
}

export interface HandoffInfo {
  /** True while two chapters are on screen. */
  active: boolean;
  outgoing: number;
  incoming: number;
  /** 0 -> 1 across the handoff. Equals the incoming chapter's enter. */
  t: number;
  /** Top edge of the incoming section on screen, 0 = top of the viewport, 1 = bottom. */
  seam: number;
  style: EnterStyle;
  via: 'dark' | 'flash';
}

export type ChapterFrameCallback = (state: RootState, delta: number, progress: ChapterProgress) => void;

/** Canvas-side state of one chapter. Created by ChapterSlot, read by the renderer. */
export interface SlotState {
  index: number;
  scene: import('three').Scene;
  camera: PerspectiveCamera;
  subs: Set<{ current: ChapterFrameCallback }>;
  /** Scene content committed and shaders compiled. */
  compiled: boolean;
  /** Frames drawn since compiled. */
  drawn: number;
}

export interface StoryStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  dpr: number;
}
