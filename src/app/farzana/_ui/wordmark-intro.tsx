"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "./cn";

/**
 * The Farzana logo writing itself, for the public home hero only: the outline
 * draws left to right while a reveal sweeps across, the letters ink in, then
 * the two diamonds pop over the z. About four seconds, once per browser
 * session. Tapping it plays it again; it never loops on its own. With reduced
 * motion turned on it is simply the finished logo.
 *
 * Timings and easings are the brand guidelines' table ("Logo animation"):
 *   write      0.3 s + 3.0 s  cubic-bezier(.45,.05,.35,1)
 *   ink        2.7 s + 1.0 s  ease
 *   diamond 1  3.4 s + 0.45 s cubic-bezier(.3,1.6,.5,1)
 *   diamond 2  3.55 s + 0.45 s same
 *
 * It waits for the display font (at most 2.5 s) before it starts, so it never
 * writes itself in a fallback font. The family is read off the text itself, so
 * whatever name the font loader gave Reem Kufi is the one it waits for.
 *
 * Live text for now; the designer's outlined paths replace it later.
 */

const SESSION_KEY = "farzana:wordmark-intro-played";
const FONT_WAIT_MS = 2500;

/*
 * Geometry in drawing units, at a 100-unit text size with the baseline at 0.
 * Reem Kufi's own measurements: cap height 72.9, "Far" 158.4 wide, z 48.9 wide.
 * Same rules as `Wordmark`: side 11% of the cap height, the gap between tips
 * half a diamond's width, lower tips on the cap line, centred on the z.
 */
const CAP = 72.9;
const SIDE = CAP * 0.11;
const TIP_TO_TIP = SIDE * Math.SQRT2;
const CENTRE_Y = -(CAP + TIP_TO_TIP / 2);
const HALF_SPACING = (TIP_TO_TIP + TIP_TO_TIP / 2) / 2;
const Z_CENTRE = 158.4 + 48.9 / 2;

const STYLES = `
.fz-intro-word { clip-path: inset(0 100% 0 0); }
.fz-intro-text {
  fill-opacity: 0;
  stroke-width: 0.8;
  stroke-linejoin: round;
  stroke-dasharray: 1100;
  stroke-dashoffset: 1100;
}
.fz-intro-dot {
  transform-box: fill-box;
  transform-origin: center;
  transform: scale(0) rotate(45deg);
}
.fz-intro[data-phase="play"] .fz-intro-word {
  animation: fz-intro-write 3s cubic-bezier(.45,.05,.35,1) .3s forwards;
}
.fz-intro[data-phase="play"] .fz-intro-text {
  animation:
    fz-intro-draw 3s cubic-bezier(.45,.05,.35,1) .3s forwards,
    fz-intro-ink 1s ease 2.7s forwards;
}
.fz-intro[data-phase="play"] .fz-intro-dot {
  animation: fz-intro-pop .45s cubic-bezier(.3,1.6,.5,1) 3.4s forwards;
}
.fz-intro[data-phase="play"] .fz-intro-dot-2 { animation-delay: 3.55s; }
@keyframes fz-intro-write { to { clip-path: inset(0 0% 0 0); } }
@keyframes fz-intro-draw { to { stroke-dashoffset: 0; } }
@keyframes fz-intro-ink { to { fill-opacity: 1; stroke-width: 0; } }
@keyframes fz-intro-pop { to { transform: scale(1) rotate(45deg); } }
.fz-intro[data-phase="done"] .fz-intro-word { clip-path: none; }
.fz-intro[data-phase="done"] .fz-intro-text { fill-opacity: 1; stroke-width: 0; }
.fz-intro[data-phase="done"] .fz-intro-dot { transform: scale(1) rotate(45deg); }
@media (prefers-reduced-motion: reduce) {
  .fz-intro .fz-intro-word { clip-path: none; animation: none; }
  .fz-intro .fz-intro-text { fill-opacity: 1; stroke-width: 0; animation: none; }
  .fz-intro .fz-intro-dot { transform: scale(1) rotate(45deg); animation: none; }
}
`;

/** Without JavaScript nothing would start it, so the finished logo shows. */
const NO_SCRIPT_STYLES = `
.fz-intro .fz-intro-word { clip-path: none; }
.fz-intro .fz-intro-text { fill-opacity: 1; stroke-width: 0; }
.fz-intro .fz-intro-dot { transform: scale(1) rotate(45deg); }
`;

type Phase = "waiting" | "play" | "done";

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function playedThisSession() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage blocked (a private window, say): it plays again next visit.
  }
}

/** Resolves once the text's own font has loaded, or after 2.5 s regardless. */
function fontReady(text: SVGTextElement): Promise<void> {
  const cap = new Promise<void>((resolve) =>
    window.setTimeout(resolve, FONT_WAIT_MS),
  );
  if (!document.fonts) return Promise.resolve();
  const family = window.getComputedStyle(text).fontFamily;
  const load = document.fonts
    .load(`500 1em ${family}`, "Farzana")
    .then(() => undefined)
    .catch(() => undefined);
  return Promise.race([load, cap]);
}

export function WordmarkIntro({
  tagline = false,
  className,
  onFinish,
}: {
  /** Shows "Intelligent, or learned, in Persian" centred below the logo. It does not animate. */
  tagline?: boolean;
  /** Width and placement. Defaults to 260–560px, following the viewport. */
  className?: string;
  /**
   * Called once the second diamond has landed, when the logo has played.
   * The front page uses it to hand over to the top bar's own logo, which this
   * one is drawn over while it writes itself.
   */
  onFinish?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [run, setRun] = useState(0);
  const [zCentre, setZCentre] = useState(Z_CENTRE);
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    let cancelled = false;
    const finished = reducedMotion() || playedThisSession();
    // Settled straight away, but after this effect rather than inside it.
    if (finished) {
      Promise.resolve().then(() => {
        if (!cancelled) setPhase("done");
      });
    }

    fontReady(text).then(() => {
      if (cancelled) return;
      // Kerning can nudge the z; centre the diamonds on where it really is.
      try {
        const z = text.getExtentOfChar(3);
        if (z.width > 0) setZCentre(z.x + z.width / 2);
      } catch {
        // Keep the measured default.
      }
      if (!finished) {
        setPhase("play");
        rememberPlayed();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function replay() {
    if (phase === "waiting" || reducedMotion()) return;
    // A fresh drawing restarts every animation from the top.
    setRun((count) => count + 1);
    setPhase("play");
  }

  const dotY = CENTRE_Y - SIDE / 2;

  return (
    <div
      dir="ltr"
      className={cn(
        "inline-flex w-[clamp(260px,82vw,560px)] flex-col items-center",
        className,
      )}
    >
      <style href="farzana-wordmark-intro" precedence="medium">
        {STYLES}
      </style>
      <noscript>
        <style>{NO_SCRIPT_STYLES}</style>
      </noscript>
      <button
        type="button"
        onClick={replay}
        aria-label="Farzana. Tap to replay the logo animation."
        data-phase={phase}
        className="fz-intro block min-h-11 w-full min-w-11 cursor-pointer rounded-md p-2 transition-colors hover:bg-wash"
      >
        <svg
          key={run}
          viewBox="6 -88 375 92"
          aria-hidden="true"
          className="block h-auto w-full overflow-visible text-heading"
        >
          <g className="fz-intro-word">
            <text
              ref={textRef}
              x={0}
              y={0}
              fontSize={100}
              fontWeight={500}
              fill="currentColor"
              stroke="currentColor"
              className="fz-intro-text font-display"
            >
              Farzana
            </text>
          </g>
          <rect
            className="fz-intro-dot fill-gold"
            x={zCentre - HALF_SPACING - SIDE / 2}
            y={dotY}
            width={SIDE}
            height={SIDE}
          />
          <rect
            onAnimationEnd={(event) => {
              if (event.animationName === "fz-intro-pop") onFinish?.();
            }}
            className="fz-intro-dot fz-intro-dot-2 fill-gold"
            x={zCentre + HALF_SPACING - SIDE / 2}
            y={dotY}
            width={SIDE}
            height={SIDE}
          />
        </svg>
      </button>
      {tagline ? (
        <p className="mt-1 text-center font-display text-[1.0625rem] font-normal text-muted">
          Intelligent, or learned, in Persian
        </p>
      ) : null}
    </div>
  );
}
