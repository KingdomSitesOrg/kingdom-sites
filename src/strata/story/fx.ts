import type { ChapterFx, ChapterFxInit, HazeSpot } from './types';

export const MAX_HAZE = 4;

/** Renderer defaults (STORYBOARD 3.4). Chapters override them in their definition and in useChapterFx(). */
export const FX_DEFAULTS = {
  exposure: 1,
  bloom: { intensity: 0.9, threshold: 0.8, radius: 0.65 },
  dof: { enabled: false, focusDistance: 120, focusRange: 40, bokehScale: 2 },
  ca: 0,
  grain: 0.04,
  vignette: 0.4,
} as const;

/** Extra chromatic aberration at wipe seams, peaking at handoff t = 0.5. */
export const SEAM_CA = 0.12;

export function createFx(init?: ChapterFxInit): ChapterFx {
  return {
    exposure: init?.exposure ?? FX_DEFAULTS.exposure,
    bloom: { ...FX_DEFAULTS.bloom, ...init?.bloom },
    dof: { ...FX_DEFAULTS.dof, ...init?.dof },
    ca: init?.ca ?? FX_DEFAULTS.ca,
    grain: init?.grain ?? FX_DEFAULTS.grain,
    vignette: init?.vignette ?? FX_DEFAULTS.vignette,
    haze: Array.from({ length: MAX_HAZE }, (_, i) => ({ x: 0.5, y: 0.5, radius: 0.12, strength: 0, ...init?.haze?.[i] })),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A scratch fx object (its haze array is the same fixed pool of MAX_HAZE spots). */
export function createFxPool(): ChapterFx {
  return createFx();
}

/** Blends two fx objects into a pooled `out` without allocating (spots beyond MAX_HAZE are dropped). */
export function blendFx(a: ChapterFx, b: ChapterFx, t: number, out: ChapterFx): ChapterFx {
  out.exposure = lerp(a.exposure, b.exposure, t);
  out.bloom.intensity = lerp(a.bloom.intensity, b.bloom.intensity, t);
  out.bloom.threshold = lerp(a.bloom.threshold, b.bloom.threshold, t);
  out.bloom.radius = lerp(a.bloom.radius, b.bloom.radius, t);
  // Depth of field fades through a crossfade by bokeh: a side without DoF counts as bokeh 0.
  const da = a.dof;
  const db = b.dof;
  out.dof.enabled = da.enabled || db.enabled;
  const from = da.enabled ? da : db;
  const to = db.enabled ? db : da;
  out.dof.focusDistance = lerp(from.focusDistance, to.focusDistance, t);
  out.dof.focusRange = lerp(from.focusRange, to.focusRange, t);
  out.dof.bokehScale = lerp(da.enabled ? da.bokehScale : 0, db.enabled ? db.bokehScale : 0, t);
  out.ca = lerp(a.ca, b.ca, t);
  out.grain = lerp(a.grain, b.grain, t);
  out.vignette = lerp(a.vignette, b.vignette, t);
  let n = pushHaze(a.haze, 1 - t, out.haze, 0);
  n = pushHaze(b.haze, t, out.haze, n);
  clearHaze(out.haze, n);
  return out;
}

export function copyFx(src: ChapterFx, out: ChapterFx): ChapterFx {
  out.exposure = src.exposure;
  out.bloom.intensity = src.bloom.intensity;
  out.bloom.threshold = src.bloom.threshold;
  out.bloom.radius = src.bloom.radius;
  out.dof.enabled = src.dof.enabled;
  out.dof.focusDistance = src.dof.focusDistance;
  out.dof.focusRange = src.dof.focusRange;
  out.dof.bokehScale = src.dof.bokehScale;
  out.ca = src.ca;
  out.grain = src.grain;
  out.vignette = src.vignette;
  clearHaze(out.haze, pushHaze(src.haze, 1, out.haze, 0));
  return out;
}

function pushHaze(src: HazeSpot[], scale: number, out: HazeSpot[], n: number) {
  for (let i = 0; i < src.length && n < MAX_HAZE; i++) {
    const s = src[i];
    if (s.strength * scale <= 0.001) continue;
    const o = out[n];
    o.x = s.x;
    o.y = s.y;
    o.radius = s.radius;
    o.strength = s.strength * scale;
    n++;
  }
  return n;
}

function clearHaze(out: HazeSpot[], from: number) {
  for (let i = from; i < out.length; i++) out[i].strength = 0;
}
