import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { Quality, StoryMode } from './types';
import { clampQuantity, type QuoteMaterial, type QuoteObject } from './quote';

export interface StillsManifest {
  version: number;
  chapters: Record<string, { stills: number[]; desktop: string[]; mobile: string[] }>;
}

/** Low-frequency story state. Anything that changes per frame lives on the director instead. */
export interface StoryState {
  /** Chapter whose domain contains the scroll position (switches at handoff midpoints). */
  active: number;
  mode: StoryMode;
  quality: Quality;
  /** Best tier this device may climb back to at runtime. */
  qualityCeiling: Quality;
  dpr: number;
  reducedMotion: boolean;
  viewport: { width: number; height: number };
  /** idle -> requested (chunk loading) -> ready (first frame drawn). */
  canvas: 'idle' | 'requested' | 'ready';
  /** Story on screen and tab visible: the canvas renders. */
  running: boolean;
  /** Story section on screen at all (the canvas layer is hidden otherwise). */
  onScreen: boolean;
  stills: StillsManifest | null;
  /** Client detection done (mode, tier, flags are real). False during SSR and hydration. */
  booted: boolean;
  flags: { capture: boolean; debug: boolean; forceStatic: boolean; forcedQuality: Quality | null };
}

export const storyStore = createStore<StoryState>(() => ({
  active: 0,
  mode: 'webgl',
  quality: 'medium',
  qualityCeiling: 'medium',
  dpr: 1,
  reducedMotion: false,
  viewport: { width: 1440, height: 900 },
  canvas: 'idle',
  running: false,
  onScreen: true,
  stills: null,
  booted: false,
  flags: { capture: false, debug: false, forceStatic: false, forcedQuality: null },
}));

export function useStoryStore<T>(selector: (s: StoryState) => T): T {
  return useStore(storyStore, selector);
}

/** Ch8 writes the material and the quote preset; #quote reads them (STORYBOARD 2.3, 5.3). */
export interface QuotePreset {
  object: QuoteObject;
  material: QuoteMaterial;
  q: number;
}

export interface PartChoiceState {
  material: QuoteMaterial;
  /** True once the visitor picked a material: Ch8's scroll auto-switch stops. */
  materialPinned: boolean;
  /** Set by "Quote this part"; null until then (#quote then starts at bracket, titanium, 1). */
  quotePreset: QuotePreset | null;
  setMaterial: (material: QuoteMaterial) => void;
  /** Sets the material and pins it (a visitor choice). */
  pinMaterial: (material: QuoteMaterial) => void;
  setMaterialPinned: (pinned: boolean) => void;
  setQuotePreset: (preset: QuotePreset | null) => void;
}

export const partStore = createStore<PartChoiceState>((set) => ({
  material: 'titanium',
  materialPinned: false,
  quotePreset: null,
  setMaterial: (material) => set({ material }),
  pinMaterial: (material) => set({ material, materialPinned: true }),
  setMaterialPinned: (materialPinned) => set({ materialPinned }),
  setQuotePreset: (preset) => set({ quotePreset: preset && { ...preset, q: clampQuantity(preset.q) } }),
}));

export function usePartStore<T>(selector: (s: PartChoiceState) => T): T {
  return useStore(partStore, selector);
}
