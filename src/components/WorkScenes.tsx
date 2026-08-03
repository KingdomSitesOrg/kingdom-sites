'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The opening screen of the home page: one small business at a time, drawn
 * filling the whole screen, then sliding off as the next one arrives.
 *
 * Each scene is a still — a snapshot of the work being done, not an animation.
 * Nothing moves inside the frame; the only movement on the screen is the slide
 * between one business and the next, and that stops entirely for anyone who has
 * asked their device to reduce motion.
 *
 * Everything is inline SVG. No video, no image files, nothing to download.
 */

/* One palette across all the scenes, so seven different trades still look like
   they were drawn by the same hand. Each surface has a darker partner used for
   the shaded side of things. */
const C = {
  ink: '#1f2937',
  line: '#33415a',
  sky: '#cfe3f4',
  skyHigh: '#b9d6ee',
  skyWarm: '#fbe7c6',
  sun: '#fbd36b',
  cloud: '#ffffff',
  grass: '#8cc78a',
  grassDark: '#6aa870',
  grassDeep: '#4f8a58',
  path: '#d3d7dd',
  pathDark: '#bcc2ca',
  wall: '#efe4d5',
  wallShade: '#dccfbc',
  wallGrime: '#c9bda9',
  wallClean: '#fdf8f1',
  roof: '#a3634a',
  roofDark: '#8a5039',
  brick: '#cf8a67',
  wood: '#c1935f',
  woodDark: '#8b5e3c',
  woodDeep: '#6d492e',
  glass: '#b7d5ef',
  glassDark: '#94bade',
  steel: '#9aa5b1',
  steelDark: '#78838f',
  blue: '#0a63c9',
  blueDark: '#0a4e9e',
  red: '#cf4f42',
  redDark: '#a93b30',
  teal: '#3f9d9b',
  board: '#2f5147',
  skin: '#f0c9a4',
  white: '#ffffff',
}

/* Thin, because the whole drawing is blown up to fill a screen — a line that
   looks right at thumbnail size turns into a fat black band at this scale. */
const OUTLINE = {
  stroke: C.ink,
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const HAIRLINE = { stroke: C.ink, strokeWidth: 0.9, fill: 'none', opacity: 0.45 }

/** The soft shadow a person or an object drops on the ground. */
function Shadow({ x, y, rx, ry = 3.4 }: { x: number; y: number; rx: number; ry?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={C.ink} opacity="0.13" />
}

/** An arm: a limb the colour of the sleeve, with a hand on the end. */
function Arm({ d, hand, sleeve }: { d: string; hand: [number, number]; sleeve: string }) {
  return (
    <>
      <path d={d} stroke={sleeve} strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <circle cx={hand[0]} cy={hand[1]} r="4.2" fill={C.skin} stroke={C.ink} strokeWidth="1.1" />
    </>
  )
}

/** A person: limbs with thickness, hair or a cap, shoes, and a face. */
function Person({
  x,
  y,
  shirt,
  shirtShade,
  pants = '#41506b',
  hair = '#3a2c24',
  hat,
  scale = 1,
  arms,
}: {
  x: number
  y: number
  shirt: string
  shirtShade?: string
  pants?: string
  hair?: string
  hat?: string
  scale?: number
  arms?: React.ReactNode
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* legs and shoes */}
      <path d="M-6 38-8 60M6 38 9 60" stroke={pants} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M-13 63h9a2.6 2.6 0 0 0 0-5h-4zM13 63h-9a2.6 2.6 0 0 1 0-5h4z" fill={C.ink} />

      {/* body, with the shaded side */}
      <path
        d="M-11 12h22a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5h-22a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5z"
        fill={shirt}
        stroke={C.ink}
        strokeWidth="1.2"
      />
      <path d="M7 12h4a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H7z" fill={shirtShade ?? C.ink} opacity={shirtShade ? 1 : 0.12} />
      <path d="M-5 12 0 18l5-6" fill="none" stroke={C.ink} strokeWidth="1.1" opacity="0.4" />

      {arms}

      {/* neck and head */}
      <path d="M0 5v8" stroke={C.skin} strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="0" cy="-1" r="10.5" fill={C.skin} stroke={C.ink} strokeWidth="1.2" />
      {hat ? (
        <>
          <path d="M-10.5-4a10.5 10.5 0 0 1 21 0z" fill={hat} stroke={C.ink} strokeWidth="1.1" />
          <path d="M-13-4h19" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <path d="M-10.5-2a10.5 10.5 0 0 1 21 0q-5-6-10.5-4T-10.5-2z" fill={hair} />
      )}
      <circle cx="-3.6" cy="0" r="1.1" fill={C.ink} />
      <circle cx="3.6" cy="0" r="1.1" fill={C.ink} />
      <path d="M-3 4.4q3 2.3 6 0" fill="none" stroke={C.ink} strokeWidth="1.1" strokeLinecap="round" />
    </g>
  )
}

function Sky({ warm = false }: { warm?: boolean }) {
  return (
    <>
      <rect width="400" height="260" fill={warm ? C.skyWarm : C.sky} />
      <rect width="400" height="96" fill={warm ? '#f7dcae' : C.skyHigh} opacity="0.55" />
    </>
  )
}

function Sun({ x, y, r = 17 }: { x: number; y: number; r?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r + 8} fill={C.sun} opacity="0.22" />
      <circle cx={x} cy={y} r={r} fill={C.sun} stroke={C.ink} strokeWidth="1.2" />
    </>
  )
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 12h56a13 13 0 0 0 0-26 18 18 0 0 0-33-7 14 14 0 0 0-23 20 8 8 0 0 0 0 13z"
        fill={C.cloud}
        stroke={C.ink}
        strokeWidth="1.2"
      />
      <path d="M6 12h50a13 13 0 0 0 6-3 22 22 0 0 1-56 3z" fill={C.glass} opacity="0.35" />
    </g>
  )
}

function Birds({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={C.ink} strokeWidth="1.1" opacity="0.5">
      <path d="M0 0q4-4 8 0q4-4 8 0" />
      <path d="M16 10q3-3 6 0q3-3 6 0" />
    </g>
  )
}

/* ---------------------------------------------------------------- scenes -- */

export function PressureWash() {
  return (
    <g>
      <Sky />
      <Sun x={344} y={38} />
      <Cloud x={30} y={44} s={0.8} />
      <Cloud x={228} y={26} s={0.55} />
      <Birds x={140} y={40} />

      {/* garden and driveway */}
      <rect y="192" width="400" height="68" fill={C.grass} />
      <rect y="192" width="400" height="10" fill={C.grassDark} />
      <path d="M96 260 130 192h130l40 68z" fill={C.path} />
      <path d="M96 260 130 192h130l40 68z" fill="none" stroke={C.pathDark} strokeWidth="1.4" />
      <path d="M150 192 132 260M214 192l6 68M262 192l24 68" stroke={C.pathDark} strokeWidth="1.2" fill="none" />

      {/* the house */}
      <rect x="252" y="34" width="16" height="30" fill={C.brick} {...OUTLINE} />
      <path d="M150 100 244 42l96 58z" fill={C.roof} {...OUTLINE} />
      <path d="M244 42 340 100h-24L244 54z" fill={C.roofDark} />
      <path d="M166 92h156M180 84h128M194 76h100" {...HAIRLINE} />
      <rect x="164" y="98" width="164" height="96" fill={C.wallGrime} {...OUTLINE} />
      {/* the strip that has been washed */}
      <rect x="168" y="102" width="74" height="88" fill={C.wallClean} />
      <path d="M242 102v88" stroke={C.white} strokeWidth="2" opacity="0.8" fill="none" />
      <path d="M164 116h164M164 134h164M164 152h164M164 170h164" {...HAIRLINE} />

      <rect x="186" y="132" width="34" height="58" rx="2" fill={C.woodDark} {...OUTLINE} />
      <circle cx="214" cy="162" r="2.2" fill={C.sun} />
      <rect x="264" y="120" width="48" height="40" rx="2" fill={C.glass} {...OUTLINE} />
      <path d="M288 120v40M264 140h48" stroke={C.ink} strokeWidth="1.1" opacity="0.5" fill="none" />
      <path d="M268 156 284 124" stroke={C.white} strokeWidth="4" opacity="0.55" fill="none" />
      <rect x="262" y="160" width="52" height="4" fill={C.wallShade} {...OUTLINE} />
      <rect x="164" y="98" width="164" height="96" fill="none" {...OUTLINE} />

      {/* the machine, its hose, and the jet */}
      <Shadow x={30} y={238} rx={26} />
      <rect x="-2" y="202" width="40" height="30" rx="4" fill={C.red} {...OUTLINE} />
      <rect x="4" y="208" width="20" height="10" rx="2" fill={C.redDark} />
      <circle cx="8" cy="232" r="5" fill={C.ink} />
      <circle cx="30" cy="232" r="5" fill={C.ink} />
      <path d="M38 212q30 16 40-4" fill="none" stroke={C.ink} strokeWidth="2.6" opacity="0.7" />

      <path d="M80 156 128 144" fill="none" stroke={C.steel} strokeWidth="5" strokeLinecap="round" />
      <path d="M126 142 202 112 202 176 126 150z" fill="#dceeff" stroke={C.white} strokeWidth="1.6" opacity="0.92" />
      <path d="M150 138 130 146M164 142l-24 8M178 146l-24 8" stroke={C.white} strokeWidth="1.4" opacity="0.8" fill="none" />
      <path d="M206 118 228 108M208 142h22M206 168l22 10" stroke="#dceeff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <circle cx="236" cy="124" r="2.4" fill="#dceeff" />
      <circle cx="244" cy="150" r="1.8" fill="#dceeff" />
      <circle cx="234" cy="178" r="2.6" fill="#dceeff" />
      <ellipse cx="150" cy="212" rx="30" ry="5" fill="#dceeff" opacity="0.55" />

      <Shadow x={68} y={206} rx={20} />
      <Person
        x={64}
        y={140}
        shirt={C.blue}
        shirtShade={C.blueDark}
        hat={C.red}
        arms={
          <>
            <Arm d="M-9 20 0 16" hand={[1, 15]} sleeve={C.blue} />
            <Arm d="M9 20 22 15" hand={[23, 14]} sleeve={C.blue} />
          </>
        }
      />
    </g>
  )
}

function Landscaping() {
  return (
    <g>
      <Sky />
      <Sun x={50} y={38} />
      <Cloud x={228} y={30} s={0.75} />
      <Birds x={130} y={34} />

      {/* a hedge along the back, then the lawn in mown stripes */}
      {Array.from({ length: 15 }).map((_, i) => (
        <circle key={i} cx={i * 29} cy="130" r="15" fill={C.grassDeep} />
      ))}
      <rect y="130" width="400" height="14" fill={C.grassDeep} />
      <rect y="140" width="400" height="120" fill={C.grass} />
      <rect y="164" width="400" height="16" fill={C.grassDark} opacity="0.4" />
      <rect y="198" width="400" height="16" fill={C.grassDark} opacity="0.4" />
      <rect y="232" width="400" height="16" fill={C.grassDark} opacity="0.4" />

      {/* flower bed */}
      <rect x="14" y="158" width="76" height="14" rx="4" fill={C.woodDark} {...OUTLINE} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M${28 + i * 18} 158v-9`} stroke={C.grassDeep} strokeWidth="2" fill="none" />
          <circle cx={28 + i * 18} cy={147} r="4.4" fill={i % 2 ? C.red : C.sun} stroke={C.ink} strokeWidth="1" />
        </g>
      ))}

      {/* the tree */}
      <Shadow x={332} y={176} rx={30} ry={6} />
      <rect x="326" y="118" width="14" height="58" fill={C.woodDark} {...OUTLINE} />
      <path d="M333 160 322 148M333 140l12-12" stroke={C.woodDeep} strokeWidth="3" fill="none" />
      <circle cx="332" cy="96" r="36" fill={C.grassDeep} {...OUTLINE} />
      <circle cx="310" cy="110" r="22" fill={C.grassDark} {...OUTLINE} />
      <circle cx="350" cy="112" r="18" fill={C.grassDark} {...OUTLINE} />
      <circle cx="322" cy="84" r="14" fill={C.grass} opacity="0.7" />

      {/* grass still standing where the mower has not been */}
      <path d="M252 214v-14M262 216v-18M272 214v-12M282 216v-16" stroke={C.grassDeep} strokeWidth="3.4" strokeLinecap="round" fill="none" />

      {/* the mower */}
      <Shadow x={158} y={214} rx={44} />
      <rect x="112" y="176" width="76" height="26" rx="6" fill={C.red} {...OUTLINE} />
      <rect x="120" y="160" width="34" height="20" rx="4" fill={C.steel} {...OUTLINE} />
      <rect x="126" y="165" width="14" height="8" rx="2" fill={C.steelDark} />
      <rect x="160" y="166" width="26" height="30" rx="5" fill={C.grassDeep} {...OUTLINE} />
      <path d="M188 188 228 148M190 196 230 156" fill="none" stroke={C.ink} strokeWidth="2.6" />
      <path d="M226 148h16" fill="none" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="126" cy="202" r="11" fill={C.ink} />
      <circle cx="176" cy="202" r="11" fill={C.ink} />
      <circle cx="126" cy="202" r="4.5" fill={C.steel} />
      <circle cx="176" cy="202" r="4.5" fill={C.steel} />

      <Shadow x={252} y={206} rx={20} />
      <Person
        x={250}
        y={140}
        shirt={C.teal}
        hat={C.sun}
        arms={
          <>
            <Arm d="M-9 20-22 14" hand={[-24, 13]} sleeve={C.teal} />
            <Arm d="M9 20-14 22" hand={[-16, 23]} sleeve={C.teal} />
          </>
        }
      />
    </g>
  )
}

function AutoRepair() {
  return (
    <g>
      {/* the workshop */}
      <rect width="400" height="260" fill="#e7ecf2" />
      <rect y="182" width="400" height="78" fill="#c2cad4" />
      <path d="M0 182h400" stroke={C.ink} strokeWidth="1.4" opacity="0.3" fill="none" />
      <rect y="182" width="400" height="6" fill="#aab3bf" />

      {/* back wall: roller door, pegboard, lamp */}
      <rect x="242" y="46" width="132" height="94" rx="3" fill="#d3dae2" {...OUTLINE} />
      <path d="M242 66h132M242 86h132M242 106h132M242 126h132" {...HAIRLINE} />
      <rect x="30" y="52" width="90" height="60" rx="3" fill="#dbe2ea" {...OUTLINE} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M${48 + i * 26} 62v14`} stroke={C.ink} strokeWidth="1.2" fill="none" />
          <path
            d={`M${42 + i * 26} 76h12v10h-12z`}
            fill={i === 1 ? C.red : C.steel}
            stroke={C.ink}
            strokeWidth="1.1"
          />
        </g>
      ))}
      <path d="M186 14v18" stroke={C.ink} strokeWidth="1.6" fill="none" />
      <path d="M172 32h28l-6 10h-16z" fill={C.steel} {...OUTLINE} />
      <circle cx="186" cy="44" r="4" fill={C.sun} />

      {/* tool chest */}
      <rect x="24" y="128" width="62" height="54" rx="4" fill={C.red} {...OUTLINE} />
      <path d="M24 146h62M24 164h62" stroke={C.redDark} strokeWidth="2" fill="none" />
      <path d="M46 137h18M46 155h18M46 173h18" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* the car */}
      <Shadow x={196} y={190} rx={100} ry={6} />
      <path
        d="M104 182v-26c0-7 5-12 12-12h12l20-26c3-4 8-7 13-7h50c5 0 10 3 13 7l20 26h12c7 0 12 5 12 12v26z"
        fill={C.blue}
        {...OUTLINE}
      />
      <path d="M152 144h38v-26h-19zM198 144h38l-19-26h-19z" fill={C.glass} {...OUTLINE} />
      <path d="M156 140 172 120" stroke={C.white} strokeWidth="3" opacity="0.6" fill="none" />
      <path d="M194 144v-26" stroke={C.ink} strokeWidth="1.2" opacity="0.5" fill="none" />
      <path d="M194 148v34" stroke={C.blueDark} strokeWidth="1.8" fill="none" />
      <path d="M180 158h14" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      <rect x="104" y="156" width="14" height="10" rx="3" fill={C.sun} {...OUTLINE} />
      <rect x="270" y="156" width="14" height="10" rx="3" fill={C.red} {...OUTLINE} />
      <path d="M104 172h182" stroke={C.blueDark} strokeWidth="2" fill="none" />

      {/* wheels, standing still */}
      <circle cx="140" cy="182" r="19" fill={C.ink} />
      <circle cx="256" cy="182" r="19" fill={C.ink} />
      <circle cx="140" cy="182" r="9" fill={C.steel} stroke={C.ink} strokeWidth="1.2" />
      <circle cx="256" cy="182" r="9" fill={C.steel} stroke={C.ink} strokeWidth="1.2" />
      <circle cx="140" cy="182" r="3" fill={C.steelDark} />
      <circle cx="256" cy="182" r="3" fill={C.steelDark} />

      {/* the mechanic, spanner in hand */}
      <Shadow x={334} y={186} rx={20} />
      <Person
        x={332}
        y={112}
        shirt="#3b6bb5"
        shirtShade="#2f568f"
        pants="#3b6bb5"
        arms={
          <>
            <Arm d="M-9 20-24 14" hand={[-26, 13]} sleeve="#3b6bb5" />
            <Arm d="M9 20 20 30" hand={[21, 31]} sleeve="#3b6bb5" />
          </>
        }
      />
      {/* the spanner, in his hand */}
      <path d="M306 125 288 125" stroke={C.steelDark} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M292 125 283 119v12z" fill={C.steelDark} stroke={C.ink} strokeWidth="1" />
      {/* a rag in the other hand */}
      <path d="M353 143q9 6 4 14t-12 2z" fill={C.sun} stroke={C.ink} strokeWidth="1.1" />
    </g>
  )
}

function Cafe() {
  return (
    <g>
      <rect width="400" height="260" fill="#f7ead9" />
      <rect y="196" width="400" height="64" fill={C.wood} />
      <path d="M0 196h400" stroke={C.ink} strokeWidth="1.4" opacity="0.3" fill="none" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M${i * 52} 196 ${i * 52 - 14} 260`} stroke={C.woodDark} strokeWidth="1.2" opacity="0.45" fill="none" />
      ))}

      {/* menu board on the back wall */}
      <rect x="16" y="26" width="104" height="70" rx="4" fill={C.board} {...OUTLINE} />
      <path d="M30 46h58M30 62h44M30 78h52" stroke={C.white} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M94 62h14" stroke={C.sun} strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* a shelf of cups */}
      <rect x="252" y="54" width="122" height="6" rx="2" fill={C.woodDark} {...OUTLINE} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${266 + i * 28} 54v-12h14v12z`} fill={C.white} stroke={C.ink} strokeWidth="1.1" />
      ))}

      {/* pendant lamps */}
      <path d="M176 4v20M300 4v28" stroke={C.ink} strokeWidth="1.4" fill="none" />
      <path d="M164 24h24l-5 12h-14z" fill={C.red} {...OUTLINE} />
      <path d="M288 32h24l-5 12h-14z" fill={C.teal} {...OUTLINE} />

      {/* whoever is making it, standing behind the bar */}
      <Person
        x={92}
        y={110}
        shirt={C.teal}
        arms={
          <>
            <Arm d="M-9 20-20 28" hand={[-22, 29]} sleeve={C.teal} />
            <Arm d="M9 20 24 24" hand={[26, 25]} sleeve={C.teal} />
          </>
        }
      />

      {/* the machine on the bar */}
      <rect x="148" y="112" width="84" height="50" rx="5" fill={C.steel} {...OUTLINE} />
      <rect x="148" y="112" width="84" height="12" rx="5" fill={C.steelDark} />
      <rect x="162" y="130" width="22" height="24" rx="3" fill={C.ink} />
      <path d="M173 154v8" stroke={C.ink} strokeWidth="3" fill="none" />
      <circle cx="206" cy="136" r="5" fill={C.red} stroke={C.ink} strokeWidth="1.1" />
      <circle cx="220" cy="136" r="5" fill={C.sun} stroke={C.ink} strokeWidth="1.1" />
      <path d="M232 134q12 2 10 16" fill="none" stroke={C.steelDark} strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${158 + i * 22} 112v-8h14v8z`} fill={C.white} stroke={C.ink} strokeWidth="1.1" />
      ))}

      {/* the pastry case, also on the bar */}
      <rect x="248" y="128" width="76" height="34" rx="3" fill={C.glass} opacity="0.8" stroke={C.ink} strokeWidth="1.2" />
      <path d="M248 146h76" stroke={C.ink} strokeWidth="1" opacity="0.4" fill="none" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={266 + i * 24} cy={154} r="6" fill={C.wood} stroke={C.ink} strokeWidth="1" />
      ))}

      {/* the bar itself, drawn last so it stands in front of the barista */}
      <rect x="8" y="162" width="330" height="12" rx="4" fill={C.woodDark} {...OUTLINE} />
      <rect x="16" y="174" width="314" height="34" fill={C.wood} {...OUTLINE} />
      <path d="M16 190h314" stroke={C.woodDark} strokeWidth="1.4" opacity="0.55" fill="none" />

      {/* a finished cup waiting on the bar */}
      <path d="M104 162h18l-3-16h-12z" fill={C.white} {...OUTLINE} />
      <path d="M122 150q7 4 0 9" fill="none" {...OUTLINE} />

      {/* the customer, out on the floor with a coffee in hand */}
      <Shadow x={366} y={214} rx={20} />
      <Person
        x={364}
        y={146}
        shirt={C.red}
        shirtShade={C.redDark}
        hair="#5b4436"
        arms={
          <>
            <Arm d="M-9 20-20 30" hand={[-22, 31]} sleeve={C.red} />
            <Arm d="M9 20 16 12" hand={[17, 11]} sleeve={C.red} />
          </>
        }
      />
      <path d="M374 152h14l-2 13h-10z" fill={C.white} {...OUTLINE} />
      <path d="M374 155h14" stroke={C.woodDark} strokeWidth="1.4" opacity="0.6" fill="none" />
    </g>
  )
}

function WindowCleaning() {
  return (
    <g>
      <Sky />
      <Cloud x={20} y={30} s={0.7} />
      <Birds x={104} y={26} />
      <rect y="220" width="400" height="40" fill={C.path} />
      <path d="M0 220h400" stroke={C.pathDark} strokeWidth="1.6" fill="none" />
      <path d="M120 220v40M240 220v40M340 220v40" stroke={C.pathDark} strokeWidth="1.2" fill="none" />

      {/* the building */}
      <rect x="150" y="10" width="238" height="210" fill="#e2e8ef" {...OUTLINE} />
      <rect x="150" y="10" width="238" height="10" fill="#cdd6e0" />
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => {
          const x = 172 + col * 72
          const y = 40 + row * 92
          const washed = row === 0 && col === 0
          return (
            <g key={`${row}-${col}`}>
              <rect x={x} y={y} width="54" height="66" rx="2" fill={washed ? '#cde6fb' : C.glassDark} {...OUTLINE} />
              <path d={`M${x + 27} ${y}v66M${x} ${y + 33}h54`} stroke={C.ink} strokeWidth="1" opacity="0.45" fill="none" />
              <path
                d={`M${x + 8} ${y + 58} ${x + 38} ${y + 6}`}
                stroke={C.white}
                strokeWidth="6"
                strokeLinecap="round"
                opacity={washed ? 0.95 : 0.4}
                fill="none"
              />
              <rect x={x - 4} y={y + 66} width="62" height="4" fill="#cdd6e0" stroke={C.ink} strokeWidth="1" />
            </g>
          )
        }),
      )}

      {/* the ladder */}
      <Shadow x={112} y={220} rx={34} />
      <path d="M74 220 122 34M100 220 148 34" fill="none" stroke={C.wood} strokeWidth="6.5" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${80 + i * 9.5} ${190 - i * 37}h26`}
          stroke={C.woodDark}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {/* whoever is up it, feet on a rung, mid-wipe */}
      <Person
        x={130}
        y={53}
        shirt={C.blue}
        shirtShade={C.blueDark}
        hat={C.teal}
        arms={
          <>
            <Arm d="M-9 20-20 28" hand={[-22, 29]} sleeve={C.blue} />
            <Arm d="M9 20 32 6" hand={[34, 5]} sleeve={C.blue} />
          </>
        }
      />
      <path d="M164 58h22" stroke={C.steel} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M186 51v14" stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* the rung his feet are on, drawn over them */}
      <path d="M118 116h26" stroke={C.woodDark} strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* bucket and cloth at the foot of it */}
      <Shadow x={48} y={220} rx={20} />
      <path d="M30 220v-24h36v24z" fill={C.blue} {...OUTLINE} />
      <path d="M30 202h36" stroke={C.blueDark} strokeWidth="2.4" fill="none" />
      <path d="M32 196q16-14 32 0" fill="none" stroke={C.ink} strokeWidth="1.4" />
      <path d="M72 220q10-10 20 0z" fill={C.sun} {...OUTLINE} />
    </g>
  )
}

function Tutoring() {
  return (
    <g>
      <rect width="400" height="260" fill="#f4f1ea" />
      <rect y="196" width="400" height="64" fill={C.wood} />
      <path d="M0 196h400" stroke={C.ink} strokeWidth="1.4" opacity="0.3" fill="none" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M${i * 52} 196 ${i * 52 - 12} 260`} stroke={C.woodDark} strokeWidth="1.1" opacity="0.45" fill="none" />
      ))}

      {/* the board */}
      <rect x="146" y="22" width="228" height="126" rx="4" fill={C.board} {...OUTLINE} />
      <rect x="146" y="142" width="228" height="8" rx="2" fill={C.woodDark} {...OUTLINE} />
      <path d="M166 50h156M166 72h122M166 94h84" stroke={C.white} strokeWidth="3.4" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M166 116h56" stroke={C.sun} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M300 100h44M322 78v44" stroke={C.white} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* clock and a shelf of books */}
      <circle cx="46" cy="40" r="18" fill={C.white} {...OUTLINE} />
      <path d="M46 28v12l9 6" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      <rect x="16" y="94" width="76" height="6" rx="2" fill={C.woodDark} {...OUTLINE} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={22 + i * 17}
          y={72}
          width="13"
          height="22"
          rx="2"
          fill={[C.red, C.teal, C.blue, C.sun][i]}
          stroke={C.ink}
          strokeWidth="1.1"
        />
      ))}

      {/* whoever is teaching */}
      <Shadow x={104} y={200} rx={20} />
      <Person
        x={102}
        y={116}
        shirt={C.red}
        shirtShade={C.redDark}
        hair="#4a3226"
        arms={
          <>
            <Arm d="M-9 20-20 30" hand={[-22, 31]} sleeve={C.red} />
            <Arm d="M9 20 30 6" hand={[32, 5]} sleeve={C.red} />
          </>
        }
      />
      <path d="M136 118 146 104" stroke={C.woodDark} strokeWidth="2.6" strokeLinecap="round" fill="none" />

      {/* two at their desks */}
      <Person
        x={238}
        y={158}
        shirt={C.blue}
        shirtShade={C.blueDark}
        scale={0.8}
        hair="#2f2a26"
        arms={<Arm d="M-9 20-16 30" hand={[-18, 31]} sleeve={C.blue} />}
      />
      <Person
        x={330}
        y={158}
        shirt={C.teal}
        scale={0.8}
        hair="#5b4436"
        arms={<Arm d="M-9 20-16 30" hand={[-18, 31]} sleeve={C.teal} />}
      />
      <rect x="206" y="196" width="66" height="9" rx="3" fill={C.woodDark} {...OUTLINE} />
      <rect x="298" y="196" width="66" height="9" rx="3" fill={C.woodDark} {...OUTLINE} />
      <path d="M216 196v-10h20v10z" fill={C.white} stroke={C.ink} strokeWidth="1.1" />
      <path d="M308 196v-10h20v10z" fill={C.white} stroke={C.ink} strokeWidth="1.1" />
    </g>
  )
}

function LocalShop() {
  return (
    <g>
      <Sky warm />
      <Sun x={52} y={34} />
      <Cloud x={250} y={22} s={0.6} />
      <rect y="208" width="400" height="52" fill={C.path} />
      <path d="M0 208h400" stroke={C.pathDark} strokeWidth="1.6" fill="none" />
      <path d="M90 208v52M210 208v52M330 208v52" stroke={C.pathDark} strokeWidth="1.2" fill="none" />

      {/* the shop */}
      <rect x="92" y="52" width="248" height="156" fill={C.wall} {...OUTLINE} />
      <rect x="92" y="52" width="248" height="16" fill={C.wallShade} />
      <path d="M104 44h224l6 10H98z" fill={C.brick} {...OUTLINE} />

      {/* the striped awning */}
      <path d="M84 68h264l-18 32H102z" fill={C.white} {...OUTLINE} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${112 + i * 52} 68 ${102 + i * 52} 100h26l10-32z`} fill={C.red} />
      ))}
      <path d="M84 68h264l-18 32H102z" fill="none" {...OUTLINE} />
      <path d="M102 100h228" stroke={C.ink} strokeWidth="1.4" fill="none" />

      {/* window with a display, and the door */}
      <rect x="112" y="112" width="94" height="66" rx="2" fill={C.glass} {...OUTLINE} />
      <path d="M118 168 158 118" stroke={C.white} strokeWidth="6" opacity="0.55" fill="none" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={122 + i * 26} y={152} width="18" height="18" rx="2" fill={[C.teal, C.sun, C.red][i]} stroke={C.ink} strokeWidth="1.1" />
      ))}
      <rect x="108" y="178" width="102" height="5" fill={C.wallShade} {...OUTLINE} />

      <rect x="238" y="112" width="76" height="96" rx="2" fill={C.woodDark} {...OUTLINE} />
      <rect x="248" y="122" width="56" height="42" rx="2" fill={C.glass} {...OUTLINE} />
      <circle cx="302" cy="182" r="3" fill={C.sun} stroke={C.ink} strokeWidth="1" />

      {/* the sign that says they are open */}
      <path d="M276 122v8" stroke={C.ink} strokeWidth="1.4" fill="none" />
      <rect x="256" y="130" width="42" height="20" rx="4" fill={C.white} {...OUTLINE} />
      <path d="M264 140h26" stroke={C.blue} strokeWidth="3.4" strokeLinecap="round" fill="none" />

      {/* planters and a bicycle */}
      <rect x="94" y="182" width="26" height="26" fill={C.brick} {...OUTLINE} />
      <circle cx="107" cy="176" r="12" fill={C.grassDark} {...OUTLINE} />
      <rect x="322" y="182" width="26" height="26" fill={C.brick} {...OUTLINE} />
      <circle cx="335" cy="176" r="12" fill={C.grassDark} {...OUTLINE} />
      <g stroke={C.ink} strokeWidth="2" fill="none">
        <circle cx="358" cy="196" r="12" />
        <circle cx="388" cy="196" r="12" />
        <path d="M358 196 370 180h12l6 16M370 180l-6 16" />
      </g>

      {/* a customer arriving */}
      <Shadow x={44} y={212} rx={20} />
      <Person
        x={42}
        y={136}
        shirt={C.teal}
        hair="#4a3226"
        arms={
          <>
            <Arm d="M-9 20-18 32" hand={[-20, 33]} sleeve={C.teal} />
            <Arm d="M9 20 20 28" hand={[22, 29]} sleeve={C.teal} />
          </>
        }
      />
    </g>
  )
}

type Scene = { id: string; label: string; draw: React.ReactNode }

const SCENES: Scene[] = [
  { id: 'wash', label: 'pressure washing companies', draw: <PressureWash /> },
  { id: 'lawn', label: 'landscapers and lawn care', draw: <Landscaping /> },
  { id: 'auto', label: 'auto repair shops', draw: <AutoRepair /> },
  { id: 'cafe', label: 'cafés and restaurants', draw: <Cafe /> },
  { id: 'glass', label: 'window cleaners', draw: <WindowCleaning /> },
  { id: 'class', label: 'tutors and teachers', draw: <Tutoring /> },
  { id: 'shop', label: 'shops and local retail', draw: <LocalShop /> },
]

/** One scene on screen: 1.5s still, then a short ease-out slide to the next.
    Keep in step with the hold/move split on `scenes-pan` in globals.css. */
const HOLD_MS = 1500
const SLIDE_MS = 700
const PER_SCENE_MS = HOLD_MS + SLIDE_MS

/** How far into a step the next scene has landed. Hold first, then ease-out —
    by ~40% of the slide the new business is effectively in place, so the
    caption switches there and stays with the picture. */
const ARRIVES_AT = (HOLD_MS + SLIDE_MS * 0.4) / PER_SCENE_MS

/* The seven scenes plus one repeat of the first. When the strip has slid seven
   panels along, the repeat is filling the screen — identical to the start — so
   the animation can loop with no visible jump. One spare panel is all that
   takes: a second full copy would be seven more screen-sized layers for the
   browser to hold and rasterise, for no visible gain. */
const PANELS = [...SCENES, SCENES[0]]

export default function WorkScenes({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)

  /* The caption is read off the pan itself rather than off a timer of its own.
     A separate timer drifts out of step — the animation does not start at the
     same instant the component mounts — and the name of the business then
     changes while the wrong one is still on screen. */
  useEffect(() => {
    let frame = 0
    let shown = -1

    const tick = () => {
      const animation = track.current?.getAnimations?.()[0]
      const elapsed = Number(animation?.currentTime ?? 0)
      /* Hold, then ease-out. Caption flips when the new scene has mostly landed. */
      const current = Math.floor(elapsed / PER_SCENE_MS + 1 - ARRIVES_AT) % SCENES.length
      if (current !== shown) {
        shown = current
        setIndex(current)
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          ref={track}
          className="scenes-pan flex h-full w-[800%]"
          style={{ ['--pan-duration' as string]: `${(PER_SCENE_MS * SCENES.length) / 1000}s` }}
        >
          {PANELS.map((scene, i) => (
            <div
              key={`${scene.id}-${i}`}
              className="h-full w-[calc(100%/8)] shrink-0 border-r border-ink/15"
            >
              <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                {scene.draw}
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* A soft wash of the page colour behind the words, so the headline stays
          readable whichever scene is underneath it. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 44% 22% at 50% 47%, rgba(245,247,250,0.9) 0%, rgba(245,247,250,0.55) 58%, rgba(245,247,250,0) 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {children}

        {/* The trade currently on screen, in a dark pill so it reads over any
            of the scenes rather than disappearing into the sky. */}
        <p className="mt-7 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-white shadow-[0_10px_28px_rgba(16,23,37,0.28)] sm:px-6 sm:py-3 sm:text-lg">
          {'for '}
          <span className="ml-1.5 font-semibold text-[#f0b48c]">{SCENES[index].label}</span>
        </p>
      </div>
    </>
  )
}
