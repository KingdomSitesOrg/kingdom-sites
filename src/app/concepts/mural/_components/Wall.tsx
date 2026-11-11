'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BIT_COUNT, MAX_PER_TAP, nameBits, type MuralState } from '../_lib/name'
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
   tiles that are moving are redrawn, so a still wall costs nothing.

   The name is the shared part (Thomas, 2026-11-11). A tile of it that is
   still bare is drawn dim; one a visitor has laid is lit in the paint they
   chose, and it stays: it is saved (/api/mural) and shows on every other
   visitor's wall, arriving within half a minute on a wall that is already
   open. A tap anywhere else on the wall still lays tiles, for that visit only.
   The count is every tile laid on the wall by everyone. */

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

/* A tile of the name that nobody has laid yet: KINGDOM in slate, SITES in a mid blue. Light enough
   that the whole name reads at a glance whatever has been laid on it (Thomas, 2026-11-11: "a bit
   more readable"), and a step quieter than a laid tile. The closing tile is always the headline's orange. */
const BARE = [[], ['#66708A', '#6E7892', '#5F6982', '#77819B'], ['#2247C2', '#1F40B0', '#2650D6', '#1C3A9E'], ['#F2581C', '#F46A2E']]

/* A laid tile, by the paint it was laid in (the same order as PAINTS). Black is laid as slate, not
   as a hole: a tile painted black would otherwise vanish into the wall and break its letter. */
const LAID = [
  ['#F2581C', '#F46A2E'],
  ['#3D6BFF', '#5A8BFF', '#4A78FF'],
  ['#F7F5F0', '#E5E3DC', '#DCE6FF'],
  ['#3A4152', '#343A4A'],
]

/* How often an open wall asks what everyone else has laid. */
const LOOK_EVERY_MS = 25_000

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
    // The name's numbered tile each cell belongs to (-1: not part of the name), and each numbered tile's cells.
    let bitOf = new Int16Array(0)
    let bitCells: number[][] = []
    // The shared wall: each numbered tile's paint, -1 while bare. It outlives a rebuild of the canvas.
    const shared = new Int8Array(BIT_COUNT).fill(-1)
    // When this visitor last laid each numbered tile, so a slower answer from the server does not undo it.
    const touched = new Float64Array(BIT_COUNT)
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

    /** A tile of the name's tone right now: lit in its paint if laid, dim if bare. */
    const nameTone = (i: number, h: number) => {
      const paint = shared[bitOf[i]]
      return paint >= 0 ? pick(LAID[paint], h) : pick(BARE[family[i]], h)
    }

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
      bitOf = new Int16Array(n).fill(-1)
      bitCells = Array.from({ length: BIT_COUNT }, () => [])
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
      // On a phone the dark runs a few tiles lower, so the name's second line, SITES, sits well clear of the light.
      const foot = W < 640 ? 9 : 13
      const edgeAt = (c: number) => H - cell * (foot + (noise(c / 9, 0, 41) - 0.5) * 5)
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
      const { bits, unitsWide, unitsTall } = nameBits(wide)
      firstCol = Math.max(0, Math.round((cols - unitsWide * size) / 2))
      lastCol = firstCol + unitsWide * size - 1
      // It sits in the open dark between the words and the foot of the mural.
      const from = Math.ceil(copyBottom / cell) + 3
      const to = Math.floor((H - cell * 16) / cell) - 2 - unitsTall * size
      const topRow = to > from ? Math.round(from + (to - from) * 0.5) : from
      bits.forEach((bit, id) => {
        for (let dy = 0; dy < size; dy++) {
          for (let dx = 0; dx < size; dx++) {
            const c = firstCol + bit.x * size + dx
            const r = topRow + bit.y * size + dy
            if (c < 0 || c >= cols || r < 0 || r >= rows) continue
            const i = r * cols + c
            kind[i] = SKY_TILE
            grout[i] = G_SKY
            family[i] = bit.family
            bitOf[i] = id
            bitCells[id].push(i)
            tone[i] = nameTone(i, hash(c, r, 23))
            // Laid left to right as the page opens.
            born[i] = animate ? 500 + ((c - firstCol) / (unitsWide * size)) * 900 + hash(c, r, 24) * 160 : -1
            letters.push(i)
            const col = byCol.get(c)
            if (col) col.push(i)
            else byCol.set(c, [i])
          }
        }
      })
      wave = -1
      waveRest = 34

      start = performance.now()
      ctx!.fillStyle = INK
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      for (let i = 0; i < n; i++) if (draw(i, start)) active.add(i)
      kick()
    }

    /** Takes the wall as the server has it: tiles others laid pop in, left to right. */
    function take(state: MuralState) {
      if (!Array.isArray(state?.cells)) return
      const now = performance.now()
      const span = Math.max(1, lastCol - firstCol)
      for (let id = 0; id < BIT_COUNT; id++) {
        const paint = state.cells[id]
        if (paint === shared[id] || typeof paint !== 'number') continue
        // This visitor's own tile, laid a moment ago, wins over an answer that was already on its way.
        if (Date.now() - touched[id] < 6000) continue
        shared[id] = paint
        for (const i of bitCells[id]) {
          pend[i] = nameTone(i, Math.random())
          popAt[i] = still ? now - 1000 : now + 1 + (((i % cols) - firstCol) / span) * 700 + Math.random() * 120
          born[i] = -1
          active.add(i)
        }
      }
      if (typeof state.total === 'number') setLaid((v) => Math.max(v, state.total))
      kick()
    }

    let looking = false
    const look = () => {
      if (looking || document.hidden) return
      looking = true
      fetch('/api/mural', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((state) => state && live && take(state))
        .catch(() => {})
        .finally(() => {
          looking = false
        })
    }

    /** Lays a small cluster of tiles around one cell, rippling outward. Tiles of the name are saved for everyone. */
    function lay(c: number, r: number) {
      const now = performance.now()
      const paint = paintRef.current
      const shade = PAINTS[paint].tone
      let count = 0
      const saved = new Set<number>()
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const cc = c + dc
          const rr = r + dr
          if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue
          const d = Math.abs(dc) + Math.abs(dr)
          const chance = d <= 1 ? 1 : d === 2 ? 0.55 : d === 3 ? 0.2 : 0
          if (Math.random() >= chance || count >= MAX_PER_TAP) continue
          const i = rr * cols + cc
          count++
          const id = bitOf[i]
          if (id >= 0) {
            // A tile of the name: every cell of it takes the paint, and it is saved.
            if (saved.has(id)) continue
            saved.add(id)
            shared[id] = paint
            touched[id] = Date.now()
            for (const j of bitCells[id]) {
              pend[j] = nameTone(j, Math.random())
              popAt[j] = now + d * 45 + 1
              born[j] = -1
              active.add(j)
            }
            continue
          }
          pend[i] = shade
          popAt[i] = now + d * 45 + 1
          born[i] = -1
          active.add(i)
        }
      }
      if (!count) return
      setLaid((v) => v + count)
      play('snap')
      kick()
      fetch('/api/mural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lay: [...saved].map((id) => [id, paint]), count }),
        keepalive: true,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((state) => state && live && take(state))
        .catch(() => {})
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
        pend[i] = nameTone(i, Math.random())
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
    let lookTimer = 0
    const run = (yes: boolean) => {
      live = yes
      window.clearInterval(timer)
      window.clearInterval(lookTimer)
      if (yes) {
        kick()
        if (!still) timer = window.setInterval(breathe, 95)
        // While the wall is on screen it keeps up with what everyone else lays.
        look()
        lookTimer = window.setInterval(look, LOOK_EVERY_MS)
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
      window.clearInterval(lookTimer)
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
        {/* With a mouse the box says what to do. On a touch screen it has no label (Thomas, 2026-11-11):
            the paints and the count are enough. */}
        <span className="mu-picker-label mu-mouse">Click the wall</span>
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
        <span className="mu-picker-count" title="Tiles laid on this wall by everyone">
          <span aria-hidden="true">{String(laid).padStart(4, '0')}</span>
          <span className="mu-picker-all"> laid by everyone</span>
        </span>
      </div>
    </section>
  )
}
