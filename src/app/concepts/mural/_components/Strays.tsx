import type { CSSProperties } from 'react'
import { hash, pick } from '../_lib/tiles'

/* A few tiles come loose from the wall beside each section's heading: a small
   patch that thins out to the left, and pops in tile by tile as the section
   scrolls into view. Decoration only; the same patch on every visit. */

const COLS = 11
const ROWS = 4
const GREYS = ['#D8D7D2', '#C3C4C5', '#E5E3DC', '#A9ACB1']

export default function Strays({ seed }: { seed: number }) {
  const tiles = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const laid = hash(c, r, seed) < 0.1 + 0.8 * Math.pow((c + 1) / COLS, 1.7)
      const h = hash(c, r, seed + 1)
      const tone = h < 0.13 ? '#F2581C' : h < 0.28 ? '#2A5CFF' : h < 0.4 ? '#14161D' : pick(GREYS, hash(c, r, seed + 2))
      tiles.push(
        <i key={`${c}-${r}`} style={laid ? ({ background: tone, '--d': `${(COLS - c) * 28 + r * 34}ms` } as CSSProperties) : undefined} />,
      )
    }
  }
  return (
    <span className="mu-strays" data-rise aria-hidden="true">
      {tiles}
    </span>
  )
}
