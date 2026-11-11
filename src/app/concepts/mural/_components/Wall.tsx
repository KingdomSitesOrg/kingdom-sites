'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { play } from '../_lib/sound'
import {
  BLUE,
  GROUT,
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
  hash,
  noise,
  pick,
  skyTone,
  smooth,
  tileSize,
  wallTone,
} from '../_lib/tiles'

/* The hero: one large mural of small tiles, drawn on a canvas behind the
   headline. It is a night-dark wall with a few lit tiles, and the studio's
   name, KINGDOM SITES, laid large and quiet in tiles only a shade lighter
   than the wall. At the foot the mural breaks up into the light page below.
   The name is laid left to right when the page opens; tiles dip under the
   pointer, and a tap lays new tiles in the colour picked below. Only the
   tiles that are moving are redrawn, so a still wall costs nothing. */

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

/* The mural's lettering: each letter on a grid seven tiles tall. */
const GLYPHS: Record<string, string[]> = {
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

/* A lettering tile belongs to one of three families: KINGDOM in slate, SITES in the page's blue,
   and one orange tile that closes the name like the headline's full stop. Clear enough to read at
   a glance, still quieter than the headline in front of it. */
const FAMILY = [[], ['#4A5368', '#525C73', '#434B5F', '#5B667F'], ['#2A5CFF', '#2450E0', '#1E46D6', '#3D6BFF'], ['#F2581C', '#F46A2E']]
const INK_FAMILY = 1
const BLUE_FAMILY = 2
const ORANGE_FAMILY = 3

type Bit = { x: number; y: number; family: number }

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
    let family = new Uint8Array(0)
    let letters: number[] = []
    let byCol = new Map<number, number[]>()
    let firstCol = 0
    let lastCol = 0
    let wave = -1
    let waveRest = 28
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
      family = new Uint8Array(n)
      letters = []
      byCol = new Map()
      active.clear()

      // Where the words are: the lit tiles keep clear of them, and the name sits below them.
      const copy = section!.querySelector('[data-hero-copy]')?.getBoundingClientRect()
      const copyBottom = copy ? copy.bottom - box.top : H * 0.5
      const copyRight = copy ? copy.right - box.left : W * 0.5
      const copyLeft = copy ? copy.left - box.left : 0
      const copyTop = copy ? copy.top - box.top : 0
      const wide = W >= 960

      // Near the foot the mural breaks into the light page: a ragged line that wanders a little from column to column.
      const edgeAt = (c: number) => H - cell * (13 + (noise(c / 9, 0, 41) - 0.5) * 5)
      const reach = Math.hypot(W, H)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const x = (c + 0.5) * cell
          const y = (r + 0.5) * cell
          const h = hash(c, r, 1)
          const out = edgeAt(c) - y // above zero: still the dark mural
          const rag = (h - 0.5) * cell * 1.6
          const order = animate ? 140 + (Math.hypot(x, H - y) / reach) * 700 + hash(c, r, 2) * 240 : -1

          if (out > rag) {
            // The dark mural, with a blue glow where it meets the light.
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

          // The light foot. Its last rows melt into the page: plain tiles in the page's tone.
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
          const settle = smooth(rows - 12, rows - 5, r)
          const b = 0.86 + ((noise(c / 6, r / 6, 5) - 0.5) * 0.3 + (h - 0.5) * 0.12) * (1 - settle)
          tone[i] = wallTone(b)
          if (settle < 0.5) {
            if (out > -cell * 2.5 && hash(c, r, 4) < 0.4) tone[i] = pick(RIM_IN, hash(c, r, 6))
            const stray = hash(c, r, 10)
            if (stray < 0.012) tone[i] = BLUE
            else if (stray < 0.02) tone[i] = ORANGE
            else if (stray < 0.03) tone[i] = '#14161D'
          }
        }
      }

      // The mural: KINGDOM SITES. One line on a wide screen, two on a narrow one; twice the size from a tablet up.
      const size = W >= 640 ? 2 : 1
      const bits: Bit[] = []
      let unitsWide: number
      let unitsTall: number
      if (wide) {
        const a = word('KINGDOM', INK_FAMILY, 0, 0, bits)
        const b = word('SITES', BLUE_FAMILY, a + 3, 0, bits)
        bits.push({ x: a + 3 + b + 1, y: 6, family: ORANGE_FAMILY })
        unitsWide = a + 3 + b + 2
        unitsTall = 7
      } else {
        unitsWide = word('KINGDOM', INK_FAMILY, 0, 0, bits)
        const b = word('SITES', BLUE_FAMILY, 0, 9, bits)
        bits.push({ x: b + 1, y: 15, family: ORANGE_FAMILY })
        unitsTall = 16
      }
      firstCol = Math.max(0, Math.round((cols - unitsWide * size) / 2))
      lastCol = firstCol + unitsWide * size - 1
      // It sits in the open dark between the words and the foot of the mural.
      const from = Math.ceil(copyBottom / cell) + 3
      const to = Math.floor((H - cell * 16) / cell) - 2 - unitsTall * size
      const topRow = to > from ? Math.round(from + (to - from) * 0.5) : from
      for (const bit of bits) {
        for (let dy = 0; dy < size; dy++) {
          for (let dx = 0; dx < size; dx++) {
            const c = firstCol + bit.x * size + dx
            const r = topRow + bit.y * size + dy
            if (c < 0 || c >= cols || r < 0 || r >= rows) continue
            const i = r * cols + c
            kind[i] = SKY_TILE
            grout[i] = G_SKY
            family[i] = bit.family
            tone[i] = pick(FAMILY[bit.family], hash(c, r, 23))
            // Laid left to right as the page opens.
            born[i] = animate ? 500 + ((c - firstCol) / (unitsWide * size)) * 900 + hash(c, r, 24) * 160 : -1
            letters.push(i)
            const col = byCol.get(c)
            if (col) col.push(i)
            else byCol.set(c, [i])
          }
        }
      }
      wave = -1
      waveRest = 34

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

    // The mural keeps a little life: a tile of the name changes shade now and then, and every
    // few seconds a dip runs through the letters from left to right.
    const breathe = () => {
      const now = performance.now()
      if (letters.length && Math.random() < 0.5) {
        const i = letters[Math.floor(Math.random() * letters.length)]
        pend[i] = pick(FAMILY[family[i]], Math.random())
        popAt[i] = now
        active.add(i)
      }
      if (wave >= 0) {
        for (let c = wave; c < wave + 3; c++) {
          for (const i of byCol.get(c) ?? []) {
            press[i] = 0.9
            active.add(i)
          }
        }
        wave += 3
        if (wave > lastCol) {
          wave = -1
          waveRest = 60
        }
      } else if (--waveRest <= 0) wave = firstCol
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
        if (!still) timer = window.setInterval(breathe, 95)
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
