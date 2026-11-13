// The mural's tile maths, the same as the first mural film (film/mural-promo), with a new palette:
// a dark aubergine wall, a warm cream foot, and three accents. Lime is the AI, coral is the person
// who falls behind, teal is the person who keeps up.

export const INK = "#0B0A12";
export const PAGE = "#F2EEE3";
export const PAPER = "#F8F5EC";
export const LIME = "#C6F432";
export const CORAL = "#FF4D6D";
export const TEAL = "#22D6B2";

// Grout: the thin darker gap around a tile, by the surface it sits in.
export const GROUT_SKY = "#08070D";
export const GROUT_WALL = "#D6D0C3";

export const WALL = ["#9A938A", "#B3ACA1", "#CBC4B8", "#DDD7CB", "#E9E4D8", PAGE, PAPER];
export const SKY = ["#0B0A12", "#0D0B15", "#0F0D18", "#100E1A"];
export const RIM_NEAR = ["#22D6B2", "#19C2A0", "#5BE6CB"];
export const RIM_FAR = ["#0F8F78", "#0B6B5B", "#084C42"];

// Tile families used by the film's pictures and letters.
export const T_WHITE = ["#F8F5EC", "#E9E4D8", "#F2EEE3"];
export const T_LIME = ["#C6F432", "#D4F85E", "#B4E61E"];
export const T_CORAL = ["#FF4D6D", "#FF6A85"];
export const T_TEAL = ["#22D6B2", "#19C2A0", "#5BE6CB"];
export const T_CORAL_DIM = ["#B33A4F", "#C4435A"];
export const T_TEAL_DIM = ["#0F8F78", "#12A089"];
export const T_SLATE = ["#6B6680", "#746F8A", "#7D7894"];
export const T_GREY = ["#B3ACA1", "#CBC4B8", "#DDD7CB"];
export const T_PAPER = ["#DDD7CB", "#CBC4B8", "#E9E4D8"];
export const T_SCREEN = ["#16132A", "#1A1731", "#120F20"];
export const EYE = "#120F20";

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
    if (h < 0.003) return "#EFEAF7";
    if (h < 0.013) return h < 0.008 ? TEAL : "#123D3A";
    if (h < 0.017) return h < 0.015 ? LIME : CORAL;
    if (h < 0.026) return "#2C2840";
    if (noise(c / 3.5, r / 3.5, 51) > 0.78 && hash(c, r, 52) < 0.55) return hash(c, r, 53) < 0.25 ? "#1A1731" : "#16132A";
  }
  return noise(c / 5, r / 5, 3) > 0.68 ? "#120F20" : pick(SKY, hash(c, r, 12));
}
