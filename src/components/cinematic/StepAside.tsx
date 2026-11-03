'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/* While this section is on screen, the floating Intelligence card fades out,
   so it never covers what the section asks people to read or fill in. */
export default function StepAside({ children, className, id, label }: { children: ReactNode; className?: string; id?: string; label?: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) root.dataset.kfAside = ''
      else delete root.dataset.kfAside
    })
    io.observe(el)
    return () => {
      io.disconnect()
      delete root.dataset.kfAside
    }
  }, [])
  return (
    <section ref={ref} id={id} aria-label={label} className={className}>
      {children}
    </section>
  )
}
