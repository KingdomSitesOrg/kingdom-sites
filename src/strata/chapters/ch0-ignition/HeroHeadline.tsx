import type { CSSProperties } from 'react';
import { BEAD, writeOn, type StrokeLayout } from './strokes';

const LAYER_LIFT = 0.18;
const DOT_R = 1.55;

const dots = new Map<string, ReturnType<typeof dotKeyframes>>();
const dotFor = (layout: StrokeLayout) => {
  let d = dots.get(layout.name);
  if (!d) dots.set(layout.name, (d = dotKeyframes(`ig-${layout.name}-dot`, layout)));
  return d;
};

/** The dot's keyframes for these layouts, for a <style> outside the h1 (so its text stays the headline alone). */
export const heroDotCss = (...layouts: StrokeLayout[]) => layouts.map((l) => dotFor(l).css).join('');

/** Keyframes for the dot's offset-distance, so it pauses on strokes' timing and hurries through pen-up moves. */
function dotKeyframes(name: string, layout: StrokeLayout) {
  const w = writeOn(layout);
  const total = w.settle;
  const seen = new Set<string>();
  let frames = `0%{offset-distance:0%}`;
  for (const [t, f] of w.dot) {
    const at = ((t / total) * 100).toFixed(3);
    if (seen.has(at)) continue;
    seen.add(at);
    frames += `${at}%{offset-distance:${(f * 100).toFixed(3)}%}`;
  }
  frames += `100%{offset-distance:100%}`;
  return { css: `@keyframes ${name}{${frames}}`, travel: w.travel, timing: w.strokes };
}

/**
 * The hero headline drawn in filament (aria-hidden; the h1 carries the real text). Server-rendered and animated
 * by CSS alone: every stroke is laid three times (layers lagging 0.15 s and 0.30 s), hot when laid and cooling to
 * pearl, while a molten dot rides one combined path of strokes and pen-up moves and comes to rest on the period.
 */
export function HeroHeadline({ layout, className, style }: { layout: StrokeLayout; className?: string; style?: CSSProperties }) {
  const id = `ig-${layout.name}`;
  const dot = dotFor(layout);
  const [vx, vy, vw, vh] = layout.viewBox;
  const uses = (cls: string) => (
    <g className={cls}>
      {layout.strokes.map((s, i) => (
        <use
          key={i}
          href={`#${id}-s${i}`}
          style={
            {
              '--t': `${dot.timing[i].t}s`,
              '--d': `${dot.timing[i].d}s`,
              ...(s.kind === 'dot' ? { '--w': (2 * s.radius).toFixed(2) } : null),
            } as CSSProperties
          }
        />
      ))}
    </g>
  );

  return (
    <svg
      aria-hidden
      focusable="false"
      data-hero-svg={layout.name}
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className={`ig-svg ${className ?? ''}`}
      style={style}
    >
      <defs>
        {layout.strokes.map((s, i) =>
          s.kind === 'pen' ? (
            <path key={i} id={`${id}-s${i}`} d={s.d} pathLength={1} />
          ) : (
            <path key={i} id={`${id}-s${i}`} d={`M${s.center[0] - 0.001} ${s.center[1]}h0.002`} pathLength={1} />
          ),
        )}
        <radialGradient id={`${id}-core`}>
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.45" stopColor="var(--molten-core)" />
          <stop offset="1" stopColor="var(--molten-hot)" />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="var(--molten-hot)" stopOpacity="0.9" />
          <stop offset="0.22" stopColor="var(--molten)" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="var(--molten)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--molten)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation={BEAD.width * 0.6} />
        </filter>
      </defs>
      <g filter={`url(#${id}-blur)`}>{uses('ig-glow')}</g>
      {uses('ig-l1')}
      <g transform={`translate(0 ${-LAYER_LIFT})`}>{uses('ig-l2')}</g>
      <g transform={`translate(0 ${-2 * LAYER_LIFT})`}>{uses('ig-l3')}</g>
      <g
        className="ig-dot"
        style={{ offsetPath: `path('${dot.travel}')`, '--dot-path': `${id}-dot` } as CSSProperties}
      >
        <g className="ig-dot-core">
          <circle r={DOT_R * 5} fill={`url(#${id}-halo)`} />
          <circle r={DOT_R} fill={`url(#${id}-core)`} />
        </g>
      </g>
    </svg>
  );
}
