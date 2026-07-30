'use client'

import { useId } from 'react'
import { COUNTRY_SHAPES, type CountryId } from './countryShapes'

/* The share of each country that is Christian, rounded from national censuses
   and Joshua Project country profiles. Used on the Mission page and in the
   preview card on the home page, so the two never drift apart. */
export const COUNTRY_STATS: { country: CountryId; stat: string; tail: string }[] = [
  { country: 'afghanistan', stat: 'Under 0.1%', tail: 'of Afghanistan is Christian' },
  { country: 'somalia', stat: 'Under 0.1%', tail: 'of Somalia is Christian' },
  { country: 'yemen', stat: 'Under 0.2%', tail: 'of Yemen is Christian' },
  { country: 'oman', stat: 'Under 0.1%', tail: 'of Omanis are Christian' },
  { country: 'bangladesh', stat: 'About 0.4%', tail: 'of Bangladesh is Christian' },
  { country: 'pakistan', stat: 'Under 2%', tail: 'of Pakistan is Christian' },
  { country: 'india', stat: 'About 2%', tail: 'of India is Christian' },
]

/* On a phone the map is the thing you look at first, so it takes most of the
   width; on wider screens it sits beside the words and stays modest. */
const DEFAULT_WIDTH = 'w-[62vw] max-w-[300px] sm:w-[168px] sm:max-w-none lg:w-[196px]'

/** The round frame every one of these drawings sits inside. */
export function Lens({
  active,
  label,
  className = DEFAULT_WIDTH,
  children,
}: {
  active: boolean
  label?: string
  className?: string
  children: (ids: { clipId: string; seaId: string }) => React.ReactNode
}) {
  /* React's generated ids contain colons; strip them so the ids are safe to
     reference from the clip-path and gradient attributes. */
  const uid = useId().replace(/:/g, '')
  const clipId = `sketch-clip-${uid}`
  const seaId = `sketch-sea-${uid}`

  return (
    <figure
      className={`pointer-events-none m-0 flex shrink-0 flex-col items-center ${className}`}
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
          className="mt-2 text-center text-sm font-medium tracking-wide text-[#f0b48c] sm:mt-1.5 sm:text-xs"
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
 * are. When it turns active the border draws itself on slowly, the surrounding
 * land fades up, and the country fills in.
 */
export default function CountryLens({
  country,
  active,
  className,
  showLabel = true,
}: {
  country: CountryId
  active: boolean
  className?: string
  showLabel?: boolean
}) {
  const shape = COUNTRY_SHAPES[country]

  return (
    <Lens active={active} label={showLabel ? shape.label : undefined} className={className}>
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
