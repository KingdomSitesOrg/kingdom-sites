'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { play } from '../_lib/sound'
import {
  BLUE,
  GROUT,
  G_ORANGE,
  G_PAGE,
  G_SKY,
  G_WALL,
  INK,
  ORANGE,
  PAGE,
  PAPER,
  RIM_FAR,
  RIM_IN,
  RIM_NEAR,
  WALL_SHADE,
  clamp,
  hash,
  noise,
  pick,
  skyTone,
  smooth,
  tileSize,
  wallTone,
} from '../_lib/tiles'

/* The hero: a wall of small tiles, drawn on a canvas behind the headline.
   A lit dome rises out of a dark sky with two glowing panels on it; the wall
   lays itself tile by tile when the page opens, tiles dip under the pointer,
   and a tap lays new tiles in the colour picked below. Only the tiles that
   are moving are redrawn, so a still wall costs nothing. */

const PAINTS = [
  { name: 'Orange', tone: ORANGE },
  { name: 'Blue', tone: BLUE },
  { name: 'White', tone: PAPER },
  { name: 'Black', tone: '#14161D' },
]

/* Tile kinds. A "plain" tile is the wall melting into the page: no grout, the page's own tone. */
const SKY_TILE = 0
const WALL_TILE = 1
const PLAIN_TILE = 2

const K = ['X..X', 'X.X.', 'XX..', 'X.X.', 'X..X']
const S = ['.XXX', 'X...', '.XX.', '...X', 'XXX.']

type Line = { cells: number[]; tone: string[]; ground: string[] }
type Panel = { lines: Line[]; line: number; cell: number; rest: number }

export default function Wall({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintRef = useRef(0)
  const [paint, setPaint] = useState(0)
  const [laid, setLaid] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: false })
    if (!section || !canvas || !ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cols = 0
    let rows = 0
    let T = 12 // one cell, in device pixels
    let rest = 10 // a resting tile, in device pixels
    let builtFor = 0
    let kind = new Uint8Array(0)
    let grout = new Uint8Array(0)
    let born = new Float32Array(0)
    let press = new Float32Array(0)
    let popAt = new Float64Array(0)
    let tone: string[] = []
    let pend: (string | null)[] = []
    let specks: number[] = []
    let panels: Panel[] = []
    let start = 0
    let raf = 0
    let live = true
    const active = new Set<number>()

    const back = (a: number) => 1 + 2.70158 * Math.pow(a - 1, 3) + 1.70158 * Math.pow(a - 1, 2)

    /** Draws one tile as it is right now. Says whether it is still moving. */
    function draw(i: number, now: number): boolean {
      const x = (i % cols) * T
      const y = ((i / cols) | 0) * T
      const full = T / rest
      let s = 1
      let moving = false
      if (born[i] >= 0) {
        const a = (now - start - born[i]) / 240
        if (a <= 0) {
          ctx!.fillStyle = INK
          ctx!.fillRect(x, y, T, T)
          return true
        }
        if (a < 1) {
          s = Math.min(full, back(a))
          moving = true
        } else born[i] = -1
      }
      if (popAt[i] > 0) {
        const p = (now - popAt[i]) / 220
        if (p < 0) moving = true
        else {
          const next = pend[i]
          if (next) {
            tone[i] = next
            pend[i] = null
            if (kind[i] === PLAIN_TILE) {
              kind[i] = WALL_TILE
              grout[i] = G_WALL
            }
          }
          if (p < 1) {
            s *= p < 0.45 ? 0.3 + (full - 0.3) * (1 - Math.pow(1 - p / 0.45, 3)) : full + (1 - full) * ((p - 0.45) / 0.55)
            moving = true
          } else popAt[i] = 0
        }
      }
      if (press[i] > 0) {
        s *= 1 - 0.34 * press[i]
        press[i] = press[i] < 0.04 ? 0 : press[i] * 0.86
        moving = moving || press[i] > 0
      }
      if (kind[i] === PLAIN_TILE) {
        ctx!.fillStyle = PAGE
        ctx!.fillRect(x, y, T, T)
        return moving
      }
      ctx!.fillStyle = GROUT[grout[i]]
      ctx!.fillRect(x, y, T, T)
      const size = Math.min(T, Math.max(1, Math.round(rest * s)))
      const off = Math.round((T - size) / 2)
      ctx!.fillStyle = tone[i]
      ctx!.fillRect(x + off, y + off, size, size)
      return moving
    }

    function frame(now: number) {
      raf = 0
      for (const i of active) if (!draw(i, now)) active.delete(i)
      if (active.size && live) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf && live) raf = requestAnimationFrame(frame)
    }

    /** Lays the whole wall out for the current size of the hero. */
    function build(animate: boolean) {
      const box = section!.getBoundingClientRect()
      const W = Math.round(box.width)
      const H = Math.round(box.height)
      if (!W || !H) return
      builtFor = W
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const t = tileSize(W)
      T = Math.round(t * dpr)
      rest = T - 2 * Math.max(1, Math.round(dpr / 2))
      canvas!.width = Math.round(W * dpr)
      canvas!.height = Math.round(H * dpr)
      cols = Math.ceil(canvas!.width / T)
      rows = Math.ceil(canvas!.height / T)
      const cell = T / dpr // one cell in CSS pixels
      const n = cols * rows
      kind = new Uint8Array(n)
      grout = new Uint8Array(n)
      born = new Float32Array(n).fill(-1)
      press = new Float32Array(n)
      popAt = new Float64Array(n)
      tone = new Array(n)
      pend = new Array(n).fill(null)
      specks = []
      panels = []
      active.clear()

      // Where the words are: the dome keeps clear of them.
      const copy = section!.querySelector('[data-hero-copy]')?.getBoundingClientRect()
      const copyBottom = copy ? copy.bottom - box.top : H * 0.5
      const copyRight = copy ? copy.right - box.left : W * 0.5
      const copyLeft = copy ? copy.left - box.left : 0
      const copyTop = copy ? copy.top - box.top : 0
      const wide = W >= 960

      // The dome is a circle with its peak at (px, py); below `ground` the wall runs the full width.
      let px: number, R: number, cy: number, ground: number
      if (wide) {
        px = W * 0.79
        ground = Math.max(copyBottom + 44, H * 0.66)
        R = clamp(px - (copyRight + 48), 220, H * 0.5)
        cy = ground - R * 0.12
      } else {
        px = W * 0.46
        R = W * 1.15
        cy = copyBottom + 34 + R
        ground = cy
      }
      const py = cy - R
      const reach = Math.hypot(W, H)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const x = (c + 0.5) * cell
          const y = (r + 0.5) * cell
          const h = hash(c, r, 1)
          const dDome = Math.hypot(x - px, y - cy) - R
          const out = Math.min(dDome, ground - y) // under zero: on the wall
          const rag = (h - 0.5) * cell * 1.1
          const order = animate ? 140 + (Math.hypot(x, H - y) / reach) * 950 + hash(c, r, 2) * 240 : -1

          if (out > rag) {
            // Sky, with a blue glow hugging the wall's edge.
            kind[i] = SKY_TILE
            grout[i] = G_SKY
            const inCopy = x > copyLeft - 12 && x < copyRight + 12 && y > copyTop - 12 && y < copyBottom + 12
            const glow = out < cell * 5 ? Math.pow(1 - out / (cell * 5), 2) * 0.8 : 0
            if (glow && hash(c, r, 4) < glow) {
              tone[i] = pick(out < cell * 1.6 ? RIM_NEAR : RIM_FAR, hash(c, r, 6))
              born[i] = animate ? order + 220 : -1
            } else {
              tone[i] = skyTone(c, r, inCopy)
              if (!inCopy && hash(c, r, 11) < 0.017) specks.push(i)
            }
            continue
          }

          // Wall. The last rows melt into the page: plain tiles in the page's tone.
          born[i] = order
          const melt = (r - (rows - 10)) / 9
          if (melt > 0 && hash(c, r, 7) < Math.pow(melt, 1.15)) {
            kind[i] = PLAIN_TILE
            grout[i] = G_PAGE
            tone[i] = PAGE
            continue
          }
          kind[i] = WALL_TILE
          grout[i] = G_WALL
          const onDome = dDome <= 0
          const nx = (x - px) / R
          const ny = (y - cy) / R
          // Lit from the lower left, in shade to the upper right.
          let b = onDome ? 0.8 - 0.36 * nx + 0.26 * (ny + 0.55) : 0.97 - 0.1 * Math.max(0, nx + 0.4)
          const settle = smooth(rows - 21, rows - 8, r)
          b += ((noise(c / 6, r / 6, 5) - 0.5) * 0.3 + (h - 0.5) * 0.12) * (1 - settle)
          b = b + (0.855 - b) * settle
          tone[i] = wallTone(b)
          if (settle < 0.5) {
            if (onDome && b < 0.72 && noise(c / 4 + 31, r / 4 + 7, 8) > 0.74) tone[i] = pick(WALL_SHADE, hash(c, r, 9))
            if (out > -cell * 2.5 && hash(c, r, 4) < 0.4) tone[i] = pick(RIM_IN, hash(c, r, 6))
            const stray = hash(c, r, 10)
            if (stray < 0.004) tone[i] = BLUE
            else if (stray < 0.007) tone[i] = ORANGE
            else if (stray < 0.011) tone[i] = '#14161D'
          }
        }
      }

      // Two glowing panels on the dome: one orange, one dark, each with rows of short marks.
      const sw = Math.round(clamp(cols * (wide ? 0.17 : 0.38), 13, 22))
      const sh = Math.round(sw * 0.64)
      const pc = Math.round(px / cell)
      const pr = Math.round(py / cell)
      const top = pr + (wide ? 9 : 7)
      const panel = (left: number, topRow: number, orange: boolean, seed: number) => {
        const lines: Line[] = []
        for (let j = 0; j < sh; j++) {
          const line: Line = { cells: [], tone: [], ground: [] }
          let run = 0
          let mark = ''
          let limit = sw - 2 - Math.floor(hash(j, seed, 21) * (sw * 0.45))
          let at = 2 + Math.floor(hash(j, seed, 22) * 3)
          for (let k = 0; k < sw; k++) {
            const c = left + k
            const r = topRow + j
            if (c < 0 || c >= cols || r < 0 || r >= rows) continue
            const i = r * cols + c
            if (kind[i] !== WALL_TILE || Math.hypot((c + 0.5) * cell - px, (r + 0.5) * cell - cy) > R - cell) continue
            const edge = k === 0 || j === 0 || k === sw - 1 || j === sh - 1
            const fill = orange ? pick(['#F2581C', '#F46A2E', '#E9501A'], hash(c, r, 23)) : pick(['#0E1118', '#11141D'], hash(c, r, 23))
            grout[i] = orange && !edge ? G_ORANGE : G_SKY
            tone[i] = edge ? '#14161D' : fill
            if (animate) born[i] += 320
            if (edge || j % 2 === 1 || j < 2 || j > sh - 3) continue
            // Marks: short runs with gaps, like lines of work on a screen.
            if (k < at || k > limit) continue
            if (run === 0) {
              const hm = hash(k, j, seed)
              run = 2 + Math.floor(hm * 4)
              mark = orange ? (hm < 0.75 ? '#2B1208' : '#7A2A0C') : hm < 0.6 ? '#8D95A6' : hm < 0.78 ? ORANGE : '#5A8BFF'
              limit = Math.min(limit, sw - 3)
            }
            line.cells.push(i)
            line.tone.push(mark)
            line.ground.push(fill)
            tone[i] = mark
            run--
            if (run === 0) at = k + 2 + Math.floor(hash(k, j, seed + 1) * 2)
          }
          if (line.cells.length) lines.push(line)
        }
        if (lines.length) panels.push({ lines, line: lines.length, cell: 0, rest: 6 + panels.length * 9 })
      }
      panel(pc - sw - 1, top, true, 41)
      panel(pc + 1, top + 3, false, 57)

      // A signature in blue tiles, where a muralist would sign.
      const signCol = wide ? 6 : cols - 12
      const signRow = rows - 17
      ;[K, S].forEach((glyph, g) =>
        glyph.forEach((row, j) =>
          row.split('').forEach((bit, k) => {
            const c = signCol + g * 5 + k
            const r = signRow + j
            if (bit !== 'X' || c < 0 || c >= cols || r < 0) return
            const i = r * cols + c
            if (kind[i] === SKY_TILE) return
            kind[i] = WALL_TILE
            grout[i] = G_WALL
            tone[i] = BLUE
          }),
        ),
      )

      start = performance.now()
      ctx!.fillStyle = INK
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      for (let i = 0; i < n; i++) if (draw(i, start)) active.add(i)
      kick()
    }

    /** Lays a small cluster of tiles around one cell, rippling outward. */
    function lay(c: number, r: number) {
      const now = performance.now()
      const shade = PAINTS[paintRef.current].tone
      let count = 0
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const cc = c + dc
          const rr = r + dr
          if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue
          const d = Math.abs(dc) + Math.abs(dr)
          const chance = d <= 1 ? 1 : d === 2 ? 0.55 : d === 3 ? 0.2 : 0
          if (Math.random() >= chance) continue
          const i = rr * cols + cc
          pend[i] = shade
          popAt[i] = now + d * 45 + 1
          born[i] = -1
          active.add(i)
          count++
        }
      }
      setLaid((v) => v + count)
      play('snap')
      kick()
    }

    const cellAt = (e: PointerEvent | MouseEvent) => {
      const b = canvas!.getBoundingClientRect()
      const k = canvas!.width / b.width
      return [Math.floor(((e.clientX - b.left) * k) / T), Math.floor(((e.clientY - b.top) * k) / T)]
    }

    const onMove = (e: PointerEvent) => {
      if (still) return
      const [c, r] = cellAt(e)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const cc = c + dc
          const rr = r + dr
          if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue
          const i = rr * cols + cc
          press[i] = Math.max(press[i], dc === 0 && dr === 0 ? 1 : dc === 0 || dr === 0 ? 0.6 : 0.3)
          active.add(i)
        }
      }
      kick()
    }

    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest('a, button, [data-nopaint]')) return
      const [c, r] = cellAt(e)
      lay(c, r)
    }

    // The panels type: one mark at a time, then two lines clear and are typed again.
    const type = () => {
      const now = performance.now()
      for (const p of panels) {
        if (p.rest > 0) {
          p.rest--
          continue
        }
        if (p.line >= p.lines.length) {
          const a = Math.floor(Math.random() * p.lines.length)
          const b = (a + 1 + Math.floor(Math.random() * (p.lines.length - 1))) % p.lines.length
          const again = [...new Set([a, b])].sort((m, k) => m - k)
          for (const li of again) {
            const line = p.lines[li]
            line.cells.forEach((i, k) => {
              tone[i] = line.ground[k]
              active.add(i)
            })
          }
          // Typed lines sit first in the list; the cleared ones go to the end to be typed again.
          p.lines = [...p.lines.filter((_, k) => !again.includes(k)), ...again.map((k) => p.lines[k])]
          p.line = p.lines.length - again.length
          p.cell = 0
          p.rest = 5
          continue
        }
        const line = p.lines[p.line]
        const i = line.cells[p.cell]
        pend[i] = line.tone[p.cell]
        popAt[i] = now
        active.add(i)
        p.cell++
        if (p.cell >= line.cells.length) {
          p.cell = 0
          p.line++
          p.rest = p.line >= p.lines.length ? 16 : 2
        }
      }
      // And now and then a lit tile in the sky changes its mind.
      if (specks.length && Math.random() < 0.3) {
        const i = specks[Math.floor(Math.random() * specks.length)]
        pend[i] = pick([BLUE, '#1B2E6B', ORANGE, '#2B303C', '#DDE3F0'], Math.random())
        popAt[i] = now
        active.add(i)
      }
      kick()
    }

    let timer = 0
    const run = (yes: boolean) => {
      live = yes
      window.clearInterval(timer)
      if (yes) {
        kick()
        if (!still) timer = window.setInterval(type, 95)
      }
    }

    const seen = new IntersectionObserver(([entry]) => run(entry.isIntersecting), { threshold: 0 })
    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (Math.round(section.getBoundingClientRect().width) !== builtFor) build(false)
      }, 160)
    }

    // The headline's typeface decides where the words end, so the wall waits for it (briefly).
    let cancelled = false
    const begin = () => {
      if (cancelled || builtFor) return
      build(!still)
      seen.observe(section)
    }
    document.fonts?.ready.then(begin)
    const fallback = window.setTimeout(begin, 700)

    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      live = false
      window.clearTimeout(fallback)
      window.clearTimeout(resizeTimer)
      window.clearInterval(timer)
      cancelAnimationFrame(raf)
      seen.disconnect()
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section ref={sectionRef} className="mu-hero" aria-label="Kingdom Sites">
      <canvas ref={canvasRef} aria-hidden="true" />
      {children}
      <div className="mu-picker" data-nopaint>
        <span className="mu-picker-label">
          <span className="mu-touch">Tap the wall</span>
          <span className="mu-mouse">Click the wall</span>
        </span>
        <div className="mu-swatches" role="radiogroup" aria-label="Tile colour">
          {PAINTS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              role="radio"
              aria-checked={i === paint}
              aria-label={p.name}
              className="mu-swatch"
              style={{ background: p.tone }}
              data-snap
              onClick={() => {
                paintRef.current = i
                setPaint(i)
              }}
            />
          ))}
        </div>
        <span className="mu-picker-count" aria-hidden="true">
          {String(laid).padStart(4, '0')}
        </span>
      </div>
    </section>
  )
}
