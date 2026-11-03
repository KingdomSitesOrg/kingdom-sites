'use client'

import { useEffect, useRef, useState } from 'react'
import './film.css'

/**
 * The home page film: a laptop opens, Farzana Classroom comes up on it, the
 * camera goes all the way into the screen, and the app on it turns into the
 * real thing you can click. Scroll drives it, the way Apple's product pages do.
 *
 * The film is a sequence of still frames (one set for wide screens, one for
 * phones held upright) drawn on a canvas as the page scrolls. The manifest
 * beside the frames says how many there are and where the laptop's display
 * sits in the last one, so the live app can take its place without a visible cut.
 *
 * Switch to the finished frames by changing FILM_BASE to '/film'.
 */
export const FILM_BASE = '/film-dev'

type Kind = 'desktop' | 'phone'
type Rect = { x: number; y: number; w: number; h: number }
type FilmSet = { w: number; h: number; dir: string; screen: Rect }
type Manifest = { frames: number; ext: string; desktop: FilmSet; phone: FilmSet }

/* Used until the manifest arrives, and if it cannot be read. */
const FALLBACK: Manifest = {
  frames: 120,
  ext: 'jpg',
  desktop: { w: 1600, h: 1000, dir: 'desktop', screen: { x: 0, y: 0, w: 1600, h: 1000 } },
  phone: { w: 720, h: 1280, dir: 'phone', screen: { x: 0, y: 415, w: 720, h: 450 } },
}

/* Where the scroll goes, as a share of the pinned stretch: the frames play,
   then the live app fades in over the laptop's display, then it settles to
   fill the stage, then it holds still for a moment so it can be used. */
const PLAY_END = 0.78
const FADE_END = 0.84
const SETTLE_END = 0.92

/* The app's screenshots: 1800 x 1095, the app's own beta strip cropped off. */
const APP_W = 1800
const APP_H = 1095
const APP_AR = APP_W / APP_H

type Screen = 'home' | 'classes' | 'students' | 'analytics'
const SHOTS: Record<Screen, { src: string; alt: string }> = {
  home: { src: '/work/app/home.webp', alt: 'Farzana Classroom, a school’s Home: 1,022 students, 194 active this week, and its classes' },
  classes: { src: '/work/app/class-admin.webp', alt: 'Farzana Classroom, a class page: Sample Class, with its picture of Rome and its description' },
  students: { src: '/work/app/students.webp', alt: 'Farzana Classroom, the school’s students, with search and filters' },
  analytics: { src: '/work/app/analytics.webp', alt: 'Farzana Classroom, Analytics: 1,022 students, 194 active this week, and the newest students' },
}

/* Clickable places, measured on the screenshots in their own pixels. */
const SIDEBAR: { to: Screen; label: string; y: number }[] = [
  { to: 'home', label: 'Home', y: 181 },
  { to: 'classes', label: 'Classes', y: 236 },
  { to: 'students', label: 'Your students', y: 346 },
  { to: 'analytics', label: 'Analytics', y: 566 },
]
const ITEM = { x: 16, w: 266, h: 52 }
const LINKS: Partial<Record<Screen, { to: Screen; label: string; x: number; y: number; w: number; h: number }[]>> = {
  home: [{ to: 'classes', label: 'Open Sample Class', x: 361, y: 388, w: 908, h: 622 }],
  analytics: [{ to: 'students', label: 'View all students', x: 391, y: 851, w: 247, h: 55 }],
}

const at = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  left: `${(x / APP_W) * 100}%`,
  top: `${(y / APP_H) * 100}%`,
  width: `${(w / APP_W) * 100}%`,
  height: `${(h / APP_H) * 100}%`,
})

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => t * t * (3 - 2 * t)
const frameUrl = (m: Manifest, kind: Kind, i: number) => {
  const dir = m[kind].dir
  const base = dir.startsWith('/') ? dir : `${FILM_BASE}/${dir}`
  return `${base}/${String(i + 1).padStart(4, '0')}.${m.ext}`
}

/** The live app: real screenshots, with the sidebar and a few things on them that answer a click. */
function AppScreen({ live, still }: { live: boolean; still: boolean }) {
  const [screen, setScreen] = useState<Screen>('home')
  const tab = live ? 0 : -1
  // On a phone the laptop's Home only bridges to the phone layout: no clickable places.
  if (still) {
    return (
      <div className="kf-screen" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="kf-still" src={SHOTS.home.src} alt="" width={APP_W} height={APP_H} decoding="async" />
      </div>
    )
  }
  return (
    <div className="kf-screen">
      <div className="kf-shots">
        {(Object.keys(SHOTS) as Screen[]).map((k) => (
          // Plain images: all four sit stacked and cross-fade, already sized for the screen.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={k}
            src={SHOTS[k].src}
            alt={k === screen ? SHOTS[k].alt : ''}
            aria-hidden={k === screen ? undefined : true}
            width={APP_W}
            height={APP_H}
            decoding="async"
            className={k === screen ? 'is-on' : undefined}
          />
        ))}
      </div>
      <nav aria-label="Farzana Classroom">
        {SIDEBAR.map((s) => (
          <button
            key={s.to}
            type="button"
            tabIndex={tab}
            className="kf-hot"
            style={at(ITEM.x, s.y, ITEM.w, ITEM.h)}
            aria-current={s.to === screen ? 'page' : undefined}
            onClick={() => setScreen(s.to)}
          >
            <span className="sr-only">{s.label}</span>
          </button>
        ))}
      </nav>
      {(LINKS[screen] ?? []).map((l) => (
        <button
          key={`${screen}-${l.label}`}
          type="button"
          tabIndex={tab}
          className="kf-hot kf-card"
          style={at(l.x, l.y, l.w, l.h)}
          onClick={() => setScreen(l.to)}
        >
          <span className="sr-only">{l.label}</span>
        </button>
      ))}
    </div>
  )
}

/* The app's phone layout: 780 x 1522 screens and their 780 x 118 tab bar,
   both cut from the same captures, the beta strip cropped off. */
const PH_W = 780
const PH_H = 1522
const TAB_H = 118
const PHONE: Record<Screen, { src: string; tabs: string; alt: string }> = {
  home: { src: '/work/app/home-phone.webp', tabs: '/work/app/home-phone-tabs.webp', alt: 'Farzana Classroom on a phone: a school’s Home, 1,022 students, 194 active this week, and its classes' },
  classes: { src: '/work/app/class-admin-phone.webp', tabs: '/work/app/class-admin-phone-tabs.webp', alt: 'Farzana Classroom on a phone: Sample Class, with its picture of Rome and its description' },
  students: { src: '/work/app/students-phone.webp', tabs: '/work/app/students-phone-tabs.webp', alt: 'Farzana Classroom on a phone: the school’s students, with search and filters' },
  analytics: { src: '/work/app/analytics-phone.webp', tabs: '/work/app/analytics-phone-tabs.webp', alt: 'Farzana Classroom on a phone: Analytics, 1,022 students and 194 active this week' },
}
/* The app's own tab bar. There is no capture of Pricing, so its tab opens Analytics, and says so. */
const TABS: { to: Screen; label: string }[] = [
  { to: 'home', label: 'Home' },
  { to: 'classes', label: 'Classes' },
  { to: 'students', label: 'Students' },
  { to: 'analytics', label: 'Pricing (shows the Analytics screen here)' },
]
const PH_LINKS: Partial<Record<Screen, { to: Screen; label: string; x: number; y: number; w: number; h: number }[]>> = {
  home: [
    { to: 'classes', label: 'All classes', x: 480, y: 1176, w: 245, h: 96 },
    { to: 'classes', label: 'Open Sample Class', x: 50, y: 1304, w: 680, h: 218 },
  ],
}
const pct = (x: number, y: number, w: number, h: number, W: number, H: number): React.CSSProperties => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
  width: `${(w / W) * 100}%`,
  height: `${(h / H) * 100}%`,
})

/** The live app as it is on a phone: the screen above, the app's own tab bar pinned below. */
function PhoneApp({ live }: { live: boolean }) {
  const [screen, setScreen] = useState<Screen>('home')
  const tab = live ? 0 : -1
  const keys = Object.keys(PHONE) as Screen[]
  return (
    <>
      <div className="kf-ph-body">
        <div className="kf-shots">
          {keys.map((k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={k}
              src={PHONE[k].src}
              alt={k === screen ? PHONE[k].alt : ''}
              aria-hidden={k === screen ? undefined : true}
              width={PH_W}
              height={PH_H}
              decoding="async"
              className={k === screen ? 'is-on' : undefined}
            />
          ))}
          {(PH_LINKS[screen] ?? []).map((l) => (
            <button
              key={`${screen}-${l.label}`}
              type="button"
              tabIndex={tab}
              className="kf-hot kf-card"
              style={pct(l.x, l.y, l.w, l.h, PH_W, PH_H)}
              onClick={() => setScreen(l.to)}
            >
              <span className="sr-only">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
      <nav className="kf-ph-tabs" aria-label="Farzana Classroom">
        <div className="kf-shots">
          {keys.map((k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={PHONE[k].tabs} alt="" aria-hidden="true" width={PH_W} height={TAB_H} decoding="async" className={k === screen ? 'is-on' : undefined} />
          ))}
          {TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              tabIndex={tab}
              className="kf-hot kf-tab"
              style={pct(12 + 195 * i, 10, 172, 100, PH_W, TAB_H)}
              aria-current={t.to === screen ? 'page' : undefined}
              onClick={() => setScreen(t.to)}
            >
              <span className="sr-only">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}

export default function LaptopFilm() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLPictureElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [phone, setPhone] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const app = appRef.current
    const inner = screenRef.current
    const poster = posterRef.current
    const phoneLayer = phoneRef.current
    const ctx = canvas?.getContext('2d')
    if (!section || !stage || !canvas || !app || !inner || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const portrait = window.matchMedia('(orientation: portrait)')
    let man = FALLBACK
    let kind: Kind = portrait.matches ? 'phone' : 'desktop'
    const imgs: Record<Kind, (HTMLImageElement | null)[]> = { desktop: [], phone: [] }
    const ready: Record<Kind, boolean[]> = { desktop: [], phone: [] }
    const started: Record<Kind, boolean> = { desktop: false, phone: false }

    // Measured on resize only, so the scroll loop never reads layout.
    let top = 0
    let pinTop = 0
    let range = 1
    let W = 0
    let H = 0
    let dpr = 1
    let drawn = -1
    let drawnKind: Kind | '' = ''
    let lastBox = ''
    let lastFade = -1
    let lastFilm = -1
    let lastPhone = -1
    let isLive = false
    let raf = 0
    let dead = false

    // Frames load in order, a few at a time; the last frame first if motion is off.
    const load = (k: Kind) => {
      if (started[k]) return
      started[k] = true
      const n = man.frames
      imgs[k] = new Array(n).fill(null)
      ready[k] = new Array(n).fill(false)
      const order = reduce.matches ? [n - 1] : Array.from({ length: n }, (_, i) => i)
      let next = 0
      const pump = () => {
        if (dead || next >= order.length) return
        const i = order[next++]
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          ready[k][i] = true
          schedule()
          pump()
        }
        img.onerror = () => pump()
        img.src = frameUrl(man, k, i)
        imgs[k][i] = img
      }
      for (let c = 0; c < 4; c++) pump()
    }

    const measure = () => {
      const r = section.getBoundingClientRect()
      top = r.top + window.scrollY
      pinTop = parseFloat(getComputedStyle(stage).top) || 0
      W = stage.clientWidth
      H = stage.clientHeight
      range = Math.max(1, section.offsetHeight - H)
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      drawn = -1
      lastBox = ''
      schedule()
    }

    const tick = () => {
      raf = 0
      const p = reduce.matches ? 1 : clamp((window.scrollY - (top - pinTop)) / range)
      const set = man[kind]
      const n = man.frames

      // The frame for this point of the scroll, or the nearest one that has arrived.
      const want = Math.round(clamp(p / PLAY_END) * (n - 1))
      let idx = -1
      for (let d = 0; d < n && idx < 0; d++) {
        if (ready[kind][want - d]) idx = want - d
        else if (ready[kind][want + d]) idx = want + d
      }
      if (idx >= 0 && (idx !== drawn || kind !== drawnKind)) {
        const img = imgs[kind][idx]!
        const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
        const dw = img.naturalWidth * s
        const dh = img.naturalHeight * s
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
        // The canvas has a frame now; the poster underneath is no longer needed.
        if (drawn < 0 && poster) poster.style.visibility = 'hidden'
        drawn = idx
        drawnKind = kind
      }

      // The laptop's display, through the same cover-fit as the frame.
      const s = Math.max(W / set.w, H / set.h)
      const ox = (W - set.w * s) / 2
      const oy = (H - set.h * s) / 2
      const from = { x: ox + set.screen.x * s, y: oy + set.screen.y * s, w: set.screen.w * s, h: set.screen.h * s }
      // Where it settles. On a computer: the app across the whole width, as tall
      // as the stage allows. On a phone: the whole stage, where it becomes the
      // app's own phone layout.
      const onPhone = kind === 'phone'
      const th = Math.min(H, W / APP_AR)
      const to = onPhone ? { x: 0, y: 0, w: W, h: H } : { x: 0, y: (H - th) / 2, w: W, h: th }
      const t = ease(clamp((p - FADE_END) / (SETTLE_END - FADE_END)))
      const bx = from.x + (to.x - from.x) * t
      const by = from.y + (to.y - from.y) * t
      const bw = from.w + (to.w - from.w) * t
      const bh = from.h + (to.h - from.h) * t
      const box = `${bx.toFixed(1)},${by.toFixed(1)},${bw.toFixed(1)},${bh.toFixed(1)}`
      if (box !== lastBox) {
        lastBox = box
        app.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`
        app.style.width = `${bw.toFixed(1)}px`
        app.style.height = `${bh.toFixed(1)}px`
        // The screenshot covers the box from its top left corner.
        inner.style.width = `${Math.max(bw, bh * APP_AR).toFixed(1)}px`
      }
      // The film steps back as the app settles, so only the app is left.
      const filmOpacity = drawn < 0 ? 0 : 1 - t
      if (filmOpacity !== lastFilm) {
        lastFilm = filmOpacity
        canvas.style.opacity = filmOpacity.toFixed(3)
      }
      // On a phone the laptop's screen turns into the phone layout as it grows.
      const phoneOpacity = onPhone ? t : 0
      if (phoneLayer && phoneOpacity !== lastPhone) {
        lastPhone = phoneOpacity
        phoneLayer.style.opacity = phoneOpacity.toFixed(3)
      }
      const fade = clamp((p - PLAY_END) / (FADE_END - PLAY_END))
      if (fade !== lastFade) {
        lastFade = fade
        app.style.opacity = fade.toFixed(3)
      }
      // Clickable once it is mostly there: on a phone, once it is mostly the phone layout.
      const nowLive = onPhone ? fade > 0.5 && t > 0.5 : fade > 0.5
      if (nowLive !== isLive) {
        isLive = nowLive
        app.classList.toggle('is-live', nowLive)
        setLive(nowLive)
      }
    }

    function schedule() {
      if (!raf && !dead) raf = requestAnimationFrame(tick)
    }

    const onOrient = () => {
      kind = portrait.matches ? 'phone' : 'desktop'
      setPhone(kind === 'phone')
      load(kind)
      drawn = -1
      measure()
    }
    const onMotion = () => {
      // Turning motion off or on changes the page's height and what loads first.
      started.desktop = started.phone = false
      load(kind)
      measure()
    }

    setPhone(kind === 'phone')
    measure()
    fetch(`${FILM_BASE}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : FALLBACK))
      .catch(() => FALLBACK)
      .then((m) => {
        if (dead) return
        man = m
        load(kind)
        schedule()
      })

    const ro = new ResizeObserver(() => measure())
    ro.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    portrait.addEventListener('change', onOrient)
    reduce.addEventListener('change', onMotion)
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
      portrait.removeEventListener('change', onOrient)
      reduce.removeEventListener('change', onMotion)
    }
  }, [])

  return (
    <section ref={sectionRef} className="kf" aria-label="Farzana Classroom, opened on a laptop">
      <div ref={stageRef} className="kf-stage">
        <picture ref={posterRef} className="kf-poster">
          <source media="(orientation: portrait)" srcSet={`${FILM_BASE}/phone/0001.jpg`} />
          <img src={`${FILM_BASE}/desktop/0001.jpg`} alt="" fetchPriority="high" />
        </picture>
        <canvas ref={canvasRef} className="kf-canvas" aria-hidden="true" />
        <div ref={appRef} className="kf-app">
          <div ref={screenRef}>
            <AppScreen live={live && !phone} still={phone} />
          </div>
          <div ref={phoneRef} className="kf-phone">
            {phone ? <PhoneApp live={live} /> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
