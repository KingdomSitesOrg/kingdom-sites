'use client'

import { useEffect, useRef } from 'react'

/**
 * Feeds how far a section has scrolled into CSS, as `--p` (0 to 1), so the
 * motion itself lives in the stylesheet and runs on the compositor.
 *
 * - `through`: 0 when the section's top meets the bottom of the screen,
 *   1 when its bottom leaves the top. For things that drift as they pass.
 * - `sticky`: 0 when the section's top reaches the top of the screen, 1 when
 *   its bottom reaches the bottom. For a pinned stage inside a tall section;
 *   it also sets `data-step` (0 to steps - 1) for chaptered scenes.
 *
 * `prop` names the CSS variable (default `--p`), so a section can carry a
 * second, nested progress without hiding its parent's.
 *
 * It also sets `data-in` once the section's top is a little way into the
 * screen, and never takes it off: `.cn-reveal` rises in on that, as one smooth
 * transition the browser runs by itself, instead of following every scroll
 * frame. Pictures inside are fetched and decoded a couple of screens ahead, so
 * none is unpacked just as it arrives.
 *
 * - `reveal`: only that. No progress and no scroll listener at all: the browser
 *   says when it comes near and into view, and then it is done. For a section
 *   that only rises in, so scrolling does no work for it.
 *
 * One passive scroll listener and one frame per change; nothing runs while the
 * page is still.
 */
export default function Scroll({
  mode = 'through',
  prop = '--p',
  steps,
  className,
  children,
  ...rest
}: {
  mode?: 'through' | 'sticky' | 'reveal'
  prop?: `--${string}`
  steps?: number
  className?: string
  children: React.ReactNode
} & React.AriaAttributes & { id?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (mode === 'reveal') {
      const warm = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          for (const img of el.querySelectorAll('img')) {
            img.loading = 'eager'
            img.decode().catch(() => {})
          }
          warm.disconnect()
        },
        { rootMargin: '300% 0px' },
      )
      const show = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          el.dataset.in = ''
          show.disconnect()
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      warm.observe(el)
      show.observe(el)
      return () => {
        warm.disconnect()
        show.disconnect()
      }
    }
    let frame = 0
    let warmed = false
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      if (!warmed && r.top < vh * 3) {
        warmed = true
        for (const img of el.querySelectorAll('img')) {
          img.loading = 'eager'
          img.decode().catch(() => {})
        }
      }
      if (r.top < vh * 0.92 && r.bottom > 0 && !('in' in el.dataset)) el.dataset.in = ''
      const raw = mode === 'sticky' ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (r.height + vh)
      const p = Math.min(1, Math.max(0, raw))
      el.style.setProperty(prop, p.toFixed(4))
      if (steps) el.dataset.step = String(Math.min(steps - 1, Math.floor(p * steps)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [mode, prop, steps])

  return (
    <div ref={ref} className={className} data-step={steps ? 0 : undefined} {...rest}>
      {children}
    </div>
  )
}
