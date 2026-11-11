import type { CSSProperties } from 'react'
import { hash, pick } from '../_lib/tiles'

/* A few tiles come loose from the wall beside each section's heading: a small
   patch that thins out to the left, and pops in tile by tile as the section
   scrolls into view. Decoration only; the same patch on every visit.

   One patch is a small gem instead (Thomas, 2026-11-11): beside his name the
   tiles make the little pixel creature from Claude Code, since Claude helped
   build this. It pops in from its centre outward. */

const COLS = 11
const ROWS = 4
const GREYS = ['#D8D7D2', '#C3C4C5', '#E5E3DC', '#A9ACB1']

/* X is body, E is an eye. */
const GEM = ['..XXXXXXXX..', '..XEXXXXEX..', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '..XXXXXXXX..', '..X.X..X.X..', '..X.X..X.X..']
const GEM_BODY = '#D97757'
const GEM_EYE = '#14161D'

export default function Strays({ seed, gem = false }: { seed: number; gem?: boolean }) {
  const tiles = []
  const rows = gem ? GEM.length : ROWS
  const cols = gem ? GEM[0].length : COLS
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let style: CSSProperties | undefined
      if (gem) {
        const bit = GEM[r][c]
        if (bit !== '.') {
          const far = Math.hypot(c - (cols - 1) / 2, r - (rows - 1) / 2)
          style = { background: bit === 'E' ? GEM_EYE : GEM_BODY, '--d': `${Math.round(far * 55)}ms` } as CSSProperties
        }
      } else if (hash(c, r, seed) < 0.1 + 0.8 * Math.pow((c + 1) / COLS, 1.7)) {
        const h = hash(c, r, seed + 1)
        const tone = h < 0.13 ? '#F2581C' : h < 0.28 ? '#2A5CFF' : h < 0.4 ? '#14161D' : pick(GREYS, hash(c, r, seed + 2))
        style = { background: tone, '--d': `${(COLS - c) * 28 + r * 34}ms` } as CSSProperties
      }
      tiles.push(<i key={`${c}-${r}`} style={style} />)
    }
  }
  return (
    <span className={`mu-strays${gem ? ' is-gem' : ''}`} data-rise aria-hidden="true">
      {tiles}
    </span>
  )
}
