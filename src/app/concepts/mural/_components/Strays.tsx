import type { CSSProperties } from 'react'
import { hash, pick } from '../_lib/tiles'

/* The page's one small gem (Thomas, 2026-11-11): beside his name, a patch of
   loose tiles in the page's colours falls into the shape of the little pixel
   creature from Claude Code, since Claude helped build this. It is a hint in
   the tiles, not the logo itself. It pops in from its centre outward as the
   section scrolls into view; the same patch on every visit. */

const GREYS = ['#D8D7D2', '#C3C4C5', '#E5E3DC', '#A9ACB1']

/* X is body, E is an eye. */
const GEM = ['..XXXXXXXX..', '..XEXXXXEX..', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '..XXXXXXXX..', '..X.X..X.X..', '..X.X..X.X..']
const GEM_EYE = '#14161D'

export default function Strays({ seed }: { seed: number }) {
  const rows = GEM.length
  const cols = GEM[0].length
  const tiles = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bit = GEM[r][c]
      let style: CSSProperties | undefined
      if (bit !== '.') {
        const far = Math.hypot(c - (cols - 1) / 2, r - (rows - 1) / 2)
        const h = hash(c, r, seed + 1)
        const tone = bit === 'E' ? GEM_EYE : h < 0.24 ? '#F2581C' : h < 0.44 ? '#2A5CFF' : pick(GREYS, hash(c, r, seed + 2))
        style = { background: tone, '--d': `${Math.round(far * 55)}ms` } as CSSProperties
      }
      tiles.push(<i key={`${c}-${r}`} style={style} />)
    }
  }
  return (
    <span className="mu-strays is-gem" data-rise aria-hidden="true">
      {tiles}
    </span>
  )
}
