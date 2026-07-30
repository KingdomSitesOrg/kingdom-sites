'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import CountryLens, { COUNTRY_STATS, Lens } from './CountryLens'
import type { CountryId } from './countryShapes'

type Side = 'left' | 'right'

/** The little drawing that sits beside a line, and which side it sits on. */
type Art =
  | { kind: 'country'; country: CountryId; side: Side }
  | { kind: 'people'; side: Side }

type RollItem =
  | { line: string; stat?: undefined; tail?: undefined; art?: Art }
  | { stat: string; tail: string; art: Art }

function isCountryLine(item: RollItem): item is { stat: string; tail: string; art: Art } {
  return typeof item.stat === 'string'
}

/* The lines that pass over the photograph. The country figures come from the
   shared list so the Mission page and the home page preview always agree; the
   drawing alternates sides as you go down. */
const ROLL: RollItem[] = [
  { line: 'Millions of people have no idea who Jesus is.' },
  ...COUNTRY_STATS.map(({ country, stat, tail }, i): RollItem => ({
    stat,
    tail,
    art: { kind: 'country', country, side: i % 2 === 0 ? 'left' : 'right' },
  })),
  {
    line: 'Most of them will never meet a Christian.',
    art: { kind: 'people', side: 'right' },
  },
  { line: 'The glory of God is at stake.' },
]

/** One figure, drawn as strokes so it can be "sketched" on. */
function StickFigure({ x, dim = false }: { x: number; dim?: boolean }) {
  const colour = dim ? 'rgba(240,180,140,0.75)' : '#f0b48c'
  return (
    <g
      stroke={colour}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx={x} cy="34" r="6.5" fill={colour} fillOpacity={dim ? 0.18 : 0.32} />
      <line x1={x} y1="41" x2={x} y2="60" />
      <line x1={x - 8} y1="49" x2={x + 8} y2="49" />
      <line x1={x} y1="60" x2={x - 7} y2="72" />
      <line x1={x} y1="60" x2={x + 7} y2="72" />
    </g>
  )
}

/**
 * Two people: one stays, the other fades away and does not come back — the
 * Christian they were never going to meet.
 */
function PeopleSketch({ active }: { active: boolean }) {
  return (
    <Lens active={active}>
      {({ clipId, seaId }) => (
        <g clipPath={`url(#${clipId})`}>
          <circle cx="50" cy="50" r="47" fill={`url(#${seaId})`} />

          <g
            className="transition-opacity duration-500 ease-out motion-reduce:transition-none"
            style={{ opacity: active ? 1 : 0 }}
          >
            <StickFigure x={35} />
            {/* Restarted each time the line becomes active, via the key. */}
            {active && (
              <g key="vanishing" className="figure-vanish">
                <StickFigure x={65} dim />
              </g>
            )}
          </g>

          {/* Ground line under them both. */}
          <line
            x1="20"
            y1="74"
            x2="80"
            y2="74"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="0.8"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            className="transition-[stroke-dashoffset] delay-100 duration-700 ease-out motion-reduce:transition-none"
            style={{ strokeDashoffset: active ? 0 : 1 }}
          />
        </g>
      )}
    </Lens>
  )
}

function Slide({
  item,
  active,
  index,
  setRatio,
}: {
  item: RollItem
  active: boolean
  index: number
  setRatio: (index: number, ratio: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setRatio(index, item.art ? 1 : 0)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setRatio(index, entry.isIntersecting ? entry.intersectionRatio : 0)
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        /* Reaches below the fold so a drawing starts arriving while its line is
           still coming up the screen, rather than after it has settled. */
        rootMargin: '-6% 0px 14% 0px',
      },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [index, item, setRatio])

  const art = item.art
  const showArt = Boolean(art && active)
  const Line = index === 0 ? 'h1' : 'p'

  return (
    /* On a desktop each line owns a tall stretch of page and holds still in the
       middle of the screen for most of it, so you have to keep scrolling to get
       past it. On a phone that hold fights with touch scrolling — a slightly
       long flick lands you in the middle of a pause — so there each line simply
       scrolls by with the page. */
    <div className="h-[88svh] sm:h-[150svh]">
      <div
        ref={ref}
        className="flex h-full items-center justify-center px-5 sm:sticky sm:top-0 sm:h-svh sm:px-8"
      >
        {/* On a phone this stacks: the country map on top and large, the words
            underneath at full width. From tablet up the drawing moves
            alongside the words, on its own side. */}
        <div
          className={`flex w-full max-w-5xl flex-col-reverse items-center gap-7 sm:w-auto sm:gap-6 ${
            art?.side === 'right' ? 'sm:flex-row' : 'sm:flex-row-reverse'
          }`}
        >
          <Line
            className="text-balance text-center text-[2.25rem] font-semibold leading-[1.22] tracking-tight text-white sm:max-w-xl sm:text-5xl sm:leading-[1.12] lg:max-w-2xl lg:text-6xl"
            style={{ textShadow: '0 2px 22px rgba(0,0,0,0.7)' }}
          >
            {isCountryLine(item) ? (
              <>
                <span className="text-[#f0b48c]">{item.stat}</span>
                {' '}
                <span>{item.tail}</span>
              </>
            ) : (
              item.line
            )}
          </Line>

          {art && (
            <div
              className={`transition-all duration-500 ease-out motion-reduce:transition-none ${
                showArt
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-1 scale-90 opacity-0'
              }`}
            >
              {art.kind === 'country' ? (
                <CountryLens country={art.country} active={showArt} />
              ) : (
                <PeopleSketch active={showArt} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Sticky photograph scroll lines. Lines that have a drawing beside them fade
 * it in while the line is in view.
 */
export default function UnreachedScroll() {
  const [ratios, setRatios] = useState<number[]>(() => ROLL.map(() => 0))

  const setRatio = useCallback((index: number, ratio: number) => {
    setRatios((prev) => {
      if (prev[index] === ratio) return prev
      const next = prev.slice()
      next[index] = ratio
      return next
    })
  }, [])

  let activeIndex = -1
  let best = 0.35
  ratios.forEach((r, i) => {
    if (ROLL[i].art && r > best) {
      best = r
      activeIndex = i
    }
  })

  return (
    <div className="relative -mt-[100svh]">
      {ROLL.map((item, index) => (
        <Slide
          key={isCountryLine(item) ? item.tail : item.line}
          item={item}
          index={index}
          active={index === activeIndex}
          setRatio={setRatio}
        />
      ))}
    </div>
  )
}
