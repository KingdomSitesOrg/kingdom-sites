'use client'

import { useEffect } from 'react'
import { play } from '../_lib/sound'

/* The little tile creature beside Thomas's name hops along the label under it
   (Thomas, 2026-11-11): when the section scrolls into view it jumps from word
   to word, "Engineering:", "design,", "build,", "ship,", "maintain", and each
   word it lands on turns to mural tiles for a moment, then back to plain text.
   It starts at the left, above the first word, and ends at the right, where it
   stays sitting on "maintain". It plays once, the first time the label is seen.

   This component draws nothing itself. It finds the creature (Strays.tsx) and
   the label's words (marked data-hop in page.tsx) inside the same heading. */

const TILE = 7 // one tile of a tiled word, with its gap, in CSS pixels
const TONES = ['#F2581C', '#2A5CFF', '#14161D', '#A9ACB1', '#14161D', '#C3C4C5']

const HOP_MS = 300
const REST_MS = 90

/** Covers a word in tiles for a moment. The word's own text is hidden while they are down. */
function tile(word: HTMLElement) {
  const w = word.offsetWidth
  const h = word.offsetHeight
  const cols = Math.max(2, Math.ceil(w / TILE))
  const rows = Math.max(2, Math.round(h / TILE))
  const patch = document.createElement('span')
  patch.className = 'mu-word-tiles'
  patch.setAttribute('aria-hidden', 'true')
  patch.style.gridTemplateColumns = `repeat(${cols}, ${TILE - 1}px)`
  // Centred on the word, a tile's breadth over each edge.
  patch.style.left = `${Math.round((w - cols * TILE + 1) / 2)}px`
  patch.style.top = `${Math.round((h - rows * TILE + 1) / 2)}px`
  for (let i = 0; i < cols * rows; i++) {
    const bit = document.createElement('i')
    bit.style.background = TONES[Math.floor(Math.random() * TONES.length)]
    // They land from the middle outward, as if pressed down by the creature's feet.
    const far = Math.abs((i % cols) - (cols - 1) / 2) / cols
    bit.style.animationDelay = `${Math.round(far * 150 + Math.random() * 50)}ms`
    patch.appendChild(bit)
  }
  word.appendChild(patch)
  word.classList.add('is-tiled')
  window.setTimeout(() => word.classList.remove('is-tiled'), 520)
  window.setTimeout(() => patch.remove(), 900)
}

export default function GemHop() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const gem = document.querySelector<HTMLElement>('.mu-strays.is-gem')
    const head = gem?.closest('.mu-head')
    const words = head ? [...head.querySelectorAll<HTMLElement>('[data-hop]')] : []
    if (!gem || !head || !words.length) return

    let running = false
    let cancelled = false
    let current: Animation | null = null
    const timers: number[] = []
    const wait = (ms: number) => new Promise<void>((done) => timers.push(window.setTimeout(done, ms)))

    // Where it has come to rest, as an offset from its own place on the page.
    let x = 0
    let y = 0
    let done = false

    const at = (px: number, py: number, squash = 1) => `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) scale(${(1 + (1 - squash) * 0.7).toFixed(3)}, ${squash})`

    /** One jump from (x0, y0) to (x1, y1): a crouch, a thrown arc, a landing that squashes and springs back. */
    async function hop(x0: number, y0: number, x1: number, y1: number) {
      // The further the jump, the higher it goes.
      const lift = 16 + Math.min(26, Math.hypot(x1 - x0, y1 - y0) * 0.22)
      const frames: Keyframe[] = [{ transform: at(x0, y0) }, { transform: at(x0, y0 + 1, 0.8), offset: 0.1 }]
      // In the air it follows a thrown ball's path: even sideways, fast then slow then fast up and down.
      for (let k = 0; k <= 8; k++) {
        const t = k / 8
        const arc = 4 * t * (1 - t)
        const stretch = 1 + 0.1 * Math.abs(1 - 2 * t)
        frames.push({ transform: at(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - lift * arc, stretch), offset: 0.1 + t * 0.6 })
      }
      // The landing: down into its feet, a small spring up, and still.
      frames.push({ transform: at(x1, y1 + 1, 0.74), offset: 0.78 }, { transform: at(x1, y1 - 3, 1.06), offset: 0.88 }, { transform: at(x1, y1 + 0.5, 0.95), offset: 0.95 }, { transform: at(x1, y1) })
      current = gem!.animate(frames, { duration: HOP_MS, fill: 'forwards', easing: 'linear' })
      await current.finished.catch(() => {})
    }

    /** Where its feet go for a word, given where the creature's own place on the page is right now. */
    function spot(word: HTMLElement, home: DOMRect): [number, number] {
      const box = word.getBoundingClientRect()
      // Its middle over the word's middle, and never off the side of the screen.
      const wanted = box.left + box.width / 2 - (home.left + home.width / 2)
      return [Math.max(8 - home.left, Math.min(window.innerWidth - 8 - home.right, wanted)), box.top - 3 - home.bottom]
    }

    /** Its own place on the page at this instant: where it is drawn, less how far it has hopped. Only right while it is at rest. */
    const homeBox = () => {
      const now = gem!.getBoundingClientRect()
      return new DOMRect(now.left - x, now.top - y, now.width, now.height)
    }

    async function run() {
      if (running || done) return
      running = true
      // Let the creature finish popping into shape first.
      await wait(450)
      for (const word of words) {
        if (cancelled) break
        // Measured afresh for every jump: the visitor is usually still scrolling, and a place
        // measured before the scroll would send it far too high or too low.
        const [nx, ny] = spot(word, homeBox())
        await hop(x, y, nx, ny)
        x = nx
        y = ny
        if (cancelled) break
        tile(word)
        play('tick')
        await wait(REST_MS)
      }
      // It stays where it landed: sitting on the last word.
      done = !cancelled
      running = false
    }

    // If the page is resized after it has sat down, it is put back on its word.
    const onResize = () => {
      if (!done) return
      const [nx, ny] = spot(words[words.length - 1], homeBox())
      x = nx
      y = ny
      current?.cancel()
      current = gem.animate([{ transform: at(x, y) }, { transform: at(x, y) }], { duration: 1, fill: 'forwards' })
    }
    window.addEventListener('resize', onResize)

    // The first time the label comes into view.
    const seen = new IntersectionObserver(([entry]) => entry.isIntersecting && run(), { threshold: 0.9 })
    seen.observe(words[0].parentElement ?? words[0])

    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      seen.disconnect()
      timers.forEach((t) => window.clearTimeout(t))
      current?.cancel()
    }
  }, [])

  return null
}
