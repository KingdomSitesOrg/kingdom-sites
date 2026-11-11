'use client'

import { useEffect } from 'react'
import { play } from '../_lib/sound'

/* The little tile creature beside Thomas's name hops along the label under it
   (Thomas, 2026-11-11): when the section scrolls into view it jumps from word
   to word, "Engineering:", "design,", "build,", "ship,", "maintain", and each
   word it lands on turns to mural tiles for a moment, then back to plain text.
   Then it hops home. It plays once each time the section comes into view.

   This component draws nothing itself. It finds the creature (Strays.tsx) and
   the label's words (marked data-hop in page.tsx) inside the same heading. */

const TILE = 7 // one tile of a tiled word, with its gap, in CSS pixels
const TONES = ['#F2581C', '#2A5CFF', '#14161D', '#A9ACB1', '#14161D', '#C3C4C5']

const HOP_MS = 430
const REST_MS = 300

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

    /** One jump from where it stands (x0, y0) to (x1, y1), as offsets from its own place on the page. */
    async function hop(x0: number, y0: number, x1: number, y1: number) {
      const peak = Math.min(y0, y1) - 26
      const at = (x: number, y: number, squash = 1) => `translate(${x}px, ${y}px) scale(${2 - squash}, ${squash})`
      current = gem!.animate(
        [
          { transform: at(x0, y0, 0.86), easing: 'cubic-bezier(.2,.7,.4,1)' },
          { transform: at((x0 + x1) / 2, peak, 1.06), offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.3)' },
          { transform: at(x1, y1), offset: 0.88 },
          { transform: at(x1, y1 + 2, 0.84), offset: 0.94 },
          { transform: at(x1, y1) },
        ],
        { duration: HOP_MS, fill: 'forwards' },
      )
      await current.finished.catch(() => {})
    }

    async function run() {
      if (running) return
      running = true
      // Let the creature finish popping into shape first.
      await wait(900)
      // Where it stands on the page, with nothing moving it.
      current?.cancel()
      const home = gem!.getBoundingClientRect()
      let x = 0
      let y = 0
      for (const word of words) {
        if (cancelled) break
        const box = word.getBoundingClientRect()
        // Its feet on the word's top edge, its middle over the word's middle, and never off the side of the screen.
        const wanted = box.left + box.width / 2 - (home.left + home.width / 2)
        const nx = Math.max(8 - home.left, Math.min(window.innerWidth - 8 - home.right, wanted))
        const ny = box.top - 3 - home.bottom
        await hop(x, y, nx, ny)
        x = nx
        y = ny
        if (cancelled) break
        tile(word)
        play('tick')
        await wait(REST_MS)
      }
      if (!cancelled) await hop(x, y, 0, 0)
      current?.cancel()
      current = null
      running = false
    }

    // Each time the label comes into view (not while a round is still going).
    const seen = new IntersectionObserver(([entry]) => entry.isIntersecting && run(), { threshold: 0.9 })
    seen.observe(words[0].parentElement ?? words[0])

    return () => {
      cancelled = true
      seen.disconnect()
      timers.forEach((t) => window.clearTimeout(t))
      current?.cancel()
    }
  }, [])

  return null
}
