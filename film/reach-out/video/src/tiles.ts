// The mural's tile maths, the same as the first mural film (film/mural-promo), with a new palette:
// a dark aubergine wall, a warm cream foot, and three accents. Lime is the AI, coral is the person
// who falls behind, teal is the person who keeps up.

export const INK = "#E9EEF5";
export const PAGE = "#E1E7EC";
export const PAPER = "#EBF0F4";
export const LIME = "#FFC24B";
export const CORAL = "#D66BFF";
export const TEAL = "#4CC9F0";

// Grout: the thin darker gap around a tile, by the surface it sits in.
export const GROUT_SKY = "#D9E1EC";
export const GROUT_WALL = "#223A5A";

export const WALL = ["#2A4466", "#304C70", "#36547A", "#3C5C84", "#42648E", "#486C96", "#4E74A0"];
export const SKY = ["#E9EEF5", "#E5EBF3", "#E1E8F1", "#DDE5EF"];
export const RIM_NEAR = ["#4CC9F0", "#36B4DE", "#7AD8F5"];
export const RIM_FAR = ["#BA751A", "#8B5715", "#633E10"];

// Tile families used by the film's pictures and letters.
export const T_WHITE = ["#1A2E4A", "#203656", "#16283F"];
export const T_LIME = ["#C47A10", "#D18A1E", "#B86E0A"];
export const T_CORAL = ["#D66BFF", "#E08CFF"];
export const T_TEAL = ["#1F86C4", "#2A93CF", "#1A78B2"];
export const T_CORAL_DIM = ["#E94B67", "#FF5775"];
export const T_TEAL_DIM = ["#BA751A", "#12A089"];
export const T_SLATE = ["#8B85A6", "#9790B3", "#7D7894"];
export const T_GREY = ["#97A3B0", "#AEB9C4", "#C2CCD5"];
export const T_PAPER = ["#C2CCD5", "#AEB9C4", "#D3DBE2"];
export const T_SCREEN = ["#14233C", "#172A46", "#101D31"];
export const EYE = "#101D31";

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
    if (h < 0.003) return "#FFFFFF";
    if (h < 0.013) return h < 0.008 ? TEAL : "#B8CDE6";
    if (h < 0.017) return h < 0.015 ? LIME : CORAL;
    if (h < 0.026) return "#C9D6E6";
    if (noise(c / 3.5, r / 3.5, 51) > 0.78 && hash(c, r, 52) < 0.55) return hash(c, r, 53) < 0.25 ? "#DCE4EF" : "#D8E1ED";
  }
  return noise(c / 5, r / 5, 3) > 0.68 ? "#E0E7F0" : pick(SKY, hash(c, r, 12));
}
