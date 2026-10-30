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
 * One passive scroll listener and one frame per change; nothing runs while the
 * page is still.
 */
export default function Scroll({
  mode = 'through',
  steps,
  className,
  children,
  ...rest
}: {
  mode?: 'through' | 'sticky'
  steps?: number
  className?: string
  children: React.ReactNode
} & React.AriaAttributes & { id?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const raw = mode === 'sticky' ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (r.height + vh)
      const p = Math.min(1, Math.max(0, raw))
      el.style.setProperty('--p', p.toFixed(4))
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
  }, [mode, steps])

  return (
    <div ref={ref} className={className} data-step={steps ? 0 : undefined} {...rest}>
      {children}
    </div>
  )
}
