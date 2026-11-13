// The tile alphabet: the site's 5x7 letters (src/app/concepts/mural/_lib/name.ts), plus the extra
// letters and marks this film needs, drawn in the same style.

export const GLYPHS: Record<string, string[]> = {
  // From the site.
  K: ["X...X", "X..X.", "X.X..", "XX...", "X.X..", "X..X.", "X...X"],
  I: ["XXX", ".X.", ".X.", ".X.", ".X.", ".X.", "XXX"],
  N: ["X...X", "XX..X", "X.X.X", "X.X.X", "X.X.X", "X..XX", "X...X"],
  G: [".XXX.", "X...X", "X....", "X.XXX", "X...X", "X...X", ".XXX."],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  S: [".XXXX", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."],
  T: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "..X.."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
  // Added for this film.
  C: [".XXXX", "X....", "X....", "X....", "X....", "X....", ".XXXX"],
  U: ["X...X", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  F: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "X...."],
  W: ["X...X", "X...X", "X...X", "X.X.X", "X.X.X", "XX.XX", "X...X"],
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  R: ["XXXX.", "X...X", "X...X", "XXXX.", "X.X..", "X..X.", "X...X"],
  Y: ["X...X", "X...X", ".X.X.", "..X..", "..X..", "..X..", "..X.."],
  // Added for the second film: the rest of the alphabet, digits and marks, in the same style.
  B: ["XXXX.", "X...X", "X...X", "XXXX.", "X...X", "X...X", "XXXX."],
  H: ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  J: ["..XXX", "...X.", "...X.", "...X.", "...X.", "X..X.", ".XX.."],
  L: ["X....", "X....", "X....", "X....", "X....", "X....", "XXXXX"],
  P: ["XXXX.", "X...X", "X...X", "XXXX.", "X....", "X....", "X...."],
  Q: [".XXX.", "X...X", "X...X", "X...X", "X.X.X", "X..X.", ".XX.X"],
  V: ["X...X", "X...X", "X...X", "X...X", "X...X", ".X.X.", "..X.."],
  X: ["X...X", "X...X", ".X.X.", "..X..", ".X.X.", "X...X", "X...X"],
  Z: ["XXXXX", "....X", "...X.", "..X..", ".X...", "X....", "XXXXX"],
  "0": [".XXX.", "X...X", "X..XX", "X.X.X", "XX..X", "X...X", ".XXX."],
  "1": [".X.", "XX.", ".X.", ".X.", ".X.", ".X.", "XXX"],
  "2": [".XXX.", "X...X", "....X", "...X.", "..X..", ".X...", "XXXXX"],
  "3": ["XXXX.", "....X", "....X", ".XXX.", "....X", "....X", "XXXX."],
  "4": ["X...X", "X...X", "X...X", "XXXXX", "....X", "....X", "....X"],
  "5": ["XXXXX", "X....", "X....", "XXXX.", "....X", "....X", "XXXX."],
  "6": [".XXX.", "X....", "X....", "XXXX.", "X...X", "X...X", ".XXX."],
  "7": ["XXXXX", "....X", "...X.", "..X..", "..X..", "..X..", "..X.."],
  "8": [".XXX.", "X...X", "X...X", ".XXX.", "X...X", "X...X", ".XXX."],
  "9": [".XXX.", "X...X", "X...X", ".XXXX", "....X", "....X", ".XXX."],
  "?": [".XXX.", "X...X", "....X", "...X.", "..X..", ".....", "..X.."],
  "!": ["X", "X", "X", "X", "X", ".", "X"],
  "'": ["X", "X", ".", ".", ".", ".", "."],
  "%": ["XX..X", "XX.X.", "...X.", "..X..", ".X...", ".X.XX", "X..XX"],
  "+": ["...", "...", ".X.", "XXX", ".X.", "...", "..."],
  ",": ["..", "..", "..", "..", "..", ".X", "X."],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
  ".": [".", ".", ".", ".", ".", ".", "X"],
  "-": ["...", "...", "...", "XXX", "...", "...", "..."],
};

/** How many letter-grid units a word is wide (letters one unit apart). */
export function wordUnits(text: string): number {
  let w = -1;
  for (const ch of text) w += GLYPHS[ch][0].length + 1;
  return w;
}

/** A word's tiles as wall cells, top-left at (c0, r0). `scale` 2 makes each letter square a 2x2 block of tiles. */
export function wordCells(text: string, c0: number, r0: number, scale: number): { c: number; r: number; letter: number }[] {
  const out: { c: number; r: number; letter: number }[] = [];
  let at = 0;
  let letter = 0;
  for (const ch of text) {
    const g = GLYPHS[ch];
    g.forEach((row, j) =>
      row.split("").forEach((bit, k) => {
        if (bit !== "X") return;
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) out.push({ c: c0 + (at + k) * scale + dx, r: r0 + j * scale + dy, letter });
      }),
    );
    at += g[0].length + 1;
    letter++;
  }
  return out;
}
