'use client'

import { useEffect, useState } from 'react'

/* The top line: "I build" and then what, changing every couple of seconds.
   Every word sits in the same grid cell, so the line never changes size and
   nothing below it moves. People who ask for less motion see the first word. */
const WORDS = ['websites.', 'apps.', 'custom software.', 'web apps.']
const EVERY_MS = 2200

export default function BuildWords() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return
    const t = window.setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % WORDS.length)
    }, EVERY_MS)
    return () => window.clearInterval(t)
  }, [])

  return (
    <h1 className="cn-display cn-h2 kf-build">
      <span className="sr-only">I build websites, apps and custom software.</span>
      <span aria-hidden="true">
        I build{' '}
        <span className="kf-words">
          {WORDS.map((w, n) => (
            <span key={w} className={n === i ? 'is-on' : n === (i + WORDS.length - 1) % WORDS.length ? 'is-off' : undefined}>
              {w}
            </span>
          ))}
        </span>
      </span>
    </h1>
  )
}
