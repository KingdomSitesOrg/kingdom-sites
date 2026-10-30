'use client'

import { useEffect } from 'react'

/**
 * Fetches the page's lazy phone screenshots (`img[data-warm]`) ahead of time:
 * each one as soon as it is within two screens of view, and all of them once
 * the page has finished loading and the browser is idle, so the first screen
 * is never kept waiting and nothing further down arrives late.
 */
export default function WarmImages() {
  useEffect(() => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>('img[data-warm]')]
    if (!imgs.length) return
    const warm = (img: HTMLImageElement) => {
      if (img.loading !== 'eager') img.loading = 'eager'
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          warm(e.target as HTMLImageElement)
          io.unobserve(e.target)
        }
      },
      { rootMargin: '200% 0px' },
    )
    imgs.forEach((img) => io.observe(img))

    let timer = 0
    let idle = 0
    const all = () => imgs.forEach(warm)
    const later = () => {
      // Safari has no requestIdleCallback: a short pause after load does the same job.
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(all, { timeout: 2500 })
      else timer = window.setTimeout(all, 800)
    }
    if (document.readyState === 'complete') later()
    else window.addEventListener('load', later, { once: true })
    return () => {
      io.disconnect()
      window.removeEventListener('load', later)
      window.clearTimeout(timer)
      if (idle) window.cancelIdleCallback(idle)
    }
  }, [])
  return null
}
