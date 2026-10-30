'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * A pill link that lights up while it crosses the middle of the screen: the
 * outline and text brighten and the label goes bold, then it eases back as
 * the page scrolls on. The label's bold width is reserved in CSS so nothing
 * moves when it lights; people who ask for less motion get the brighten only.
 */
export default function LitLink({ href, label }: { href: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // A thin band across the middle of the screen (the middle 10% of the viewport).
    const io = new IntersectionObserver(([entry]) => setLit(entry.isIntersecting), {
      rootMargin: '-45% 0px -45% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Link ref={ref} href={href} className={lit ? 'cn-ghost cn-lit is-lit' : 'cn-ghost cn-lit'}>
      <span className="cn-lit-text" data-label={label}>
        {label}
      </span>{' '}
      <span aria-hidden="true">→</span>
    </Link>
  )
}
