'use client'

import { useEffect, useState } from 'react'

/* The top of the page: "I build" and, below it, what, changing every couple of
   seconds; large and centred, filling the first part of the screen. Every word
   sits in the same grid cell, so the line never changes size and nothing below
   it moves. People who ask for less motion see the first word.
   The line waits for its own font before it shows, then fades in, so it never
   appears in a stand-in font and jumps when the real one arrives. */
const WORDS = ['apps.', 'websites.', 'custom software.', 'web apps.']
const EVERY_MS = 2200
/* Never wait longer than this for the font. */
const FONT_WAIT_MS = 1200

export default function BuildWords() {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let done = false
    const show = () => {
      if (done) return
      done = true
      setShown(true)
    }
    document.fonts?.ready.then(show, show)
    const late = window.setTimeout(show, FONT_WAIT_MS)
    return () => window.clearTimeout(late)
  }, [])

  useEffect(() => {
    if (!shown) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return
    const t = window.setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % WORDS.length)
    }, EVERY_MS)
    return () => window.clearInterval(t)
  }, [shown])

  return (
    <h1 className="cn-display kf-build" data-shown={shown ? '' : undefined}>
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
