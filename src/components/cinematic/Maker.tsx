'use client'

import { useEffect, useState } from 'react'
import { MADE } from '@/lib/work'
import Scroll from './Scroll'

type Key = keyof typeof MADE

/**
 * Variant A (T-372): a beat of its own right after a product comes into view.
 * "I built this." in the display face, then two credit lines: what I made,
 * and what it does for the people who use it.
 */
export function CreditBeat({ id, title = 'I built this.' }: { id: Key; title?: string }) {
  const m = MADE[id]
  return (
    <Scroll className="cn-wrap">
      <div className="cn-reveal cn-credit">
        <p className="cn-display cn-h2">{title}</p>
        <dl className="cn-credit-list">
          <div>
            <dt>What I made</dt>
            <dd>{m.made}</dd>
          </div>
          <div>
            <dt>What it does for them</dt>
            <dd>{m.gives}</dd>
          </div>
        </dl>
      </div>
    </Scroll>
  )
}

/**
 * Variant B (T-372): a lower third, like a film's credit, that holds in the
 * corner while a product is on screen and changes with it. Sections opt in
 * with `data-made="<key>"`; whichever one crosses the middle of the screen
 * names the caption. On narrower screens the same credit sits in the page
 * instead (MakerTag), so nothing covers the screenshots.
 */
export function LowerThird() {
  // `shown` keeps the last product named, so the caption fades out with its words.
  const [{ on, shown }, set] = useState<{ on: boolean; shown: Key }>({ on: false, shown: 'farzana' })

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-made]')]
    const seen = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target)
          else seen.delete(e.target)
        }
        const first = els.find((el) => seen.has(el))
        set((s) => (first ? { on: true, shown: first.dataset.made as Key } : { ...s, on: false }))
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const m = MADE[shown]

  return (
    <aside className="cn-third" data-on={on ? "" : undefined} aria-hidden={!on}>
      <p className="cn-third-k">Built by me</p>
      <p key={shown} className="cn-third-name">
        {m.name}
      </p>
      <p className="cn-third-made">{m.made}</p>
      <p className="cn-third-gives">{m.gives}</p>
    </aside>
  )
}

/** Variant B on a phone: the lower third's words, in the page. */
export function MakerTag({ id }: { id: Key }) {
  const m = MADE[id]
  return (
    <div className="cn-wrap cn-tag">
      <p className="cn-third-k">Built by me</p>
      <p className="cn-third-made mt-2">{m.made}</p>
      <p className="cn-third-gives">{m.gives}</p>
    </div>
  )
}
