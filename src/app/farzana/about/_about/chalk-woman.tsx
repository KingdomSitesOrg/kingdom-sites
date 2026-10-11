"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

import { useInView, useReducedMotion } from "../../_home/motion";
import { SectionIntro } from "../../_home/shared";
import { buttonClass } from "../../_ui/button";

import { CHALK_LINES } from "./chalk-lines";

/**
 * Thomas's picture of where the logo comes from, told once on a chalkboard
 * (his idea, Oct 2026): a young Afghan woman is drawn in chalk; two tears
 * roll down her cheek; she is wiped away like chalk off a board while the
 * tears stay; they turn saffron and become the logo's two diamonds; and
 * "Farzana" writes itself in under them, so they sit over the z exactly as
 * they do in the real logo.
 *
 * One timeline, in milliseconds from when the board scrolls into view (`T`):
 *   0 – 2600     she is drawn: the scarf, her face, her hair, the drape
 *   900 – 3000   the chalk shading fills in from the top
 *   3100 – 5100  two tears form at her lashes and roll down her cheek
 *   5100 – 6600  she is wiped away, a little chalk dust falling; the tears stay
 *   6000 – 6800  the tears turn saffron and become the two diamonds
 *   6800 – 8000  the word writes itself in under them
 * About eight seconds. It plays once; "Play it again" replays it. Off screen
 * it pauses, and with reduced motion it is simply the finished logo.
 *
 * Drawn on a 400 x 500 board. Her lines are `chalk-lines.ts`, each drawn on in
 * turn; the shading under them is a still picture
 * (public/farzana/chalk-woman.svg) uncovered from the top. The end state
 * follows `Wordmark`'s geometry: each diamond's side 11% of the cap height,
 * half a diamond between the tips, lower tips on the cap line, centred on the
 * z.
 */

const T = {
  shade: { at: 900, ms: 2100 },
  tear1: { at: 3100, form: 380, roll: 1300 },
  tear2: { at: 3650, form: 380, roll: 1150 },
  wipe: { at: 5100, ms: 1500 },
  gold: { at: 6000, ms: 380 },
  become: { at: 6350, ms: 460 },
  glow: { at: 6400, ms: 900 },
  word: { at: 6800, ms: 1200 },
} as const;

/* The finished logo: "Farzana" at 72 units, 270 of the board's 400 wide. */
const K = 0.72;
const CAP = 72.9 * K;
const SIDE = CAP * 0.11;
const TIP = SIDE * Math.SQRT2;
const BASELINE = 281.6;
/** Centred: at a 100-unit size the word's ink runs from 6 to 381, the z's middle at 182.85. */
const WORD_X = 200 - 193.5 * K;
const Z = WORD_X + 182.85 * K;
const PAIR_Y = BASELINE - CAP - TIP / 2;
const HALF_SPACING = (TIP + TIP / 2) / 2;

/** Each tear ends as a diamond; it starts at her lower lashes, under her nearer eye. */
const TEARS = [
  { x: Z - HALF_SPACING, from: [183.6, 178], ...T.tear1 },
  { x: Z + HALF_SPACING, from: [194.1, 177], ...T.tear2 },
];
const TEAR_PATH = "M0-4C.9-2.3 2.1-.9 2.1.7A2.1 2.1 0 0 1-2.1.7C-2.1-.9-.9-2.3 0-4Z";

/**
 * A few grains of chalk dust that fall as she is wiped away. From a fixed
 * whole-number sequence and rounded, so the server and the browser agree.
 */
const DUST = (() => {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const round = (value: number) => Math.round(value * 10) / 10;
  return Array.from({ length: 18 }, () => {
    const u = next();
    const v = next();
    const x = 95 + u * 270;
    return {
      x: round(x),
      y: round(70 + v * 380),
      r: round(0.5 + next() * 0.7),
      at: Math.round(T.wipe.at + (x / 400) * T.wipe.ms * 0.75),
      dx: round((v - 0.5) * 8),
      dy: round(16 + u * 16),
    };
  });
})();

const ms = (value: number) => `${value}ms`;
const vars = (values: Record<string, string | number>) => values as CSSProperties;

const STYLES = `
.fz-chalk-line {
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  opacity: 0;
}
.fz-chalk-shade {
  background: url(/farzana/chalk-woman.svg) center / 100% 100% no-repeat;
  -webkit-mask: linear-gradient(180deg, #000 45.45%, transparent 54.55%) 0 100% / 100% 220% no-repeat;
  mask: linear-gradient(180deg, #000 45.45%, transparent 54.55%) 0 100% / 100% 220% no-repeat;
}
.fz-chalk-woman {
  -webkit-mask: linear-gradient(110deg, transparent 45.45%, #000 54.55%) 100% 0 / 220% 100% no-repeat;
  mask: linear-gradient(110deg, transparent 45.45%, #000 54.55%) 100% 0 / 220% 100% no-repeat;
}
.fz-chalk-dust, .fz-chalk-drop, .fz-chalk-gem, .fz-chalk-glow { transform-box: fill-box; transform-origin: center; }
.fz-chalk-dust, .fz-chalk-drop, .fz-chalk-gem, .fz-chalk-glow { opacity: 0; }
.fz-chalk-word {
  -webkit-mask: linear-gradient(90deg, #000 45.45%, transparent 54.55%) 100% 0 / 220% 100% no-repeat;
  mask: linear-gradient(90deg, #000 45.45%, transparent 54.55%) 100% 0 / 220% 100% no-repeat;
}

.fz-chalk[data-phase="play"] .fz-chalk-line {
  animation: fz-chalk-draw var(--ms) cubic-bezier(.45,.1,.35,1) var(--at) both;
}
.fz-chalk[data-phase="play"] .fz-chalk-shade {
  animation: fz-chalk-uncover ${ms(T.shade.ms)} ease-in-out ${ms(T.shade.at)} both;
}
.fz-chalk[data-phase="play"] .fz-chalk-roll {
  animation: fz-chalk-roll var(--roll) cubic-bezier(.5,0,.6,1) calc(var(--at) + var(--form)) both;
}
.fz-chalk[data-phase="play"] .fz-chalk-drop {
  animation:
    fz-chalk-form var(--form) cubic-bezier(.3,1.4,.5,1) var(--at) both,
    fz-chalk-gold ${ms(T.gold.ms)} ease ${ms(T.gold.at)} forwards,
    fz-chalk-out ${ms(T.become.ms)} ease-in ${ms(T.become.at)} forwards;
}
.fz-chalk[data-phase="play"] .fz-chalk-gem {
  animation: fz-chalk-in ${ms(T.become.ms)} cubic-bezier(.3,1.5,.5,1) ${ms(T.become.at)} both;
}
.fz-chalk[data-phase="play"] .fz-chalk-glow {
  animation: fz-chalk-glow ${ms(T.glow.ms)} ease-out ${ms(T.glow.at)} both;
}
.fz-chalk[data-phase="play"] .fz-chalk-woman {
  animation: fz-chalk-wipe ${ms(T.wipe.ms)} cubic-bezier(.4,0,.6,1) ${ms(T.wipe.at)} both;
}
.fz-chalk[data-phase="play"] .fz-chalk-dust {
  animation: fz-chalk-fall 1000ms cubic-bezier(.4,0,.8,.6) var(--at) both;
}
.fz-chalk[data-phase="play"] .fz-chalk-word {
  animation: fz-chalk-write ${ms(T.word.ms)} cubic-bezier(.5,.1,.3,1) ${ms(T.word.at)} both;
}
.fz-chalk[data-paused="true"] * { animation-play-state: paused !important; }

@keyframes fz-chalk-draw {
  0% { stroke-dashoffset: 1; opacity: 0; }
  3% { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}
@keyframes fz-chalk-uncover { to { -webkit-mask-position: 0 0; mask-position: 0 0; } }
@keyframes fz-chalk-wipe {
  0% { -webkit-mask-position: 100% 0; mask-position: 100% 0; opacity: 1; }
  100% { -webkit-mask-position: 0 0; mask-position: 0 0; opacity: 0; transform: translateY(2px); }
}
@keyframes fz-chalk-fall {
  0% { opacity: 0; transform: none; }
  15% { opacity: .6; }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)); }
}
@keyframes fz-chalk-form {
  0% { opacity: 0; transform: scale(.2, .1); }
  100% { opacity: .85; transform: none; }
}
@keyframes fz-chalk-roll {
  0% { transform: translate(var(--sx), var(--sy)); }
  38% { transform: translate(calc(var(--sx) * .72), calc(var(--sy) * .64)); }
  52% { transform: translate(calc(var(--sx) * .68), calc(var(--sy) * .6)); }
  100% { transform: none; }
}
@keyframes fz-chalk-gold { to { fill: var(--color-gold); } }
@keyframes fz-chalk-out { to { opacity: 0; transform: scale(.55, .7) rotate(45deg); } }
@keyframes fz-chalk-in {
  0% { opacity: 0; transform: scale(.4); }
  100% { opacity: 1; transform: none; }
}
@keyframes fz-chalk-glow {
  0% { opacity: 0; transform: scale(.5); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.35); }
}
@keyframes fz-chalk-write { to { -webkit-mask-position: 0 0; mask-position: 0 0; } }

.fz-chalk[data-phase="done"] .fz-chalk-woman,
.fz-chalk[data-phase="done"] .fz-chalk-drop { visibility: hidden; }
.fz-chalk[data-phase="done"] .fz-chalk-gem { opacity: 1; }
.fz-chalk[data-phase="done"] .fz-chalk-word { -webkit-mask: none; mask: none; }
`;

/** Without JavaScript nothing would start it, so the finished logo shows. */
const NO_SCRIPT_STYLES = `
.fz-chalk .fz-chalk-woman, .fz-chalk .fz-chalk-drop { visibility: hidden; }
.fz-chalk .fz-chalk-gem { opacity: 1; }
.fz-chalk .fz-chalk-word { -webkit-mask: none; mask: none; }
`;

const DESCRIPTION =
  "A chalk drawing of a young Afghan woman in a headscarf, her eyes lowered. Two tears roll down her cheek. She fades away like chalk wiped from a board, and the two tears stay, turn saffron, and become the two diamonds over the z of the word Farzana, which writes itself in beneath them.";

export function ChalkWoman() {
  const boardRef = useRef<HTMLDivElement>(null);
  const seen = useInView(boardRef, { margin: "0px 0px -25% 0px" });
  const onScreen = useInView(boardRef, { once: false, margin: "0px" });
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const phase = reduced ? "done" : seen ? "play" : "wait";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionIntro eyebrow="The two diamonds" title="Two tears, and a name." />
      <div className="mx-auto mt-12 flex w-full max-w-[480px] flex-col items-center gap-5">
        <div
          ref={boardRef}
          role="img"
          aria-label={DESCRIPTION}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-lapis"
        >
          <Board key={run} phase={phase} paused={!onScreen} />
        </div>
        {reduced ? null : (
          <button
            type="button"
            onClick={() => setRun((count) => count + 1)}
            className={buttonClass({ variant: "outline", size: "sm", className: "bg-surface" })}
          >
            <ArrowCounterClockwiseIcon weight="bold" />
            Play it again
          </button>
        )}
      </div>
    </section>
  );
}

function Board({ phase, paused }: { phase: "wait" | "play" | "done"; paused: boolean }) {
  const id = useId().replace(/[^\w-]/g, "");
  const wordRef = useRef<SVGTextElement>(null);
  const wordGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Kerning can nudge the z: once the display face has loaded, the word
    // moves so its z sits exactly under the diamonds. Moved on the element
    // itself, so nothing is re-drawn for it.
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      const text = wordRef.current;
      if (cancelled || !text) return;
      try {
        const z = text.getExtentOfChar(3);
        if (z.width > 0) {
          wordGroupRef.current?.setAttribute(
            "transform",
            `translate(${Z - (z.x + z.width / 2)} 0)`,
          );
        }
      } catch {
        // Keep the measured default.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fz-chalk absolute inset-0" data-phase={phase} data-paused={paused}>
      <style href="farzana-chalk-woman" precedence="medium">
        {STYLES}
      </style>
      <noscript>
        <style>{NO_SCRIPT_STYLES}</style>
      </noscript>
      {/* The board itself: a faint haze of old chalk, the way a used board looks. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_18%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(ellipse_at_78%_86%,rgba(255,255,255,0.04),transparent_50%)]"
      />

      {/* Her: the shading, and the lines drawn over it. Wiped away together. */}
      <div aria-hidden className="fz-chalk-woman absolute inset-0">
        <div className="fz-chalk-shade absolute inset-0" />
        <svg viewBox="0 0 400 500" className="absolute inset-0 size-full">
          <defs>
            <filter id={`${id}-chalk`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={2} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={1.6} xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feTurbulence type="fractalNoise" baseFrequency="1.3" seed={7} result="grain" />
              <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 2.2 0 0 0 -0.5" result="grainy" />
              <feComposite in="rough" in2="grainy" operator="in" />
            </filter>
          </defs>
          <g
            fill="none"
            stroke="#eef2f5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${id}-chalk)`}
          >
            {CHALK_LINES.map((line, index) => (
              <path
                key={index}
                className="fz-chalk-line"
                d={line.d}
                pathLength={1}
                strokeWidth={line.w}
                style={vars({ "--at": ms(line.at), "--ms": ms(line.ms) })}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* The dust, the tears, and the diamonds they become. */}
      <svg viewBox="0 0 400 500" aria-hidden className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.6 }} />
            <stop offset="0.45" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.2 }} />
            <stop offset="1" style={{ stopColor: "var(--color-gold)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <g fill="#eef2f5">
          {DUST.map((grain, index) => (
            <circle
              key={index}
              className="fz-chalk-dust"
              cx={grain.x}
              cy={grain.y}
              r={grain.r}
              style={vars({ "--at": ms(grain.at), "--dx": `${grain.dx}px`, "--dy": `${grain.dy}px` })}
            />
          ))}
        </g>
        <ellipse
          className="fz-chalk-glow"
          cx={Z}
          cy={PAIR_Y}
          rx={TIP * 3.4}
          ry={TIP * 2.4}
          fill={`url(#${id}-glow)`}
        />
        {TEARS.map((tear) => (
          <g key={tear.x} transform={`translate(${tear.x} ${PAIR_Y})`}>
            <g
              className="fz-chalk-roll"
              style={vars({
                "--sx": `${tear.from[0] - tear.x}px`,
                "--sy": `${tear.from[1] - PAIR_Y}px`,
                "--at": ms(tear.at),
                "--form": ms(tear.form),
                "--roll": ms(tear.roll),
              })}
            >
              <path className="fz-chalk-drop" d={TEAR_PATH} fill="#eef2f5" />
            </g>
            <g className="fz-chalk-gem">
              <rect
                className="fill-gold"
                x={-SIDE / 2}
                y={-SIDE / 2}
                width={SIDE}
                height={SIDE}
                transform="rotate(45)"
              />
            </g>
          </g>
        ))}
      </svg>

      {/* The word, written in under them. */}
      <svg viewBox="0 0 400 500" aria-hidden className="fz-chalk-word absolute inset-0 size-full">
        <g ref={wordGroupRef}>
          <text
            ref={wordRef}
            x={WORD_X}
            y={BASELINE}
            fontSize={100 * K}
            fontWeight={500}
            fill="#E6ECF1"
            className="font-display"
          >
            Farzana
          </text>
        </g>
      </svg>
    </div>
  );
}
