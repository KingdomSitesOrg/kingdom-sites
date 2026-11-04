'use client'

import { useEffect, useRef } from 'react'
import './film.css'

/**
 * The home page film: a laptop on a desk opens, the camera settles with the
 * whole laptop in view, and on its screen Farzana Classroom is in use: a
 * cursor goes round the app, clicking a class, the students and Analytics,
 * on a loop. The page opens on the closed laptop as the lights come up; once
 * the visitor scrolls and most of the scene is in view, the opening plays by itself,
 * and the page keeps scrolling freely the whole time (nothing is pinned).
 *
 * The film is a sequence of still frames drawn on a canvas as the page
 * scrolls. The manifest beside the frames says how many there are, where the
 * laptop's display sits in the last one (four corners, `screenQuad`) and the
 * laptop's outline (`laptopBox`), so the live app can sit exactly on that
 * screen and a phone can crop the film to the laptop.
 */
export const FILM_BASE = '/film'

type Kind = 'desktop' | 'phone'
type Rect = { x: number; y: number; w: number; h: number }
type Pt = [number, number]
/* `steam`: for each frame, the middle of the mug's opening and its radius, in frame pixels. */
type FilmSet = {
  w: number
  h: number
  dir: string
  fit?: 'cover' | 'contain'
  screenQuad?: Pt[]
  laptopBox?: Rect
  steam?: [number, number, number][]
  /* For each frame, the display's four corners (null while it faces away), and how bright it is, 0 to 1. */
  screenQuads?: (Pt[] | null)[]
  screenOn?: number[]
}
type Manifest = { frames: number; ext: string; desktop: FilmSet; phone: FilmSet }

/* Used until the manifest arrives, and for anything it leaves out. */
const QUAD: Pt[] = [
  [548, 262],
  [1052, 262],
  [1082, 592],
  [518, 592],
]
const BOX: Rect = { x: 340, y: 248, w: 920, h: 442 }
const FALLBACK: Manifest = {
  frames: 96,
  ext: 'jpg',
  desktop: { w: 1600, h: 1000, dir: 'desktop', screenQuad: QUAD, laptopBox: BOX },
  phone: { w: 1600, h: 1000, dir: 'desktop', screenQuad: QUAD, laptopBox: BOX },
}

/* The page opens on the dark room, low on the screen. The lights come up on
   the closed laptop this long after the visitor can actually see the scene
   (film.css, kf-lights); then it waits. When the visitor has scrolled the
   scene to fill the screen, it settles there, scrolling holds while the lid
   opens (AUTO_MS), and then the page scrolls on. */
const LIGHTS_MS = 1000
/* The live screen fades in over the last few frames. */
const FADE_FRAMES = 6
/* The film ends on this render frame. The camera comes to rest here; after it,
   the render's "hold" (frames 88 to 96) still creeps back by a fraction of a
   pixel a frame while the focus settles, which reads as a stutter, so those
   frames are never loaded or shown. */
const END_FRAME = 87
const lastFrame = (m: Manifest) => Math.min(m.frames, END_FRAME)
/* How long the lid takes to open, and so how long scrolling holds. */
const AUTO_MS = 3000
/* The cursor's moves run this much faster than the times written in the loop. */
const SPEED = 1.15

/* The live screen is the render's 16:10 display: the app's screenshots are
   1800 x 1095 (its own beta strip cropped off), shown at full size with 48 px
   off the right, so nothing is squeezed. */
const SHOT_W = 1800
const APP_W = 1752
const APP_H = 1095

type Screen = 'home' | 'classes' | 'students' | 'analytics'
const SHOTS: Record<Screen, string> = {
  home: '/work/app/home.webp',
  classes: '/work/app/class-admin.webp',
  students: '/work/app/students.webp',
  analytics: '/work/app/analytics.webp',
}

/* Places on the screenshots, in their own pixels. */
const SIDE = { x: 16, w: 266, h: 52 }
const ITEM: Record<'home' | 'classes' | 'students' | 'analytics', Rect> = {
  home: { ...SIDE, y: 181 },
  classes: { ...SIDE, y: 236 },
  students: { ...SIDE, y: 346 },
  analytics: { ...SIDE, y: 566 },
}
const CARD: Rect = { x: 361, y: 388, w: 908, h: 622 }
const STAT: Rect = { x: 361, y: 231, w: 678, h: 206 }
const mid = (r: Rect): Pt => [r.x + r.w * 0.42, r.y + r.h / 2]

/* The cursor's arrow is 25 px wide on the 1800 px screen (1.4 percent). */
const ARROW_W = 25
/* ...but never smaller than this on the page, so it can always be seen. */
const MIN_ARROW_PX = 13
/* ...and then drawn at this size: a smaller, lighter arrow. */
const ARROW_SCALE = 0.8

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const frameUrl = (m: Manifest, kind: Kind, i: number) => {
  const dir = m[kind].dir.replace(/\/$/, '')
  const base = dir.startsWith('/') ? dir : `${FILM_BASE}/${dir}`
  return `${base}/${String(i + 1).padStart(4, '0')}.${m.ext}`
}

/** The CSS matrix3d that puts a w x h rectangle (top left at 0, 0) onto four corners. */
function quadMatrix(w: number, h: number, q: Pt[]): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  let g = 0
  let hh = 0
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const det = dx1 * dy2 - dx2 * dy1
    g = (dx3 * dy2 - dx2 * dy3) / det
    hh = (dx1 * dy3 - dx3 * dy1) / det
  }
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + hh * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + hh * y3
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1]
  return `matrix3d(${m.map((v) => +v.toFixed(9)).join(',')})`
}

/**
 * The loop: the cursor uses the app for about sixteen seconds, then is back
 * where it started, on Home, and goes again. Everything is a Web Animation on
 * the live screen, so pausing them all pauses the loop exactly where it is.
 */
function startLoop(el: {
  live: HTMLElement
  shots: Record<Screen, HTMLElement>
  cursor: HTMLElement
  arrow: HTMLElement
  ripple: HTMLElement
  hover: HTMLElement
  sel: HTMLElement
  ring: HTMLElement
}) {
  let paused = true
  let dead = false
  let pos: Pt = [1100, 760]
  let bend = 1

  const track = (a: Animation) => {
    if (paused) a.pause()
    return a
  }
  // A pause is an animation with nothing in it, so it pauses with the rest.
  const wait = (ms: number) => track(el.live.animate([], { duration: ms })).finished
  const place = (p: Pt) => {
    el.cursor.style.transform = `translate(${p[0]}px, ${p[1]}px)`
  }
  const box = (node: HTMLElement, r: Rect | null) => {
    if (!r) {
      node.style.opacity = '0'
      return
    }
    node.style.left = `${r.x}px`
    node.style.top = `${r.y}px`
    node.style.width = `${r.w}px`
    node.style.height = `${r.h}px`
    node.style.opacity = '1'
  }
  const show = (s: Screen) => {
    for (const k of Object.keys(el.shots) as Screen[]) el.shots[k].classList.toggle('is-on', k === s)
  }

  // A hand moves in a slight curve, eases in and out, runs a hair past the
  // target and settles back.
  const move = async (to: Pt, ms: number) => {
    const from = pos
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const len = Math.hypot(dx, dy) || 1
    bend = -bend
    const c: Pt = [from[0] + dx / 2 - (dy / len) * len * 0.12 * bend, from[1] + dy / 2 + (dx / len) * len * 0.12 * bend]
    const ease = (t: number) => {
      if (t <= 0.84) {
        const u = t / 0.84
        return 1.018 * (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)
      }
      const u = (t - 0.84) / 0.16
      return 1.018 - 0.018 * (1 - (1 - u) * (1 - u))
    }
    const frames: Keyframe[] = []
    for (let i = 0; i <= 24; i++) {
      const s = ease(i / 24)
      const x = (1 - s) * (1 - s) * from[0] + 2 * (1 - s) * s * c[0] + s * s * to[0]
      const y = (1 - s) * (1 - s) * from[1] + 2 * (1 - s) * s * c[1] + s * s * to[1]
      frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` })
    }
    const a = track(el.cursor.animate(frames, { duration: ms / SPEED, easing: 'linear', fill: 'forwards' }))
    await a.finished
    pos = to
    place(to)
    a.cancel()
  }

  // A click: the arrow dips, a small ring spreads from its tip.
  const click = async () => {
    el.ripple.style.left = `${pos[0]}px`
    el.ripple.style.top = `${pos[1]}px`
    track(el.arrow.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.86)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' }))
    track(
      el.ripple.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0.55 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
        ],
        { duration: 480, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      ),
    )
    await wait(90)
  }

  // Click a sidebar item: it takes the selected colour at once, the screen follows.
  const go = async (item: keyof typeof ITEM, screen: Screen) => {
    box(el.hover, ITEM[item])
    await wait(260)
    await click()
    box(el.hover, null)
    box(el.sel, ITEM[item])
    await wait(90)
    show(screen)
    await wait(260)
    box(el.sel, null)
  }

  const run = async () => {
    while (!dead) {
      show('home')
      pos = [1100, 760]
      place(pos)
      await wait(700)
      // Home, then the Sample Class card.
      await move([560, 720], 1150)
      box(el.ring, CARD)
      await wait(650)
      await click()
      await wait(80)
      show('classes')
      box(el.ring, null)
      await wait(350)
      await move([900, 900], 1300)
      await wait(500)
      // Your students: the list, read down.
      await move(mid(ITEM.students), 1150)
      await go('students', 'students')
      await move([720, 470], 800)
      await wait(250)
      await move([1260, 780], 2100)
      await wait(450)
      // Analytics, and a look at a number.
      await move(mid(ITEM.analytics), 1100)
      await go('analytics', 'analytics')
      await move([640, 330], 900)
      box(el.ring, STAT)
      await wait(1200)
      box(el.ring, null)
      // Home again, and back to where it began.
      await move(mid(ITEM.home), 1100)
      await go('home', 'home')
      await wait(300)
      await move([1100, 760], 1000)
    }
  }
  run().catch(() => {
    /* cancelled when the page leaves */
  })

  const all = () => el.live.getAnimations({ subtree: true })
  return {
    play() {
      if (!paused) return
      paused = false
      for (const a of all()) if (a.playState === 'paused') a.play()
    },
    pause() {
      if (paused) return
      paused = true
      for (const a of all()) if (a.playState === 'running') a.pause()
    },
    stop() {
      dead = true
      for (const a of all()) a.cancel()
    },
  }
}

/**
 * Steam over the mug: a few dozen soft puffs rise from the cup, widen, drift
 * and fade, on a small canvas that sits on the mug's opening. It runs on its
 * own clock, so it keeps rising while the page holds still.
 */
function startSteam(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  // One soft puff, drawn once and stamped many times.
  const puff = document.createElement('canvas')
  puff.width = puff.height = 64
  const pc = puff.getContext('2d')
  if (pc) {
    const g = pc.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,0.7)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.28)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.035)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    pc.fillStyle = g
    pc.fillRect(0, 0, 64, 64)
  }
  type P = { x: number; age: number; life: number; seed: number; drift: number }
  const ps: P[] = []
  let r = 0
  let dpr = 1
  let raf = 0
  let last = 0
  let running = false
  let dead = false
  let spawn = 0

  // The canvas is 7 radii wide and 6 tall; the cup's opening is at the middle of its bottom edge.
  // The canvas is rebuilt only when the cup's size changes a lot; in between it
  // is scaled, so the camera's move never makes it reallocate every frame.
  const place = (x: number, y: number, radius: number, scale: number) => {
    const nr = Math.max(4, radius * scale)
    if (!r || Math.abs(nr / r - 1) > 0.25) {
      r = nr
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(r * 7 * dpr)
      canvas.height = Math.round(r * 6 * dpr)
      canvas.style.width = `${r * 7}px`
      canvas.style.height = `${r * 6}px`
    }
    const k = nr / r
    canvas.style.transform = `translate(${(x - nr * 3.5).toFixed(1)}px, ${(y - nr * 6).toFixed(1)}px) scale(${k.toFixed(4)})`
    canvas.style.visibility = 'visible'
  }
  const hide = () => {
    canvas.style.visibility = 'hidden'
  }

  const frame = (t: number) => {
    raf = 0
    if (!running || dead || !ctx) return
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
    last = t
    spawn += dt * 10
    while (spawn >= 1) {
      spawn -= 1
      ps.push({ x: (Math.random() - 0.5) * 0.8, age: 0, life: 9 + Math.random() * 4, seed: Math.random() * 100, drift: (Math.random() - 0.5) * 0.5 })
    }
    const w = canvas.width
    const h = canvas.height
    const R = r * dpr
    ctx.clearRect(0, 0, w, h)
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]
      p.age += dt
      const k = p.age / p.life
      if (k >= 1) {
        ps.splice(i, 1)
        continue
      }
      // Up about three radii over its life, just above the cup, then gone; a slow sway that grows as it rises.
      const rise = 3.4 * Math.pow(k, 1.15)
      const sway = Math.sin(p.seed + p.age * 0.38) * (0.12 + rise * 0.12) + p.drift * rise * 0.4
      const cx = w / 2 + (p.x + sway) * R
      const cy = h - rise * R
      const size = R * (0.28 + k * 1.3)
      const width = R * (0.2 + k * 0.68)
      // Ease in at the rim, then fade away; keep the wisps tall and narrow.
      const fadeIn = Math.min(1, k * 12)
      const a = fadeIn * fadeIn * (3 - 2 * fadeIn) * Math.pow(1 - k, 1.5) * 0.085
      ctx.globalAlpha = a
      ctx.drawImage(puff, cx - width / 2, cy - size * 1.4, width, size * 2)
    }
    ctx.globalAlpha = 1
    raf = requestAnimationFrame(frame)
  }

  return {
    place,
    hide,
    play() {
      if (running || dead) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    },
    pause() {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
    },
    stop() {
      dead = true
      running = false
      cancelAnimationFrame(raf)
    },
  }
}

export default function LaptopFilm() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const posterRef = useRef<HTMLPictureElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const steamRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const live = liveRef.current
    const poster = posterRef.current
    const steamCanvas = steamRef.current
    const ctx = canvas?.getContext('2d')
    if (!section || !stage || !canvas || !live || !ctx || !steamCanvas) return
    // When the opening started playing, by the clock.
    let auto: { start: number } | null = null
    let manReady = false
    const steam = startSteam(steamCanvas)
    const q = <T extends HTMLElement>(s: string) => live.querySelector(s) as T
    const dim = q<HTMLElement>('.kf-dim')
    const shadeEl = stage.querySelector('.kf-shade') as HTMLElement

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const portrait = window.matchMedia('(orientation: portrait)')
    let man = FALLBACK
    let kind: Kind = portrait.matches ? 'phone' : 'desktop'
    const imgs: Record<Kind, (HTMLImageElement | null)[]> = { desktop: [], phone: [] }
    const ready: Record<Kind, boolean[]> = { desktop: [], phone: [] }
    const started: Record<Kind, boolean> = { desktop: false, phone: false }

    // Measured on resize only, so the scroll loop never reads layout.
    let W = 0
    let H = 0
    let dpr = 1
    // The frame's place on the stage: stage = offset + frame * scale.
    let s = 1
    let ox = 0
    let oy = 0
    let drawn = -1
    let drawnKey = ''
    let lastFade = -1
    let raf = 0
    let dead = false
    let inView = false
    // When the lights came on (0 until then).
    let litAt = 0
    let lightsTimer = 0
    let shaded = -1

    const set = () => ({ ...FALLBACK[kind], ...man[kind] })
    const quad = () => set().screenQuad ?? QUAD
    const lbox = () => set().laptopBox ?? BOX

    // Frames load in order, a few at a time; the last frame first if motion is off.
    const load = (k: Kind) => {
      if (started[k]) return
      started[k] = true
      const n = lastFrame(man)
      // The phone set may reuse the desktop frames: share what is already loaded.
      const same = man.phone.dir === man.desktop.dir
      if (same && k === 'phone' && started.desktop) {
        imgs.phone = imgs.desktop
        ready.phone = ready.desktop
        return
      }
      if (same && k === 'desktop' && started.phone) {
        imgs.desktop = imgs.phone
        ready.desktop = ready.phone
        return
      }
      imgs[k] = new Array(n).fill(null)
      ready[k] = new Array(n).fill(false)
      if (same) {
        imgs[k === 'phone' ? 'desktop' : 'phone'] = imgs[k]
        ready[k === 'phone' ? 'desktop' : 'phone'] = ready[k]
      }
      const order = reduce.matches ? [n - 1] : Array.from({ length: n }, (_, i) => i)
      let next = 0
      const list = imgs[k]
      const ok = ready[k]
      const pump = () => {
        if (dead || next >= order.length) return
        const i = order[next++]
        const img = new Image()
        img.decoding = 'async'
        // Decoded before it is used, so drawing it never stalls the opening.
        img.onload = () => {
          const done = () => {
            ok[i] = true
            schedule()
            pump()
          }
          img.decode().then(done, done)
        }
        img.onerror = () => pump()
        img.src = frameUrl(man, k, i)
        list[i] = img
      }
      for (let c = 0; c < 4; c++) pump()
    }

    // Where the frame sits on the stage, and where the laptop's screen is.
    const measure = () => {
      const fs = set()
      const b = lbox()
      W = stage.clientWidth
      // A phone uses its own upright film when there is one; until then it
      // borrows the computer's film, cropped to the laptop.
      const borrowed = kind === 'phone' && (fs.fit === 'contain' || fs.dir === man.desktop.dir)
      if (borrowed) {
        // The laptop, with a little room round it, across the whole width.
        const m = b.w * 0.06
        const cx = Math.max(0, b.x - m)
        const cy = Math.max(0, b.y - m)
        const cw = Math.min(fs.w, b.x + b.w + m) - cx
        const ch = Math.min(fs.h, b.y + b.h + m) - cy
        s = W / cw
        // Room above and below: more of the desk and the room, never past the frame's edges.
        const h = Math.round(Math.min(fs.h * s, ch * s + W * 0.32))
        stage.style.height = `${h}px`
        H = h
        ox = -cx * s
        oy = Math.min(0, Math.max(H - fs.h * s, (H - ch * s) / 2 - cy * s))
      } else {
        // The whole screen below the header (the stylesheet's sizes).
        stage.style.height = ''
        H = stage.clientHeight
        // Fill the stage, unless that would cut off the laptop; and keep the laptop in view.
        // An upright phone film is framed for the phone already: it always fills the stage.
        const m = kind === 'phone' ? 0 : b.w * 0.04
        const cover = Math.max(W / fs.w, H / fs.h)
        s = kind === 'phone' ? cover : Math.min(cover, W / (b.w + m * 2), H / (b.h + m * 2))
        const within = (lo: number, hi: number, v: number) => Math.min(hi, Math.max(lo, v))
        ox = within(-(b.x - m) * s, W - (b.x + b.w + m) * s, (W - fs.w * s) / 2)
        oy = within(-(b.y - m) * s, H - (b.y + b.h + m) * s, (H - fs.h * s) / 2)
        // Never past the frame's own edges.
        if (fs.w * s >= W) ox = within(W - fs.w * s, 0, ox)
        if (fs.h * s >= H) oy = within(H - fs.h * s, 0, oy)
      }
      dpr = Math.min(2, window.devicePixelRatio || 1)
      // Resizing a canvas clears it and costs a new buffer: only when the size really changes.
      const cw = Math.round(W * dpr)
      const ch = Math.round(H * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }

      // The live screen, on the display's four corners.
      const qd = quad().map(([x, y]) => [ox + x * s, oy + y * s] as Pt)
      live.style.transform = quadMatrix(APP_W, APP_H, qd)
      const screenPx = Math.hypot(qd[1][0] - qd[0][0], qd[1][1] - qd[0][1])
      const arrowPx = (ARROW_W * screenPx) / APP_W
      live.style.setProperty('--kf-cur', String(Math.max(1, MIN_ARROW_PX / Math.max(1, arrowPx)) * ARROW_SCALE))
      drawn = -1
      schedule()
    }

    const els = {
      live,
      shots: {
        home: q<HTMLElement>('[data-screen="home"]'),
        classes: q<HTMLElement>('[data-screen="classes"]'),
        students: q<HTMLElement>('[data-screen="students"]'),
        analytics: q<HTMLElement>('[data-screen="analytics"]'),
      },
      cursor: q<HTMLElement>('.kf-cursor'),
      arrow: q<HTMLElement>('.kf-arrow'),
      ripple: q<HTMLElement>('.kf-ripple'),
      hover: q<HTMLElement>('.kf-hover'),
      sel: q<HTMLElement>('.kf-sel'),
      ring: q<HTMLElement>('.kf-ring'),
    }
    let loop: ReturnType<typeof startLoop> | null = null
    const steer = () => {
      if (!reduce.matches && inView && !document.hidden) steam.play()
      else steam.pause()
      // The cursor starts once the film has finished, so its last frames have the page to themselves.
      const want = !reduce.matches && inView && !document.hidden && lastFade >= 1
      if (want && !loop) loop = startLoop(els)
      if (!loop) return
      if (want) loop.play()
      else loop.pause()
    }

    const tick = () => {
      raf = 0
      const fs = set()
      const n = lastFrame(man)

      // The scene fills the screen: the opening plays, and scrolling holds while it does.
      // (Not before the manifest: until then a phone lays the stage out differently.)
      if (!auto && manReady && !reduce.matches) {
        const top = stage.getBoundingClientRect().top
        const head = headBottom()
        if (top <= head + 2) {
          // Come to rest exactly on it, unless they were already far past it (a reload further down).
          if (top > -window.innerHeight * 0.3 && performance.now() - jumpedAt > JUMP_MS) {
            window.scrollTo({ top: window.scrollY + top - head, behavior: 'instant' })
            hold(AUTO_MS)
          }
          if (!litAt) lightNow()
          auto = { start: performance.now() }
        }
      }
      let at = reduce.matches ? n - 1 : 0
      if (auto && !reduce.matches) {
        const t = clamp((performance.now() - auto.start) / AUTO_MS)
        at = t * (n - 1)
        if (t < 1) schedule()
      }
      // The top of the room stays in shadow until the lid opens, then clears.
      const shade = reduce.matches ? 0 : Number((1 - Math.min(1, (at / (n - 1)) * 2.2)).toFixed(3))
      if (shade !== shaded) {
        shaded = shade
        shadeEl.style.opacity = String(shade)
      }
      const want = Math.round(at)
      let idx = -1
      for (let d = 0; d < n && idx < 0; d++) {
        if (ready[kind][want - d]) idx = want - d
        else if (ready[kind][want + d]) idx = want + d
      }
      const key = `${kind}:${idx}`
      if (idx >= 0 && (key !== drawnKey || drawn < 0)) {
        const img = imgs[kind][idx]!
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = '#0b0b0c'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.imageSmoothingQuality = 'high'
        const k = (s * dpr * fs.w) / img.naturalWidth
        ctx.drawImage(img, ox * dpr, oy * dpr, img.naturalWidth * k, img.naturalHeight * k)
        if (drawn < 0 && poster) poster.style.visibility = 'hidden'
        drawn = idx
        drawnKey = key
        // The sharp app sits on the display in every frame it can be seen, dimmed
        // as the screen wakes, so the screen never looks soft while the lid opens.
        if (fs.screenQuads && !reduce.matches) {
          const sq = fs.screenQuads[idx]
          const on = fs.screenOn?.[idx] ?? 1
          if (sq) live.style.transform = quadMatrix(APP_W, APP_H, sq.map(([x, y]) => [ox + x * s, oy + y * s] as Pt))
          live.style.opacity = sq ? Math.min(1, on * 4).toFixed(3) : '0'
          // The manifest gives linear light; CSS opacity needs display brightness.
          dim.style.opacity = (1 - Math.pow(on, 1 / 2.2)).toFixed(3)
        } else {
          dim.style.opacity = '0'
        }
        const at = fs.steam?.[idx]
        if (at && !reduce.matches) steam.place(ox + at[0] * s, oy + at[1] * s, at[2], s)
        else steam.hide()
      }

      // The live screen comes up over the render's own screen on the last frames.
      const fade = reduce.matches ? 1 : clamp((at - (n - 1 - FADE_FRAMES)) / FADE_FRAMES)
      if (fade !== lastFade) {
        lastFade = fade
        if (!fs.screenQuads || reduce.matches) live.style.opacity = fade.toFixed(3)
        steer()
      }
    }

    // Scrolling only matters until the opening has started.
    const onScroll = () => {
      if (!auto) schedule()
    }

    // Where the fixed header ends: the scene "fills the screen" when its top reaches it.
    const header = document.querySelector('.cn-head')
    const headBottom = () => header?.getBoundingClientRect().bottom ?? 0

    // Holding scrolling for the opening: no wheel, touch or keys move the page, and
    // the page itself cannot scroll (which also stops a phone's flick in flight).
    const html = document.documentElement
    const stop = (e: Event) => e.preventDefault()
    const keys = (e: KeyboardEvent) => {
      if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key) && !(e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]')) e.preventDefault()
    }
    // A link to somewhere further down (the hero's "Start a conversation") passes
    // the scene on its way: it plays, but does not stop the page there.
    const JUMP_MS = 1500
    let jumpedAt = -Infinity
    const onJump = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest?.('a[href^="#"]')) jumpedAt = performance.now()
    }
    const onHash = () => {
      jumpedAt = performance.now()
    }

    let holdTimer = 0
    const release = () => {
      window.clearTimeout(holdTimer)
      holdTimer = 0
      html.classList.remove('kf-hold')
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', keys)
    }
    const hold = (ms: number) => {
      if (holdTimer) return
      html.classList.add('kf-hold')
      window.addEventListener('wheel', stop, { passive: false })
      window.addEventListener('touchmove', stop, { passive: false })
      window.addEventListener('keydown', keys)
      holdTimer = window.setTimeout(release, ms)
    }

    function schedule() {
      if (!raf && !dead) raf = requestAnimationFrame(tick)
    }

    function onPageLoad() {
      if (!dead) load(kind)
    }
    const onOrient = () => {
      kind = portrait.matches ? 'phone' : 'desktop'
      load(kind)
      measure()
    }
    const onMotion = () => {
      // Turning motion off or on changes the page's height and what loads first.
      started.desktop = started.phone = false
      load(kind)
      measure()
      steer()
    }

    measure()
    // Lights on: LIGHTS_MS after the scene is really on screen. Not timed from
    // the page's load: Safari loads pages before they are shown (while the address
    // is still being typed), so the clock starts on the first frame actually drawn
    // with the page showing, and stops again if the page is hidden first.
    let lightsFrame = 0
    // (Arrows, not hoisted functions: they run only after this effect has set everything up.)
    const lightNow = () => {
      window.clearTimeout(lightsTimer)
      cancelAnimationFrame(lightsFrame)
      lightsFrame = lightsTimer = 0
      litAt = performance.now()
      stage.dataset.lit = ''
    }
    const lightUp = () => {
      if (litAt || lightsTimer || lightsFrame || dead) return
      if (!inView || document.visibilityState !== 'visible') return
      lightsFrame = requestAnimationFrame(() => {
        lightsFrame = 0
        if (dead || document.visibilityState !== 'visible') return
        lightsTimer = window.setTimeout(lightNow, LIGHTS_MS)
      })
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') return lightUp()
      window.clearTimeout(lightsTimer)
      cancelAnimationFrame(lightsFrame)
      lightsFrame = lightsTimer = 0
    }
    fetch(`${FILM_BASE}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : FALLBACK))
      .catch(() => FALLBACK)
      .then((m) => {
        if (dead) return
        manReady = true
        man = { ...FALLBACK, ...m, desktop: { ...FALLBACK.desktop, ...m.desktop }, phone: { ...FALLBACK.phone, ...m.phone } }
        measure()
        // The frames (several megabytes) wait until the page itself has loaded, so
        // the headline, the fonts and the first picture of the room come first.
        if (document.readyState === 'complete') load(kind)
        else window.addEventListener('load', onPageLoad, { once: true })
      })

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting)
      if (inView) lightUp()
      steer()
    })
    io.observe(stage)
    // The stage's own size, not the page's: pictures loading further down never re-measure the film.
    const ro = new ResizeObserver(() => measure())
    ro.observe(stage)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onJump, true)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('resize', measure)
    document.addEventListener('visibilitychange', steer)
    document.addEventListener('visibilitychange', onVisible)
    portrait.addEventListener('change', onOrient)
    reduce.addEventListener('change', onMotion)
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      window.clearTimeout(lightsTimer)
      release()
      window.removeEventListener('load', onPageLoad)
      loop?.stop()
      steam.stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onJump, true)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', steer)
      document.removeEventListener('visibilitychange', onVisible)
      portrait.removeEventListener('change', onOrient)
      reduce.removeEventListener('change', onMotion)
    }
  }, [])

  return (
    <section ref={sectionRef} className="kf" aria-label="Farzana Classroom on a laptop">
      <p className="sr-only">
        A short film: a laptop on a desk opens on Farzana Classroom, and a cursor clicks through it on a loop: Home, a class,
        the students and Analytics.
      </p>
      <div ref={stageRef} className="kf-stage">
        <div className="kf-scene" aria-hidden="true">
        <picture ref={posterRef} className="kf-poster">
          <source media="(orientation: portrait)" srcSet={`${FILM_BASE}/phone/0001.jpg`} />
          <img src={`${FILM_BASE}/desktop/0001.jpg`} alt="" fetchPriority="high" />
        </picture>
        <canvas ref={canvasRef} className="kf-canvas" />
        <canvas ref={steamRef} className="kf-steam" />
        <div ref={liveRef} className="kf-live">
          <div className="kf-shots">
            {(Object.keys(SHOTS) as Screen[]).map((k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={k} data-screen={k} src={SHOTS[k]} alt="" width={SHOT_W} height={APP_H} decoding="async" className={k === 'home' ? 'is-on' : undefined} />
            ))}
          </div>
          <div className="kf-hover" />
          <div className="kf-sel" />
          <div className="kf-ring" />
          <div className="kf-ripple" />
          <div className="kf-cursor">
            <div className="kf-arrow">
              <svg viewBox="0 0 28 28" width="60" height="60" aria-hidden="true">
                <path
                  d="M8.2 4.9v16.4l4-3.9 2.6 6.1 3.1-1.3-2.6-6h5.7z"
                  fill="#000"
                  stroke="#fff"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="kf-glass" />
          <div className="kf-dim" />
        </div>
        {/* The top of the room in shadow until the lid opens; the room dark until the light comes up. */}
        <div className="kf-shade" />
        <div className="kf-dark" />
        <noscript dangerouslySetInnerHTML={{ __html: '<style>.kf-dark{display:none}</style>' }} />
        </div>
      </div>
    </section>
  )
}
