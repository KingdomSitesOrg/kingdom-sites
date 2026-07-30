'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type RegionId = 'middle-east' | 'horn' | 'south-asia' | 'central-asia'

type MapSpec = {
  region: RegionId
  /** Arrow tip as % of the map box (0–100). */
  pin: { x: number; y: number }
  /** Where the sketch sits on the slide. */
  corner: Corner
  label: string
}

type LineItem = { line: string; map?: undefined }
type CountryItem = { stat: string; tail: string; map: MapSpec }
type RollItem = LineItem | CountryItem

function isCountry(item: RollItem): item is CountryItem {
  return 'stat' in item
}

/* Figures are rounded from national censuses and Joshua Project country
   profiles. Each country slide carries a rough regional sketch that fades in
   while that line is in view, then fades out as the next one takes over. */
const ROLL: RollItem[] = [
  { line: 'Millions of people have no idea who Jesus is.' },
  {
    stat: 'Under 0.1%',
    tail: 'of Afghanistan is Christian',
    map: {
      region: 'central-asia',
      pin: { x: 42, y: 48 },
      corner: 'top-left',
      label: 'Afghanistan',
    },
  },
  {
    stat: 'Under 0.1%',
    tail: 'of Somalia is Christian',
    map: {
      region: 'horn',
      pin: { x: 72, y: 58 },
      corner: 'bottom-right',
      label: 'Somalia',
    },
  },
  {
    stat: 'Under 0.2%',
    tail: 'of Yemen is Christian',
    map: {
      region: 'middle-east',
      pin: { x: 58, y: 72 },
      corner: 'top-right',
      label: 'Yemen',
    },
  },
  {
    stat: 'Under 0.1%',
    tail: 'of Omanis are Christian',
    map: {
      region: 'middle-east',
      pin: { x: 78, y: 62 },
      corner: 'bottom-left',
      label: 'Oman',
    },
  },
  {
    stat: 'About 0.4%',
    tail: 'of Bangladesh is Christian',
    map: {
      region: 'south-asia',
      pin: { x: 78, y: 48 },
      corner: 'top-left',
      label: 'Bangladesh',
    },
  },
  {
    stat: 'Under 2%',
    tail: 'of Pakistan is Christian',
    map: {
      region: 'south-asia',
      pin: { x: 28, y: 38 },
      corner: 'bottom-right',
      label: 'Pakistan',
    },
  },
  {
    stat: 'About 2%',
    tail: 'of India is Christian',
    map: {
      region: 'south-asia',
      pin: { x: 52, y: 58 },
      corner: 'top-right',
      label: 'India',
    },
  },
  { line: 'Most of them will never meet a Christian.' },
  { line: 'The glory of God is at stake.' },
]

const CORNER_CLASS: Record<Corner, string> = {
  'top-left': 'left-3 top-6 sm:left-8 sm:top-10',
  'top-right': 'right-3 top-6 sm:right-8 sm:top-10',
  'bottom-left': 'bottom-6 left-3 sm:bottom-10 sm:left-8',
  'bottom-right': 'bottom-6 right-3 sm:bottom-10 sm:right-8',
}

/* Soft landmass silhouettes — not cartography, just enough shape to place
   the country. Edges fade so the region feels cut off at the frame. */
function RegionLand({ region }: { region: RegionId }) {
  const fill = 'rgba(240, 180, 140, 0.28)'
  const stroke = 'rgba(240, 180, 140, 0.5)'

  switch (region) {
    case 'middle-east':
      /* Arabian peninsula + Levant — Yemen / Oman toward the south. */
      return (
        <g>
          <path
            d="M38 18c8-6 22-8 34-4 10 3 18 12 22 24 3 10 2 22-4 32-4 7-12 14-22 18-9 3-18 2-26-2-10-5-16-14-18-24-3-12 2-24 14-34Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />
          <path
            d="M52 62c6 4 14 8 22 10 4 1 8-1 10-5 3-6 1-12-4-16-6-5-14-6-22-4-5 1-8 6-6 15Z"
            fill="rgba(240, 180, 140, 0.16)"
          />
        </g>
      )
    case 'horn':
      /* Horn of Africa — Somalia's coastal hook. */
      return (
        <g>
          <path
            d="M28 22c14-10 32-12 46-4 10 6 16 18 14 32-2 12-10 22-20 30-8 6-16 12-18 22-1 4-5 6-9 4-6-3-8-12-6-20 3-12 2-22-4-32-4-7-2-18 0-28 1-3 4-5 0-4Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />
          <path
            d="M62 38c8 2 14 10 16 20 1 6-2 12-8 14-5 2-10 0-14-4-5-5-6-14-4-22 1-4 5-8 10-8Z"
            fill="rgba(240, 180, 140, 0.16)"
          />
        </g>
      )
    case 'south-asia':
      /* Subcontinent — Pakistan west, Bangladesh east, India center. */
      return (
        <g>
          <path
            d="M30 28c8-12 22-18 38-16 12 2 22 10 28 22 5 10 6 22 2 32-4 12-14 20-26 24-10 3-18 2-24-4-8-8-10-20-12-30-2-10 0-20 0-28 0-4-2-8-6 0Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />
          <path
            d="M22 34c-2 8 0 18 6 26 3 4 8 4 10-1 3-6 2-14-1-20-2-5-8-8-15-5Z"
            fill="rgba(240, 180, 140, 0.16)"
          />
          <path
            d="M72 40c6 2 10 8 10 14 0 5-4 8-9 8-4 0-7-3-8-7-1-5 1-11 7-15Z"
            fill="rgba(240, 180, 140, 0.18)"
          />
        </g>
      )
    case 'central-asia':
      /* Afghanistan / highland block. */
      return (
        <g>
          <path
            d="M26 36c6-14 20-24 38-26 14-1 28 6 34 18 5 10 4 22-2 32-6 10-18 16-30 18-12 2-24-2-32-12-7-8-10-18-8-30Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />
          <path
            d="M40 48c6-4 14-4 20 0 4 3 6 8 4 13-3 6-10 8-16 6-7-2-12-8-12-14 0-2 2-4 4-5Z"
            fill="rgba(240, 180, 140, 0.16)"
          />
        </g>
      )
    default:
      return null
  }
}

function ArrowToPin({ pin }: { pin: { x: number; y: number } }) {
  /* Shaft starts away from the pin so the tip lands on the country. */
  const from = {
    x: Math.max(10, Math.min(90, pin.x - 20)),
    y: Math.max(10, Math.min(90, pin.y - 24)),
  }
  const angle = Math.atan2(pin.y - from.y, pin.x - from.x)
  const tipLen = 5.5
  const left = {
    x: pin.x - tipLen * Math.cos(angle - 0.45),
    y: pin.y - tipLen * Math.sin(angle - 0.45),
  }
  const right = {
    x: pin.x - tipLen * Math.cos(angle + 0.45),
    y: pin.y - tipLen * Math.sin(angle + 0.45),
  }

  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={pin.x}
        y2={pin.y}
        stroke="#f0b48c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d={`M${pin.x} ${pin.y} L${left.x} ${left.y} L${right.x} ${right.y} Z`}
        fill="#f0b48c"
      />
      <circle cx={pin.x} cy={pin.y} r="2.2" fill="#f0b48c" />
    </g>
  )
}

function RegionSketch({ map }: { map: MapSpec }) {
  return (
    <div className="pointer-events-none w-[148px] sm:w-[176px]" aria-hidden="true">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#111827]/55 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-[2px]"
        style={{
          /* Soft vignette so the landmass feels cut off at the edges. */
          maskImage:
            'radial-gradient(ellipse 78% 72% at 50% 48%, #000 42%, transparent 92%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 78% 72% at 50% 48%, #000 42%, transparent 92%)',
        }}
      >
        <svg viewBox="0 0 100 100" className="block h-auto w-full opacity-95">
          <RegionLand region={map.region} />
          <ArrowToPin pin={map.pin} />
        </svg>
      </div>
      <p
        className="mt-1.5 text-center text-[11px] font-medium tracking-wide text-[#f0b48c]/90 sm:text-xs"
        style={{ textShadow: '0 1px 10px rgba(0,0,0,0.7)' }}
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
        /* Bias toward the middle of the sticky photograph so maps pop when
           the line is most readable. */
        threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        rootMargin: '-12% 0px -12% 0px',
      },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [index, item, setRatio])

  return (
    <div
      ref={ref}
      className="relative flex h-[58svh] items-center justify-center px-6"
    >
      {isCountry(item) && (
        <div
          className={`absolute z-10 transition-all duration-500 ease-out motion-reduce:transition-none ${CORNER_CLASS[item.map.corner]} ${
            active
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-2 scale-95 opacity-0'
          }`}
        >
          <RegionSketch map={item.map} />
        </div>
      )}

      <p
        className="relative z-[1] max-w-4xl text-balance text-center text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl"
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
    </div>
  )
}

/**
 * Sticky photograph scroll lines. Country slides fade a rough regional sketch
 * in (with an arrow on that country) while the line is in view.
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

  /* Only the most-visible country slide shows its map — avoids two sketches
     fighting during a transition. */
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
