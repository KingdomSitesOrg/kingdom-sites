'use client'

import { useEffect, useState } from 'react'

/**
 * A small column of dots on the right edge, one per section of a long page.
 * The dot of the section crossing the middle of the screen is lit; each dot
 * names its section in a tooltip on hover and keyboard focus (the same name
 * is the link's text for screen readers), and a click glides there, or jumps
 * there for people who ask for less motion. Hidden on phones.
 */
export default function DotNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
    // A thin band across the middle of the screen: whichever section is in it is the current one.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -54% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: still ? 'instant' : 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
    // Keyboard users carry on reading from the section they picked.
    el.focus({ preventScroll: true })
    setActive(id)
  }

  return (
    <nav aria-label="Sections on this page" className="cn-dots">
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} onClick={(e) => go(e, s.id)} aria-current={active === s.id ? 'location' : undefined}>
              <span className="cn-dot" aria-hidden="true" />
              <span className="cn-dot-tip">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
