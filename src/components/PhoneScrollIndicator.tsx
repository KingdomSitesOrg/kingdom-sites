'use client'

import { useEffect, useRef } from 'react'

/**
 * A slim marker on the right edge of touch screens that shows where the page is.
 * iOS Safari shows its own bar only while scrolling and no page can force it, so
 * this stands in for it (T-376). It fades in while the page moves, goes after a
 * moment still, and never takes a tap (pointer-events none). The CSS shows it on
 * touch devices only; desktop keeps the browser's own bar, styled in globals.css.
 */
export default function PhoneScrollIndicator() {
  const bar = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const b = bar.current
    const t = thumb.current
    if (!b || !t) return
    let frame = 0
    let hide = 0

    const update = () => {
      frame = 0
      const view = window.innerHeight
      const total = document.documentElement.scrollHeight
      const max = total - view
      // Nothing to scroll: no marker at all.
      if (max <= 0) {
        b.style.display = 'none'
        return
      }
      b.style.display = ''
      // The marker is the full height of the screen, so the screen height is its track.
      const size = Math.max(40, (view * view) / total)
      const top = (window.scrollY / max) * (view - size)
      t.style.height = `${size}px`
      t.style.transform = `translateY(${top}px)`
    }

    const onMove = () => {
      if (!frame) frame = requestAnimationFrame(update)
      b.classList.add('is-on')
      window.clearTimeout(hide)
      hide = window.setTimeout(() => b.classList.remove('is-on'), 900)
    }

    update()
    window.addEventListener('scroll', onMove, { passive: true })
    window.addEventListener('resize', onMove)
    // Pages grow and shrink as they load and as the menus open: keep the marker true to them.
    const resize = new ResizeObserver(() => update())
    resize.observe(document.body)
    return () => {
      window.removeEventListener('scroll', onMove)
      window.removeEventListener('resize', onMove)
      resize.disconnect()
      cancelAnimationFrame(frame)
      window.clearTimeout(hide)
    }
  }, [])

  return (
    <div ref={bar} className="scroll-marker" aria-hidden="true">
      <div ref={thumb} className="scroll-marker-thumb" />
    </div>
  )
}
