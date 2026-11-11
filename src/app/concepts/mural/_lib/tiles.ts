/* The mural's tiles: its colours, and the small maths every tiled surface on
   the page shares (the hero wall, the band into the closing section). */

export const INK = '#0A0C12'
export const PAGE = '#EFEDE6'
export const PAPER = '#F7F5F0'
export const ORANGE = '#F2581C'
export const BLUE = '#2A5CFF'

/* Grout: the thin gap around a tile, by the surface it sits in. */
export const GROUT = ['#08090E', '#D3D1CA', '#B8400F', PAGE] as const
export const G_SKY = 0
export const G_WALL = 1
export const G_ORANGE = 2
export const G_PAGE = 3

/* The wall from shade to full light; PAGE is the tone the page itself carries. */
export const WALL = ['#8E929A', '#A9ACB1', '#C3C4C5', '#D8D7D2', '#E5E3DC', PAGE, PAPER]
export const WALL_SHADE = ['#5C616B', '#444852', '#787C85']
export const SKY = ['#0A0C12', '#0B0D14', '#0C0F17', '#0D1019']
export const RIM_NEAR = ['#3D6BFF', '#2A5CFF', '#5A8BFF']
export const RIM_FAR = ['#1E46D6', '#173AA8', '#122C7F']
export const RIM_IN = ['#DCE6FF', '#B9CCFF']

/** A steady 0..1 for a tile, so the wall is the same wall on every visit. */
export function hash(c: number, r: number, s = 0): number {
  let h = Math.imul(c | 0, 374761393) ^ Math.imul(r | 0, 668265263) ^ Math.imul(s | 0, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const fade = (t: number) => t * t * (3 - 2 * t)

/** Soft blotches: the hash, blended between whole steps. */
export function noise(x: number, y: number, s = 0): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = fade(x - x0)
  const fy = fade(y - y0)
  const a = hash(x0, y0, s)
  const b = hash(x0 + 1, y0, s)
  const c = hash(x0, y0 + 1, s)
  const d = hash(x0 + 1, y0 + 1, s)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const smooth = (a: number, b: number, v: number) => fade(clamp((v - a) / (b - a)))
export const pick = <T,>(list: readonly T[], h: number): T => list[Math.min(list.length - 1, Math.floor(h * list.length))]

/** One tile's width on screen, in CSS pixels: finer on a phone. */
export const tileSize = (width: number) => (width < 640 ? 9 : width < 1100 ? 11 : 12)

/** The wall's tone for a brightness of 0..1. */
export function wallTone(b: number): string {
  return WALL[Math.floor(clamp((b - 0.32) / 0.68) * 6.999)]
}

/** A sky tile: near black, with a rare lit one. */
export function skyTone(c: number, r: number, quiet = false): string {
  const h = hash(c, r, 11)
  if (!quiet) {
    if (h < 0.003) return '#DDE3F0'
    if (h < 0.013) return h < 0.008 ? BLUE : '#1B2E6B'
    if (h < 0.017) return ORANGE
    if (h < 0.024) return '#2B303C'
  }
  return noise(c / 5, r / 5, 3) > 0.68 ? '#10131C' : pick(SKY, hash(c, r, 12))
}
