'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { COUNTRY_SHAPES, type CountryId } from './countryShapes'

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

/* Figures are rounded from national censuses and Joshua Project country
   profiles. Each country line draws a small map of that country — and the land
   around it — right next to the words, then fades out as the next one takes
   over. */
const ROLL: RollItem[] = [
  { line: 'Millions of people have no idea who Jesus is.' },
  {
    stat: 'Under 0.1%',
    tail: 'of Afghanistan is Christian',
    art: { kind: 'country', country: 'afghanistan', side: 'left' },
  },
  {
    stat: 'Under 0.1%',
    tail: 'of Somalia is Christian',
    art: { kind: 'country', country: 'somalia', side: 'right' },
  },
  {
    stat: 'Under 0.2%',
    tail: 'of Yemen is Christian',
    art: { kind: 'country', country: 'yemen', side: 'left' },
  },
  {
    stat: 'Under 0.1%',
    tail: 'of Omanis are Christian',
    art: { kind: 'country', country: 'oman', side: 'right' },
  },
  {
    stat: 'About 0.4%',
    tail: 'of Bangladesh is Christian',
    art: { kind: 'country', country: 'bangladesh', side: 'left' },
  },
  {
    stat: 'Under 2%',
    tail: 'of Pakistan is Christian',
    art: { kind: 'country', country: 'pakistan', side: 'right' },
  },
  {
    stat: 'About 2%',
    tail: 'of India is Christian',
    art: { kind: 'country', country: 'india', side: 'left' },
  },
  {
    line: 'Most of them will never meet a Christian.',
    art: { kind: 'people', side: 'right' },
  },
  { line: 'The glory of God is at stake.' },
]

/** Shared frame: the round lens the drawings sit inside. */
function Lens({
  active,
  label,
  children,
}: {
  active: boolean
  label?: string
  children: (ids: { clipId: string; seaId: string }) => React.ReactNode
}) {
  /* React's generated ids contain colons; strip them so the ids are safe to
     reference from the clip-path and gradient attributes. */
  const uid = useId().replace(/:/g, '')
  const clipId = `sketch-clip-${uid}`
  const seaId = `sketch-sea-${uid}`

  return (
    <figure
      className="pointer-events-none m-0 flex w-[124px] shrink-0 flex-col items-center sm:w-[168px] lg:w-[196px]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="block h-auto w-full">
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="47" />
          </clipPath>
          <radialGradient id={seaId} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="rgba(12,18,28,0.55)" />
            <stop offset="100%" stopColor="rgba(12,18,28,0.28)" />
          </radialGradient>
        </defs>

        {children({ clipId, seaId })}

        {/* Rim of the lens, drawn on as it arrives. */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="rgba(240,180,140,0.5)"
          strokeWidth="0.8"
          pathLength={1}
          strokeDasharray={1}
          className="transition-[stroke-dashoffset] duration-[1400ms] ease-out motion-reduce:transition-none"
          style={{ strokeDashoffset: active ? 0 : 1 }}
        />
      </svg>

      {label && (
        <figcaption
          className="mt-1.5 text-center text-[11px] font-medium tracking-wide text-[#f0b48c] sm:text-xs"
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.75)' }}
        >
          {label}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * A small round map: the country picked out in the accent colour, with the
 * land around it drawn faintly behind so you can tell where in the world you
 * are. When it becomes the active line the border draws itself on, the
 * surrounding land fades up, and the country fills in.
 */
function CountrySketch({ country, active }: { country: CountryId; active: boolean }) {
  const shape = COUNTRY_SHAPES[country]

  return (
    <Lens active={active} label={shape.label}>
      {({ clipId, seaId }) => (
        <g clipPath={`url(#${clipId})`}>
          <circle cx="50" cy="50" r="47" fill={`url(#${seaId})`} />

          {/* Neighbouring land — context, kept quieter than the country. */}
          <path
            d={shape.region}
            fill="rgba(255,255,255,0.13)"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="0.55"
            strokeLinejoin="round"
            className="transition-opacity delay-100 duration-1000 ease-out motion-reduce:transition-none"
            style={{ opacity: active ? 1 : 0 }}
          />

          {/* The country itself: the outline is drawn on slowly, then the fill
              comes up behind it. */}
          <path
            d={shape.country}
            fill="#f0b48c"
            stroke="#f0b48c"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            className="transition-[stroke-dashoffset,fill-opacity] delay-200 duration-[2200ms] ease-out motion-reduce:transition-none"
            style={{
              strokeDashoffset: active ? 0 : 1,
              fillOpacity: active ? 0.5 : 0,
              filter: 'drop-shadow(0 0 5px rgba(240,180,140,0.35))',
            }}
          />
        </g>
      )}
    </Lens>
  )
}

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
    /* Each line owns a tall stretch of page, and holds still in the middle of
       the screen for most of it. That is the pause: you have to keep scrolling
       to move past a line, so nobody flies through the whole section in one
       flick. */
    <div className="h-[150svh]">
      <div
        ref={ref}
        className="sticky top-0 flex h-svh items-center justify-center px-5 sm:px-8"
      >
        {/* The drawing sits in the same cluster as the line — not out in a corner. */}
        <div
          className={`flex max-w-5xl items-center gap-3 sm:gap-6 ${
            art?.side === 'right' ? 'flex-row' : 'flex-row-reverse'
          }`}
        >
          <Line
            className="max-w-[11rem] text-balance text-center text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:max-w-xl sm:text-5xl lg:max-w-2xl lg:text-6xl"
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
                <CountrySketch country={art.country} active={showArt} />
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
