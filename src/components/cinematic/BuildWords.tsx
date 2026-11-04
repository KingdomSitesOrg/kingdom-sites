'use client'

import { useEffect, useState } from 'react'

/* The top of the page: "I build" and, below it, what, changing every couple of
   seconds; large and centred, filling the first part of the screen. Every word
   sits in the same grid cell, so the line never changes size and nothing below
   it moves. People who ask for less motion see the first word.
   It is on screen at once, with the page's very first paint: a quick fade
   (film.css) covers the moment its font arrives, so nothing jumps. */
const WORDS = ['apps.', 'websites.', 'custom software.', 'web apps.']
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
    <h1 className="cn-display kf-build">
      <span className="sr-only">I build apps, websites and custom software.</span>
      <span aria-hidden="true" className="kf-build-line">
        <span className="kf-build-lead">I build</span>
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
