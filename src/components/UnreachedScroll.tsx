'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Side = 'left' | 'right'

type CountryId =
  | 'afghanistan'
  | 'somalia'
  | 'yemen'
  | 'oman'
  | 'bangladesh'
  | 'pakistan'
  | 'india'

type MapSpec = {
  country: CountryId
  /** Which side of the line the outline sits on. */
  side: Side
  label: string
}

type LineItem = { line: string; map?: undefined }
type CountryItem = { stat: string; tail: string; map: MapSpec }
type RollItem = LineItem | CountryItem

function isCountry(item: RollItem): item is CountryItem {
  return 'stat' in item
}

/* Figures are rounded from national censuses and Joshua Project country
   profiles. Each country slide fades in a simple outline of that country
   right next to the line, then fades out as the next one takes over. */
const ROLL: RollItem[] = [
  { line: 'Millions of people have no idea who Jesus is.' },
  {
    stat: 'Under 0.1%',
    tail: 'of Afghanistan is Christian',
    map: { country: 'afghanistan', side: 'left', label: 'Afghanistan' },
  },
  {
    stat: 'Under 0.1%',
    tail: 'of Somalia is Christian',
    map: { country: 'somalia', side: 'right', label: 'Somalia' },
  },
  {
    stat: 'Under 0.2%',
    tail: 'of Yemen is Christian',
    map: { country: 'yemen', side: 'left', label: 'Yemen' },
  },
  {
    stat: 'Under 0.1%',
    tail: 'of Omanis are Christian',
    map: { country: 'oman', side: 'right', label: 'Oman' },
  },
  {
    stat: 'About 0.4%',
    tail: 'of Bangladesh is Christian',
    map: { country: 'bangladesh', side: 'left', label: 'Bangladesh' },
  },
  {
    stat: 'Under 2%',
    tail: 'of Pakistan is Christian',
    map: { country: 'pakistan', side: 'right', label: 'Pakistan' },
  },
  {
    stat: 'About 2%',
    tail: 'of India is Christian',
    map: { country: 'india', side: 'left', label: 'India' },
  },
  { line: 'Most of them will never meet a Christian.' },
  { line: 'The glory of God is at stake.' },
]

/* Simplified country silhouettes — general outline only, not a globe or
   full regional map. Paths sit in a 100×100 viewBox. */
function CountryOutline({ country }: { country: CountryId }) {
  const fill = 'rgba(240, 180, 140, 0.18)'
  const stroke = '#f0b48c'

  switch (country) {
    case 'afghanistan':
      /* Rough highland block, wider west, northeast notch. */
      return (
        <path
          d="M18 42 L28 28 L48 22 L62 20 L78 26 L86 38 L84 52 L76 64 L62 72 L44 74 L28 68 L18 56 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    case 'somalia':
      /* Horn of Africa — long coast, hooked south tip. */
      return (
        <path
          d="M22 28 L38 18 L52 16 L62 22 L68 34 L72 48 L70 62 L64 74 L58 86 L48 90 L42 82 L46 68 L44 52 L36 40 L24 38 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    case 'yemen':
      /* Southern Arabian block, wider bottom coast. */
      return (
        <path
          d="M22 38 L40 28 L62 26 L80 34 L86 48 L82 64 L68 74 L42 76 L24 66 L18 50 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    case 'oman':
      /* Eastern Arabian tip + Musandam-ish north hook. */
      return (
        <path
          d="M34 22 L48 18 L56 28 L62 24 L72 30 L78 42 L76 58 L68 72 L52 78 L40 70 L36 54 L30 40 L34 30 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    case 'bangladesh':
      /* Compact delta, slightly open south coast. */
      return (
        <path
          d="M30 30 L48 22 L66 26 L74 40 L70 56 L62 70 L46 76 L32 68 L26 52 L28 38 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    case 'pakistan':
      /* Tall western slab, tapering south toward the sea. */
      return (
        <path
          d="M34 18 L56 16 L68 28 L72 44 L66 58 L58 72 L50 84 L38 80 L32 64 L28 46 L30 30 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    case 'india':
      /* Classic subcontinent — wide north, pointed south. */
      return (
        <path
          d="M28 24 L48 16 L68 18 L80 30 L82 46 L74 58 L66 70 L56 84 L48 90 L40 78 L34 62 L26 48 L24 34 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )
    default:
      return null
  }
}

function CountrySketch({ map }: { map: MapSpec }) {
  /* Arrow from outside the outline toward its center. */
  const tip = { x: 52, y: 48 }
  const from =
    map.side === 'left'
      ? { x: 12, y: 18 }
      : { x: 88, y: 18 }
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const tipLen = 6
  const left = {
    x: tip.x - tipLen * Math.cos(angle - 0.5),
    y: tip.y - tipLen * Math.sin(angle - 0.5),
  }
  const right = {
    x: tip.x - tipLen * Math.cos(angle + 0.5),
    y: tip.y - tipLen * Math.sin(angle + 0.5),
  }

  return (
    <div
      className="pointer-events-none flex w-[92px] shrink-0 flex-col items-center sm:w-[110px]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="block h-auto w-full drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]">
        <CountryOutline country={map.country} />
        <line
          x1={from.x}
          y1={from.y}
          x2={tip.x}
          y2={tip.y}
          stroke="#f0b48c"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d={`M${tip.x} ${tip.y} L${left.x} ${left.y} L${right.x} ${right.y} Z`}
          fill="#f0b48c"
        />
      </svg>
      <p
        className="mt-0.5 text-center text-[11px] font-medium tracking-wide text-[#f0b48c] sm:text-xs"
        style={{ textShadow: '0 1px 10px rgba(0,0,0,0.75)' }}
      >
        {map.label}
      </p>
    </div>
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
      setRatio(index, isCountry(item) ? 1 : 0)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setRatio(index, entry.isIntersecting ? entry.intersectionRatio : 0)
      },
      {
        threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        rootMargin: '-12% 0px -12% 0px',
      },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [index, item, setRatio])

  const map = isCountry(item) ? item.map : null
  const showMap = Boolean(map && active)

  return (
    <div
      ref={ref}
      className="flex h-[58svh] items-center justify-center px-5 sm:px-8"
    >
      {/* Outline sits in the same cluster as the line — not out in a corner. */}
      <div
        className={`flex max-w-5xl items-center gap-3 sm:gap-5 ${
          map?.side === 'right' ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <p
          className="max-w-[11rem] text-balance text-center text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:max-w-xl sm:text-5xl lg:max-w-2xl lg:text-6xl"
          style={{ textShadow: '0 2px 22px rgba(0,0,0,0.7)' }}
        >
          {isCountry(item) ? (
            <>
              <span className="text-[#f0b48c]">{item.stat}</span>
              {' '}
              <span>{item.tail}</span>
            </>
          ) : (
            item.line
          )}
        </p>

        {map && (
          <div
            className={`transition-all duration-500 ease-out motion-reduce:transition-none ${
              showMap
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-1 scale-95 opacity-0'
            }`}
          >
            <CountrySketch map={map} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Sticky photograph scroll lines. Country slides fade a simple country
 * outline in next to the line while it is in view.
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
    if (isCountry(ROLL[i]) && r > best) {
      best = r
      activeIndex = i
    }
  })

  return (
    <div className="relative -mt-[100svh]">
      {ROLL.map((item, index) => (
        <Slide
          key={isCountry(item) ? item.tail : item.line}
          item={item}
          index={index}
          active={index === activeIndex}
          setRatio={setRatio}
        />
      ))}
    </div>
  )
}
