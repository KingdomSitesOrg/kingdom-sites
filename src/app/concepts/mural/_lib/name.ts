/* The mural's picture: the studio's name, KINGDOM SITES, as tiles on a grid
   seven tiles tall, closed by one tile like the headline's full stop.

   Every tile of the name has a number, the same on every screen and on the
   server. That number is how a tile laid by one visitor is found again on
   another visitor's wall, whether the name runs on one line or two. */

export const GLYPHS: Record<string, string[]> = {
  K: ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'],
  I: ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX'],
  N: ['X...X', 'XX..X', 'X.X.X', 'X.X.X', 'X.X.X', 'X..XX', 'X...X'],
  G: ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXX.'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
}

/* A tile of the name belongs to one of three families: KINGDOM, SITES, and the closing tile. */
export const KINGDOM_FAMILY = 1
export const SITES_FAMILY = 2
export const STOP_FAMILY = 3

export type Bit = { x: number; y: number; family: number }

/** Adds a word's tiles to `out`, starting at (x, y) in letter-grid units. Returns the word's width. */
function word(text: string, family: number, x: number, y: number, out: Bit[]): number {
  let at = x
  for (const ch of text) {
    const glyph = GLYPHS[ch]
    glyph.forEach((row, j) => row.split('').forEach((bit, k) => bit === 'X' && out.push({ x: at + k, y: y + j, family })))
    at += glyph[0].length + 1
  }
  return at - 1 - x
}

/** The name's tiles, in numbered order: on one line for a wide screen, on two for a narrow one. */
export function nameBits(wide: boolean): { bits: Bit[]; unitsWide: number; unitsTall: number } {
  const bits: Bit[] = []
  if (wide) {
    const a = word('KINGDOM', KINGDOM_FAMILY, 0, 0, bits)
    const b = word('SITES', SITES_FAMILY, a + 3, 0, bits)
    bits.push({ x: a + 3 + b + 1, y: 6, family: STOP_FAMILY })
    return { bits, unitsWide: a + 3 + b + 2, unitsTall: 7 }
  }
  const unitsWide = word('KINGDOM', KINGDOM_FAMILY, 0, 0, bits)
  const b = word('SITES', SITES_FAMILY, 0, 9, bits)
  bits.push({ x: b + 1, y: 15, family: STOP_FAMILY })
  return { bits, unitsWide, unitsTall: 16 }
}

const NAME = nameBits(true).bits

/** How many tiles the name has. */
export const BIT_COUNT = NAME.length

/** Each numbered tile's family, for the server to seed the wall with. */
export const BIT_FAMILY = NAME.map((b) => b.family)

/* The four paints a visitor can lay, by number. The wall stores only these numbers. */
export const PAINT_COUNT = 4
export const PAINT_ORANGE = 0
export const PAINT_BLUE = 1
export const PAINT_WHITE = 2

/** The most tiles one tap can lay (Wall.tsx lays a small cluster). */
export const MAX_PER_TAP = 13

/** What the shared wall looks like: each numbered tile's paint (-1 while bare), and every tile ever laid. */
export type MuralState = { cells: number[]; total: number }
