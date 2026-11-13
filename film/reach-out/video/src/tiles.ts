// The mural's tile maths, the same as the first mural film (film/mural-promo), with a new palette:
// a dark aubergine wall, a warm cream foot, and three accents. Lime is the AI, coral is the person
// who falls behind, teal is the person who keeps up.

export const INK = "#070B14";
export const PAGE = "#E1E7EC";
export const PAPER = "#EBF0F4";
export const LIME = "#FFC24B";
export const CORAL = "#D66BFF";
export const TEAL = "#4CC9F0";

// Grout: the thin darker gap around a tile, by the surface it sits in.
export const GROUT_SKY = "#04070D";
export const GROUT_WALL = "#BAC4CE";

export const WALL = ["#7F8B99", "#97A3B0", "#AEB9C4", "#C2CCD5", "#D3DBE2", PAGE, PAPER];
export const SKY = ["#070B14", "#08101B", "#0A121E", "#0B1420"];
export const RIM_NEAR = ["#4CC9F0", "#36B4DE", "#7AD8F5"];
export const RIM_FAR = ["#8F5A14", "#6B4310", "#4C300C"];

// Tile families used by the film's pictures and letters.
export const T_WHITE = ["#EBF0F4", "#D3DBE2", "#E1E7EC"];
export const T_LIME = ["#FFC24B", "#FFD27A", "#F2AE2E"];
export const T_CORAL = ["#D66BFF", "#E08CFF"];
export const T_TEAL = ["#4CC9F0", "#36B4DE", "#7AD8F5"];
export const T_CORAL_DIM = ["#B33A4F", "#C4435A"];
export const T_TEAL_DIM = ["#8F5A14", "#12A089"];
export const T_SLATE = ["#6B6680", "#746F8A", "#7D7894"];
export const T_GREY = ["#97A3B0", "#AEB9C4", "#C2CCD5"];
export const T_PAPER = ["#C2CCD5", "#AEB9C4", "#D3DBE2"];
export const T_SCREEN = ["#0F1B2E", "#122036", "#0C1626"];
export const EYE = "#0C1626";

/** A steady 0..1 for a tile, so the wall is the same wall on every frame. */
export function hash(c: number, r: number, s = 0): number {
  let h = Math.imul(c | 0, 374761393) ^ Math.imul(r | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);

/** Soft blotches: the hash, blended between whole steps. */
export function noise(x: number, y: number, s = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const a = hash(x0, y0, s);
  const b = hash(x0 + 1, y0, s);
  const c = hash(x0, y0 + 1, s);
  const d = hash(x0 + 1, y0 + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const pick = <T,>(list: readonly T[], h: number): T => list[Math.min(list.length - 1, Math.floor(h * list.length))];

/** The pale wall's tone for a brightness of 0..1. */
export function wallTone(b: number): string {
  return WALL[Math.floor(clamp((b - 0.32) / 0.68) * 6.999)];
}

/** A tile of the dark mural: near black in soft patches, with a rare lit one. */
export function skyTone(c: number, r: number, quiet = false): string {
  const h = hash(c, r, 11);
  if (!quiet) {
    if (h < 0.003) return "#EAF2FF";
    if (h < 0.013) return h < 0.008 ? TEAL : "#10324A";
    if (h < 0.017) return h < 0.015 ? LIME : CORAL;
    if (h < 0.026) return "#1C3048";
    if (noise(c / 3.5, r / 3.5, 51) > 0.78 && hash(c, r, 52) < 0.55) return hash(c, r, 53) < 0.25 ? "#122036" : "#0F1B2E";
  }
  return noise(c / 5, r / 5, 3) > 0.68 ? "#0C1626" : pick(SKY, hash(c, r, 12));
}
