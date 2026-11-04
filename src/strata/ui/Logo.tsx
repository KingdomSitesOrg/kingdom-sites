import { useId, type SVGProps } from "react";
import { cn } from "./cn";

// Wordmark: stroked geometric caps on a 20-unit cap height, 4.4 stroke, butt ends.
// Arched A and bowl-built S/R keep it engineered rather than typed.
const STROKE = 4.4;
const GLYPHS: { w: number; d: string }[] = [
  { w: 18, d: "M18 2.2H6.1A3.9 3.9 0 0 0 6.1 10H11.9A3.9 3.9 0 0 1 11.9 17.8H0" },
  { w: 18, d: "M0 2.2H18M9 2.2V20" },
  { w: 17.6, d: "M2.2 20V2.2H11.5A3.9 3.9 0 0 1 11.5 10H2.2M10.2 10l7.8 10.6" },
  { w: 18.6, d: "M2.2 20V8.4A6.2 6.2 0 0 1 8.4 2.2H10.2A6.2 6.2 0 0 1 16.4 8.4V20M2.2 12.6H16.4" },
  { w: 18, d: "M0 2.2H18M9 2.2V20" },
  { w: 18.6, d: "M2.2 20V8.4A6.2 6.2 0 0 1 8.4 2.2H10.2A6.2 6.2 0 0 1 16.4 8.4V20M2.2 12.6H16.4" },
];
const TRACK = 3.8;
const WORD_W = GLYPHS.reduce((s, g) => s + g.w, 0) + TRACK * (GLYPHS.length - 1);
const GLYPH_X = GLYPHS.map((_, i) => GLYPHS.slice(0, i).reduce((s, g) => s + g.w + TRACK, 0));

// Five print layers: band 3.12, gap 1.1. The mark is a forward-leaning block of them;
// the newest (top) layer is still hot.
const BAND_H = 3.12;
const BAND_Y = [0, 4.22, 8.44, 12.66, 16.88];
const MARK: [number, number][] = [
  [4, 20],
  [3, 19],
  [2, 18],
  [1, 17],
  [0, 16],
];
const MARK_W = 20;
const MARK_GAP = 8.5;

export type LogoProps = Omit<SVGProps<SVGSVGElement>, "viewBox"> & {
  variant?: "full" | "mark" | "wordmark";
  /** Cut the wordmark into five print layers (for large, decorative uses). */
  sliced?: boolean;
  /** Accessible name. */
  title?: string;
  /** Hide from assistive tech (when visible text already names it). */
  decorative?: boolean;
};

/** STRATA logo as inline SVG. Size it with a height class (h-5, h-7...); width follows. */
export function Logo({ variant = "full", sliced, title = "STRATA", decorative, className, ...rest }: LogoProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const showMark = variant !== "wordmark";
  const showWord = variant !== "mark";
  const width = (showMark ? MARK_W : 0) + (showMark && showWord ? MARK_GAP : 0) + (showWord ? WORD_W : 0);
  const wordX = showMark ? MARK_W + MARK_GAP : 0;

  const paths = GLYPHS.map((g, i) => <path key={i} d={g.d} transform={`translate(${wordX + GLYPH_X[i]} 0)`} />);

  return (
    <svg
      viewBox={`0 0 ${width} 20`}
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : `${id}-t`}
      className={cn("h-6 w-auto max-w-full shrink-0 overflow-visible text-text-1", className)}
      {...rest}
    >
      {decorative ? null : <title id={`${id}-t`}>{title}</title>}
      <defs>
        <linearGradient id={`${id}-hot`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--molten-hot)" />
          <stop offset="0.55" stopColor="var(--molten)" />
          <stop offset="1" stopColor="var(--molten-deep)" />
        </linearGradient>
        {sliced ? (
          <mask id={`${id}-layers`} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height="20">
            {BAND_Y.map((y) => (
              <rect key={y} x="0" y={y} width={width} height={BAND_H} fill="#fff" />
            ))}
          </mask>
        ) : null}
        <clipPath id={`${id}-cap`}>
          <rect x="-1" y="0" width={width + 2} height="20" />
        </clipPath>
      </defs>
      {showMark ? (
        <g>
          <rect
            x={MARK[0][0]}
            y={BAND_Y[0] - 0.4}
            width={MARK[0][1] - MARK[0][0]}
            height={BAND_H + 0.8}
            rx={BAND_H / 2}
            fill="var(--molten)"
            opacity="0.55"
            style={{ filter: "blur(1.4px)" }}
          />
          {MARK.map(([a, b], r) => (
            <rect
              key={r}
              x={a}
              y={BAND_Y[r]}
              width={b - a}
              height={BAND_H}
              rx={BAND_H / 2}
              fill={r === 0 ? `url(#${id}-hot)` : undefined}
              opacity={r === 0 ? 1 : 1 - r * 0.13}
            />
          ))}
        </g>
      ) : null}
      {showWord ? (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          clipPath={`url(#${id}-cap)`}
          mask={sliced ? `url(#${id}-layers)` : undefined}
        >
          {paths}
        </g>
      ) : null}
    </svg>
  );
}
