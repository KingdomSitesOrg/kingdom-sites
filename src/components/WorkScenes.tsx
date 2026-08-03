'use client'

import { useEffect, useState } from 'react'

/**
 * The opening screen of the home page: seven small businesses, drawn as stick
 * figures and quietly working — a wall being washed clean, a wheel turning, a
 * mower crossing a lawn, a line arriving on a chalkboard.
 *
 * All of them are on screen at once so a visitor sees straight away that this is
 * for their kind of business, whatever that is. One at a time lights up and is
 * named under the headline, so the eye is walked around the screen rather than
 * having to hunt.
 *
 * Everything is inline SVG animated with CSS. No video, no images, nothing to
 * download, and it all stops moving for anyone who has asked their device to
 * reduce motion.
 */

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function PressureWash() {
  return (
    <g {...STROKE}>
      <path d="M8 88H112" />
      {/* the house */}
      <path d="M54 42 82 22l28 20" />
      <path d="M58 42v46M106 42v46" />
      {/* the wall coming clean */}
      <rect x="62" y="50" width="40" height="34" rx="2" className="scene-clean" fill="currentColor" fillOpacity="0.16" stroke="none" />
      {/* the worker */}
      <circle cx="24" cy="52" r="6" />
      <path d="M24 58v16M24 74l-6 14M24 74l6 14M24 62l12-5" />
      <path d="M34 59 50 50" />
      {/* the spray */}
      <path d="M52 47 63 42" className="scene-spray" />
      <path d="M52 50h12" className="scene-spray" style={{ animationDelay: '0.18s' }} />
      <path d="M52 53 63 58" className="scene-spray" style={{ animationDelay: '0.36s' }} />
    </g>
  )
}

function AutoRepair() {
  return (
    <g {...STROKE}>
      <path d="M8 88H112" />
      {/* the car */}
      <path d="M28 78v-12h14l8-10h24l8 10h12v12" />
      <path d="M28 72h64" />
      {/* wheels, turning */}
      <circle cx="44" cy="80" r="7" />
      <circle cx="80" cy="80" r="7" />
      <g className="scene-spin">
        <path d="M44 74v12M38 80h12" strokeWidth="1.6" />
      </g>
      <g className="scene-spin" style={{ animationDelay: '-1.2s' }}>
        <path d="M80 74v12M74 80h12" strokeWidth="1.6" />
      </g>
      {/* the mechanic, with a spanner */}
      <circle cx="14" cy="52" r="5" />
      <path d="M14 57v14M14 71l-5 12M14 71l5 12M14 61l9-4" />
      <g className="scene-bob">
        <path d="M21 58 30 53" />
        <path d="M29 50v6" strokeWidth="1.6" />
      </g>
    </g>
  )
}

function Landscaping() {
  return (
    <g {...STROKE}>
      <path d="M8 88H112" />
      {/* a tree at the end of the lawn */}
      <path d="M100 88V72" />
      <circle cx="100" cy="62" r="10" />
      {/* grass: cut on the left, still long on the right */}
      <path d="M14 88v-3M20 88v-3M26 88v-3" strokeWidth="1.6" />
      <path d="M70 88v-7M76 88v-8M82 88v-6" strokeWidth="1.6" />
      {/* the mower and whoever is behind it */}
      <g className="scene-push">
        <path d="M38 82v-8h22v8" />
        <path d="M60 78 72 62" />
        <circle cx="42" cy="84" r="3.4" />
        <circle cx="56" cy="84" r="3.4" />
        <circle cx="80" cy="52" r="6" />
        <path d="M80 58v16M80 74l-6 14M80 74l6 14M80 62l-8-1" />
      </g>
    </g>
  )
}

function Tutoring() {
  return (
    <g {...STROKE}>
      <path d="M8 90H112" />
      {/* the board, with the lesson arriving on it */}
      <path d="M54 22h54v42H54z" />
      <path d="M60 36h34" pathLength={1} className="scene-write" />
      <path d="M60 46h28" pathLength={1} className="scene-write" style={{ animationDelay: '0.5s' }} />
      <path d="M60 56h20" pathLength={1} className="scene-write" style={{ animationDelay: '1s' }} />
      {/* whoever is teaching */}
      <circle cx="28" cy="40" r="6" />
      <path d="M28 46v18M28 64l-6 16M28 64l6 16M28 50l14-6" />
      {/* two heads listening */}
      <circle cx="66" cy="78" r="4" />
      <path d="M66 82v8" />
      <circle cx="86" cy="78" r="4" />
      <path d="M86 82v8" />
    </g>
  )
}

function WindowCleaning() {
  return (
    <g {...STROKE}>
      <path d="M8 90H112" />
      {/* the window */}
      <path d="M62 20h48v50H62z" />
      <path d="M86 20v50M62 45h48" />
      {/* the squeak of clean glass */}
      <path d="M70 64 82 26" strokeWidth="3" className="scene-wipe" opacity="0.5" />
      {/* the ladder */}
      <path d="M30 90 42 24M40 90 52 24" />
      <path d="M34 74h10M36 60h10M38 46h10M40 32h10" strokeWidth="1.6" />
      {/* whoever is up it */}
      <circle cx="46" cy="38" r="5" />
      <path d="M46 43v14M46 47l12-5" />
      <path d="M56 44 64 40" />
    </g>
  )
}

function Cafe() {
  return (
    <g {...STROKE}>
      <path d="M8 88H112" />
      {/* the counter */}
      <path d="M20 70h80v5H20zM26 75v13M94 75v13" />
      {/* a cup, steaming */}
      <path d="M56 60h14l-2 10h-10z" />
      <path d="M70 62q5 2 0 6" strokeWidth="1.6" />
      <path d="M59 56q2-4 0-7" strokeWidth="1.6" className="scene-steam" />
      <path d="M64 56q2-4 0-7" strokeWidth="1.6" className="scene-steam" style={{ animationDelay: '0.6s' }} />
      <path d="M69 56q2-4 0-7" strokeWidth="1.6" className="scene-steam" style={{ animationDelay: '1.2s' }} />
      {/* whoever made it, and whoever is buying it */}
      <circle cx="34" cy="48" r="6" />
      <path d="M34 54v16M34 58l12 5" />
      <circle cx="88" cy="50" r="6" />
      <path d="M88 56v18M88 74l-5 14M88 74l5 14M88 60l-8 4" />
    </g>
  )
}

function LocalShop() {
  return (
    <g {...STROKE}>
      <path d="M8 88H112" />
      {/* the shop */}
      <path d="M30 88V46h64v42" />
      <path d="M26 46h72l-6 10H32z" fill="currentColor" fillOpacity="0.12" />
      <path d="M54 88V62h18v26" />
      <path d="M36 62h12v12H36z" />
      {/* the sign that says they are open */}
      <path d="M63 62v5" strokeWidth="1.4" />
      <g className="scene-swing">
        <path d="M57 67h12v7H57z" strokeWidth="1.6" />
      </g>
      {/* a customer arriving */}
      <circle cx="14" cy="56" r="5" />
      <path d="M14 61v14M14 75l-5 13M14 75l5 13M14 65l8 3" />
    </g>
  )
}

type Scene = {
  id: string
  label: string
  draw: React.ReactNode
  /** Where it sits on the screen, and how big. */
  position: string
  /** The screen gets crowded on a phone, so some sit out. */
  phone?: boolean
}

const SCENES: Scene[] = [
  { id: 'wash', label: 'pressure washing companies', draw: <PressureWash />, position: 'left-[1%] top-[13%] w-[42vw] sm:w-[25vw] lg:w-[19vw]', phone: true },
  { id: 'lawn', label: 'landscapers and lawn care', draw: <Landscaping />, position: 'right-[1%] top-[11%] w-[42vw] sm:w-[25vw] lg:w-[19vw]', phone: true },
  { id: 'auto', label: 'auto repair shops', draw: <AutoRepair />, position: 'left-[3%] bottom-[9%] w-[40vw] sm:w-[24vw] lg:w-[18vw]', phone: true },
  { id: 'glass', label: 'window cleaners', draw: <WindowCleaning />, position: 'right-[3%] bottom-[10%] w-[38vw] sm:w-[23vw] lg:w-[17vw]', phone: true },
  { id: 'class', label: 'tutors and teachers', draw: <Tutoring />, position: 'left-[36%] top-[3%] w-[26vw] lg:w-[16vw]' },
  { id: 'cafe', label: 'cafés and restaurants', draw: <Cafe />, position: 'left-[8%] top-[46%] w-[22vw] lg:w-[15vw]' },
  { id: 'shop', label: 'shops and local retail', draw: <LocalShop />, position: 'right-[8%] top-[45%] w-[22vw] lg:w-[15vw]' },
]

/** How long each business stays lit before the next one. */
const HOLD_MS = 2600

export default function WorkScenes() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SCENES.length), HOLD_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {SCENES.map((scene, i) => (
          <div
            key={scene.id}
            className={`absolute ${scene.position} ${scene.phone ? '' : 'hidden sm:block'} transition-[color,opacity] duration-700 ease-out motion-reduce:transition-none ${
              i === index ? 'text-accent opacity-[0.85]' : 'text-ink opacity-[0.14]'
            }`}
          >
            <svg viewBox="0 0 120 100" className="block h-auto w-full">
              {scene.draw}
            </svg>
          </div>
        ))}
      </div>

      {/* The name of whichever business is currently lit. */}
      <p className="mt-6 text-base font-medium text-body sm:text-lg" aria-live="off">
        {'for '}
        <span key={SCENES[index].id} className="text-accent">
          {SCENES[index].label}
        </span>
      </p>
    </>
  )
}
