'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CountryLens, { COUNTRY_STATS } from './CountryLens'

/** How long each country holds before the next one is drawn. */
const HOLD_MS = 4200

/**
 * A card that cycles through the countries from the Mission page — the same
 * drawing, one country at a time, each one drawn on as it arrives. It is a way
 * into the mission work from the bottom of the home page.
 */
export default function MissionPreview() {
  const [index, setIndex] = useState(0)
  /* Held false for a moment after each change so the new country draws itself
     on rather than appearing finished. */
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    let draw: ReturnType<typeof setTimeout>

    /* Clear the drawing, swap the country, then let it draw itself back on a
       moment later. */
    const start = () => {
      draw = setTimeout(() => setDrawn(true), 80)
    }

    const id = setInterval(() => {
      setDrawn(false)
      setIndex((i) => (i + 1) % COUNTRY_STATS.length)
      start()
    }, HOLD_MS)

    start()
    return () => {
      clearInterval(id)
      clearTimeout(draw)
    }
  }, [])

  const current = COUNTRY_STATS[index]

  return (
    <section aria-label="The mission behind the work" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex justify-center lg:justify-start">
          <Link
            href="/mission"
            aria-label="See the mission work behind Kingdom Sites"
            className="group flex w-full max-w-sm flex-col items-center rounded-[28px] border border-white/12 bg-white/[0.04] px-8 py-10 text-center transition-colors hover:border-white/25 hover:bg-white/[0.07]"
          >
            <CountryLens
              key={current.country}
              country={current.country}
              active={drawn}
              showLabel={false}
              className="w-[168px] sm:w-[196px]"
            />

            {/* Fixed height so the card does not jump as the wording changes. */}
            <div className="mt-6 flex min-h-[5.5rem] flex-col justify-start">
              <p
                className="text-2xl font-semibold leading-tight tracking-tight text-white transition-opacity duration-500 motion-reduce:transition-none"
                style={{ opacity: drawn ? 1 : 0 }}
              >
                <span className="text-[#f0b48c]">{current.stat}</span>{' '}
                <span>{current.tail}</span>
              </p>
            </div>

            <span className="mt-2 text-sm font-medium text-[#f0b48c]">
              See the mission <span aria-hidden="true">›</span>
            </span>
          </Link>
        </div>

        <div>
          <p className="eyebrow">The mission behind the work</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Billions of people have never heard the gospel once.
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-white/75">
            Kingdom Sites funds long-term mission work among people with almost no access to the
            gospel, and a percentage of everything I earn goes to organizations serving the
            persecuted church. Your project is part of that.
          </p>
          <div className="mt-8">
            <Link href="/mission" className="btn-primary">
              See where it goes
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
