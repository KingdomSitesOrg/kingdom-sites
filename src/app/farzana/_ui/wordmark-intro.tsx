"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "./cn";

/**
 * The Farzana logo writing itself, for the front page's opening only
 * (`_home/intro.tsx` decides when, once per browser session). It never loops
 * and it does not replay on its own; with reduced motion turned on it is
 * simply the finished logo.
 *
 * One timeline, in milliseconds from the moment it starts (`TIMELINE`):
 *   write      0 – 1600  a fine outline runs just ahead and the ink follows it,
 *                         left to right, with a soft edge
 *   light   1450 – 2150  a soft warm light passes once across the inked word
 *   diamond 1  1500 – 1920  drops onto the cap line with a small bounce
 *   diamond 2  1630 – 2050  the same, a beat later
 *   glow    1560 – 2080  a brief saffron glow round the pair as it lands
 * `onDrawn` fires when diamond 2 has landed, at about 2 seconds. That is
 * quicker than the brand guidelines' four-second table: the front page asked
 * for it cleaner and quicker (Oct 2026), and docs/DESIGN.md has the new one.
 *
 * Why it looks clean: the ink and the outline are separate layers, each shown
 * through its own moving soft edge (a CSS mask), so the outline is only ever
 * visible just ahead of the ink and never sits on top of half-inked letters.
 * The outline is also masked by the letters themselves, so only its outer
 * half shows: the z's overlapping strokes leave no line inside the letter.
 *
 * It waits for the display font (at most 2.5 s) before it starts, so it never
 * writes itself in a fallback font. Live text for now; the designer's outlined
 * paths replace it later.
 */

export const TIMELINE = {
  write: { at: 0, ms: 1600 },
  light: { at: 1450, ms: 700 },
  diamond1: { at: 1500, ms: 420 },
  diamond2: { at: 1630, ms: 420 },
  glow: { at: 1560, ms: 520 },
} as const;

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
/** A little room round the word, so the outline's outer edge is never cut. */
const VIEW_BOX = "2 -92 383 98";

const ms = (value: number) => `${value}ms`;
const { write, light, diamond1, diamond2, glow } = TIMELINE;

/*
 * The soft edges. Each mask image is wider than the word and slides across it
 * from right to left (`mask-position` 100% to 0%), so its edges sweep left to
 * right. Ink and outline share one image width, so they move together: the
 * ink's edge fades over a quarter of the word, and the outline shows only in
 * that fade and a little way ahead of it.
 */
const STYLES = `
.fz-intro-ink, .fz-intro-outline, .fz-intro-light {
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: 100% 0; mask-position: 100% 0;
}
.fz-intro-ink, .fz-intro-outline {
  -webkit-mask-size: 226% 100%; mask-size: 226% 100%;
}
.fz-intro-ink {
  -webkit-mask-image: linear-gradient(90deg, #000 44.25%, transparent 48.67%);
  mask-image: linear-gradient(90deg, #000 44.25%, transparent 48.67%);
}
.fz-intro-outline {
  -webkit-mask-image: linear-gradient(90deg, transparent 45.58%, #000 48.67%, #000 53.1%, transparent 55.75%);
  mask-image: linear-gradient(90deg, transparent 45.58%, #000 48.67%, #000 53.1%, transparent 55.75%);
}
.fz-intro-light {
  -webkit-mask-size: 220% 100%; mask-size: 220% 100%;
  -webkit-mask-image: linear-gradient(100deg, transparent 45.45%, #000 50%, transparent 54.55%);
  mask-image: linear-gradient(100deg, transparent 45.45%, #000 50%, transparent 54.55%);
}
.fz-intro-light text { fill: var(--fz-sheen, rgba(255, 246, 228, 0.6)); }
.fz-intro-dot {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
}
.fz-intro-glow {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
}
.fz-intro[data-phase="wait"] { visibility: hidden; }
.fz-intro[data-phase="play"] .fz-intro-ink,
.fz-intro[data-phase="play"] .fz-intro-outline {
  animation: fz-intro-sweep ${ms(write.ms)} cubic-bezier(.55,.08,.3,1) ${ms(write.at)} both;
}
.fz-intro[data-phase="play"] .fz-intro-light {
  animation: fz-intro-sweep ${ms(light.ms)} cubic-bezier(.4,0,.3,1) ${ms(light.at)} both;
}
.fz-intro[data-phase="play"] .fz-intro-dot {
  animation: fz-intro-land ${ms(diamond1.ms)} linear ${ms(diamond1.at)} both;
}
.fz-intro[data-phase="play"] .fz-intro-dot-2 { animation-delay: ${ms(diamond2.at)}; }
.fz-intro[data-phase="play"] .fz-intro-glow {
  animation: fz-intro-glow ${ms(glow.ms)} ease-out ${ms(glow.at)} both;
}
@keyframes fz-intro-sweep { to { -webkit-mask-position: 0 0; mask-position: 0 0; } }
@keyframes fz-intro-land {
  0% { opacity: 0; transform: translateY(-14px) rotate(45deg) scale(.6); animation-timing-function: cubic-bezier(.5,0,.85,.4); }
  12% { opacity: 1; }
  58% { opacity: 1; transform: translateY(1.2px) rotate(45deg) scale(1.08); animation-timing-function: cubic-bezier(.3,0,.4,1); }
  80% { opacity: 1; transform: translateY(-.6px) rotate(45deg) scale(.97); animation-timing-function: ease-in-out; }
  100% { opacity: 1; transform: rotate(45deg); }
}
@keyframes fz-intro-glow {
  0% { opacity: 0; transform: scale(.55); }
  30% { opacity: .9; }
  100% { opacity: 0; transform: scale(1.3); }
}
.fz-intro .fz-intro-dot { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) {
  .fz-intro[data-phase] .fz-intro-ink { animation: none; -webkit-mask: none; mask: none; }
  .fz-intro[data-phase] .fz-intro-outline,
  .fz-intro[data-phase] .fz-intro-light,
  .fz-intro[data-phase] .fz-intro-glow { animation: none; visibility: hidden; }
  .fz-intro[data-phase] .fz-intro-dot { animation: none; opacity: 1; }
  .fz-intro[data-phase="wait"] { visibility: visible; }
}
`;

/** Resolves once the display font has loaded, or after 2.5 s regardless. */
export function displayFontReady(): Promise<void> {
  const cap = new Promise<void>((resolve) =>
    window.setTimeout(resolve, FONT_WAIT_MS),
  );
  if (!document.fonts) return Promise.resolve();
  return Promise.race([document.fonts.ready.then(() => undefined), cap]);
}

const TEXT = {
  x: 0,
  y: 0,
  fontSize: 100,
  fontWeight: 500,
  className: "font-display",
} as const;

export function WordmarkIntro({
  play = true,
  className,
  onDrawn,
}: {
  /** False holds it unwritten until the caller is ready; it starts when this turns true. */
  play?: boolean;
  /** Width and placement. Defaults to 260–560px, following the viewport. */
  className?: string;
  /**
   * Called once the second diamond has landed. The front page uses it to hand
   * over to the top bar's own logo, which this one is drawn over.
   */
  onDrawn?: () => void;
}) {
  const id = useId().replace(/[^\w-]/g, "");
  const [fontLoaded, setFontLoaded] = useState(false);
  const textRef = useRef<SVGTextElement>(null);
  const pairRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let cancelled = false;
    displayFontReady().then(() => {
      if (cancelled) return;
      // Kerning can nudge the z; centre the pair on where it really is. Moved
      // on the element itself, so nothing is re-drawn for it.
      try {
        const z = textRef.current?.getExtentOfChar(3);
        if (z && z.width > 0) {
          pairRef.current?.setAttribute(
            "transform",
            `translate(${z.x + z.width / 2 - Z_CENTRE} 0)`,
          );
        }
      } catch {
        // Keep the measured default.
      }
      setFontLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dotY = CENTRE_Y - SIDE / 2;

  return (
    <div
      dir="ltr"
      data-phase={play && fontLoaded ? "play" : "wait"}
      className={cn(
        "fz-intro relative w-[clamp(260px,82vw,560px)] text-heading",
        className,
      )}
    >
      <style href="farzana-wordmark-intro" precedence="medium">
        {STYLES}
      </style>
      {/* The ink: the word itself. It is the one in the page's flow, so it sets the size. */}
      <svg
        viewBox={VIEW_BOX}
        aria-hidden="true"
        className="fz-intro-ink block h-auto w-full"
      >
        <text ref={textRef} {...TEXT} fill="currentColor" data-word>
          Farzana
        </text>
      </svg>
      {/* The outline running ahead of it, outer half only. */}
      <svg
        viewBox={VIEW_BOX}
        aria-hidden="true"
        className="fz-intro-outline absolute inset-0 size-full"
      >
        <mask
          id={`${id}-outer`}
          maskUnits="userSpaceOnUse"
          x={-10}
          y={-110}
          width={420}
          height={130}
        >
          <rect x={-10} y={-110} width={420} height={130} fill="#fff" />
          <text {...TEXT} fill="#000">
            Farzana
          </text>
        </mask>
        <text
          {...TEXT}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinejoin="round"
          mask={`url(#${id}-outer)`}
        >
          Farzana
        </text>
      </svg>
      {/* The light that passes over it once it is inked. */}
      <svg
        viewBox={VIEW_BOX}
        aria-hidden="true"
        className="fz-intro-light absolute inset-0 size-full"
      >
        <text {...TEXT}>Farzana</text>
      </svg>
      {/* The diamonds, and the glow they land in. */}
      <svg
        viewBox={VIEW_BOX}
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.55 }} />
            <stop offset="0.45" style={{ stopColor: "var(--color-gold)", stopOpacity: 0.18 }} />
            <stop offset="1" style={{ stopColor: "var(--color-gold)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <g ref={pairRef}>
          <ellipse
            className="fz-intro-glow"
            cx={Z_CENTRE}
            cy={CENTRE_Y}
            rx={TIP_TO_TIP * 3.2}
            ry={TIP_TO_TIP * 2.2}
            fill={`url(#${id}-glow)`}
          />
          <rect
            className="fz-intro-dot fill-gold"
            x={Z_CENTRE - HALF_SPACING - SIDE / 2}
            y={dotY}
            width={SIDE}
            height={SIDE}
          />
          <rect
            onAnimationEnd={(event) => {
              if (event.animationName === "fz-intro-land") onDrawn?.();
            }}
            className="fz-intro-dot fz-intro-dot-2 fill-gold"
            x={Z_CENTRE + HALF_SPACING - SIDE / 2}
            y={dotY}
            width={SIDE}
            height={SIDE}
          />
        </g>
      </svg>
    </div>
  );
}
