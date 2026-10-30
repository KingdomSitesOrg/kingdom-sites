'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/* The home hero as a carousel. Only the words and the screens change; every
   slide sits in the same grid cell, so the hero is always as tall as its
   tallest slide and nothing around it moves when a slide changes. */

export type HeroSlide = { label: string; text: ReactNode; visual: ReactNode }

const ADVANCE_MS = 3000
const SWIPE_PX = 40

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [view, setView] = useState({ index: 0, prev: -1, dir: 1 })
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const go = (to: number, dir: number) =>
    setView((v) => {
      const index = (to + slides.length) % slides.length
      return index === v.index ? v : { index, prev: v.index, dir }
    })
  const step = (dir: number) => go(view.index + dir, dir)

  // Reduced motion: stay on the first slide (the dots still work).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const paused = hovered || focused || reduced
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => go(view.index + 1, 1), ADVANCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.index, paused])

  // Where a slide rests: the one leaving slides out the way the carousel is
  // moving, the rest wait on the side the next one comes in from.
  const place = (i: number) => {
    if (i === view.index) return 'translate-x-0 opacity-100'
    const ahead = i === view.prev ? -view.dir : view.dir
    return `pointer-events-none opacity-0 ${ahead > 0 ? 'translate-x-8' : '-translate-x-8'}`
  }
  const cell =
    'col-start-1 row-start-1 transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none'

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured apps"
      className="hero-wash px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1)
        else if (e.key === 'ArrowLeft') step(-1)
      }}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }}
      onTouchEnd={(e) => {
        const start = touch.current
        touch.current = null
        if (!start) return
        const dx = e.changedTouches[0].clientX - start.x
        const dy = e.changedTouches[0].clientY - start.y
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1)
      }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
        <div className="text-center lg:text-left">
          <div className="grid" aria-live={paused ? 'polite' : 'off'}>
            {slides.map((slide, i) => (
              <div
                key={slide.label}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}: ${slide.label}`}
                aria-hidden={i !== view.index}
                inert={i !== view.index}
                className={`${cell} ${place(i)}`}
              >
                {slide.text}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-center lg:justify-start">
            {slides.map((slide, i) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => go(i, i > view.index ? 1 : -1)}
                aria-label={`Show ${slide.label}`}
                aria-current={i === view.index}
                className="group flex h-11 w-9 items-center justify-center lg:justify-start"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    i === view.index ? 'w-5 bg-accent' : 'w-2 bg-ink/20 group-hover:bg-ink/40'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-center">
          {slides.map((slide, i) => (
            <div
              key={slide.label}
              aria-hidden={i !== view.index}
              inert={i !== view.index}
              className={`${cell} ${place(i)}`}
            >
              {slide.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
