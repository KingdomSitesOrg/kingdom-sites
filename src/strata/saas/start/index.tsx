import { existsSync } from 'node:fs';
import path from 'node:path';
import type { CSSProperties } from 'react';
import { Button, Container, Eyebrow, IconArrowRight, IconCheck } from '@/strata/ui';
import { facts } from '@/strata/story/facts';
import { TRIAL_DAYS } from '../pricing/plans';
import { PrintScene } from './PrintScene';
import { SILHOUETTE } from './silhouette';

const STEPS = 84;
const STILL = { desktop: '/strata/stills/object-0-desktop.webp', mobile: '/strata/stills/object-0-mobile.webp' } as const;

/** The Ch8 still takes over from the silhouette as soon as it exists in public/ (checked at render, so at build). */
const hasPublicFile = (file: string) => existsSync(path.join(process.cwd(), 'public', file));

const item = (i: number) => ({ '--i': i }) as CSSProperties;

function Silhouette() {
  const { width: w, height: h, d } = SILHOUETTE;
  const box = `0 0 ${w} ${h}`;
  return (
    <>
      <svg data-ghost aria-hidden viewBox={box} className="absolute inset-0 size-full overflow-visible">
        <path
          d={d}
          fillRule="evenodd"
          className="fill-resin stroke-resin"
          fillOpacity={0.035}
          strokeOpacity={0.5}
          strokeWidth={0.14}
          strokeDasharray="0.7 0.55"
        />
      </svg>
      <svg data-subject aria-hidden viewBox={box} className="absolute inset-0 size-full">
        <defs>
          <clipPath id="start-part">
            <path d={d} clipRule="evenodd" />
          </clipPath>
          <linearGradient id="start-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--text-1)', stopOpacity: 0.28 }} />
            <stop offset="0.45" style={{ stopColor: 'var(--text-1)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--bg-0)', stopOpacity: 0.38 }} />
          </linearGradient>
          <linearGradient id="start-heat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--molten-core)', stopOpacity: 1 }} />
            <stop offset="0.14" style={{ stopColor: 'var(--molten-hot)', stopOpacity: 0.95 }} />
            <stop offset="0.42" style={{ stopColor: 'var(--molten)', stopOpacity: 0.8 }} />
            <stop offset="0.75" style={{ stopColor: 'var(--molten-deep)', stopOpacity: 0.45 }} />
            <stop offset="1" style={{ stopColor: 'var(--molten-deep)', stopOpacity: 0 }} />
          </linearGradient>
          <pattern id="start-layers" width={w} height={h / STEPS} patternUnits="userSpaceOnUse">
            <rect y={h / STEPS - 0.08} width={w} height={0.08} className="fill-bg-0" fillOpacity={0.32} />
          </pattern>
        </defs>
        <g clipPath="url(#start-part)">
          <rect width={w} height={h} className="fill-text-2" />
          <rect width={w} height={h} fill="url(#start-shade)" />
          <rect width={w} height={h} fill="url(#start-layers)" />
          <rect data-heat width={w} height={(h / STEPS) * 6} fill="url(#start-heat)" />
        </g>
      </svg>
    </>
  );
}

function Still({ mobile }: { mobile: boolean }) {
  return (
    <div data-subject className="absolute inset-0 overflow-hidden">
      <picture>
        {mobile ? <source media="(max-width: 767px)" srcSet={STILL.mobile} /> : null}
        <img
          src={STILL.desktop}
          alt=""
          width={1600}
          height={1000}
          decoding="async"
          loading="lazy"
          className="absolute left-1/2 top-1/2 w-[150%] max-w-none -translate-x-[60%] -translate-y-1/2"
        />
      </picture>
      <div
        data-heat
        className="absolute inset-x-0 top-0 h-[7%] bg-[linear-gradient(180deg,var(--molten-core),var(--molten)_30%,transparent)] mix-blend-overlay"
      />
    </div>
  );
}

/** STORYBOARD 7.9: the last print completes, then the call to action. */
export default function Start() {
  const still = hasPublicFile(STILL.desktop);
  const stillMobile = still && hasPublicFile(STILL.mobile);
  const { count: layers, heightMM: layerMM } = facts.layer;

  return (
    <PrintScene
      steps={STEPS}
      layers={layers}
      layerMM={layerMM}
      extents={still ? null : SILHOUETTE.extents}
      width={SILHOUETTE.width}
      className="relative isolate overflow-hidden bg-bg-0"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_34%,var(--bg-2),transparent_70%)]"
      />
      <Container className="flex min-h-[100svh] flex-col items-center justify-center py-20 text-center">
        <div aria-hidden className="relative flex w-full flex-col items-center">
          <div
            data-bed-glow
            className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-[min(900px,100%)] -translate-x-1/2 translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--molten)_16%,transparent),transparent_70%)]"
          />
          <div
            className={
              still
                ? 'relative h-[clamp(220px,36svh,330px)] w-full max-w-[880px] [mask-image:radial-gradient(50%_50%_at_50%_50%,black_62%,transparent)]'
                : 'relative aspect-[88/42] h-[clamp(200px,32svh,300px)] max-w-full'
            }
          >
            {still ? <Still mobile={stillMobile} /> : <Silhouette />}
            <div
              data-scan
              className="pointer-events-none absolute -inset-x-[6%] h-[2px] translate-y-1/2 bg-molten-core shadow-[0_0_24px_2px_var(--molten)] [mask-image:linear-gradient(90deg,transparent,black_14%,black_86%,transparent)]"
            />
            <div data-nozzle className="pointer-events-none absolute size-0">
              <span className="absolute bottom-[3px] left-[-0.5px] h-5 w-px bg-[linear-gradient(0deg,var(--molten-hot),transparent)]" />
              <span className="absolute -left-[2px] -top-[2px] size-1 rounded-full bg-molten-core shadow-[0_0_6px_2px_var(--molten),0_0_18px_4px_color-mix(in_oklab,var(--molten)_55%,transparent)]" />
            </div>
          </div>
          <div className="relative mt-px h-2 w-[min(760px,100%)] border-t border-line-strong bg-[repeating-linear-gradient(90deg,var(--line-strong)_0_1px,transparent_1px_16px)] [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]" />
        </div>

        <p aria-hidden className="mt-6 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.12em] text-text-3">
          <span className="inline-flex items-center gap-2">
            Layer <span data-layer className="hud-value text-text-1">{String(layers).padStart(4, '0')}</span>
            <span className="text-text-3">/ {String(layers).padStart(4, '0')}</span>
          </span>
          <span className="text-line-strong">·</span>
          <span className="inline-flex items-center gap-2">
            Z <span data-z className="hud-value text-text-1">{(layers * layerMM).toFixed(2)}</span> mm
          </span>
          <span className="text-line-strong">·</span>
          <span className="grid">
            <span data-status="printing" className="inline-flex items-center gap-2 [grid-area:1/1] text-molten-hot">
              <span className="relative size-1.5">
                <span className="absolute inset-0 rounded-full bg-molten-hot" />
                <span className="absolute inset-0 animate-hud-pulse rounded-full bg-molten" />
              </span>
              Printing
            </span>
            <span data-status="done" className="inline-flex items-center gap-1.5 [grid-area:1/1] text-ok">
              <IconCheck size={12} strokeWidth={2.25} />
              Print complete
            </span>
          </span>
        </p>

        <div data-cta className="mt-16 flex flex-col items-center">
          <div data-cta-item style={item(0)}>
            <Eyebrow>Your first layer</Eyebrow>
          </div>
          <h2
            id="start-title"
            data-cta-item
            style={item(1)}
            className="mt-5 text-h2 text-text-1"
          >
            Print something real this week.
          </h2>
          <p data-cta-item style={item(2)} className="mt-5 text-lead text-text-2">
            Describe a part now. Hold it by Friday.
          </p>
          <div data-cta-item style={item(3)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="#pricing" size="lg" trailingIcon={<IconArrowRight />}>
              Start building
            </Button>
            <Button href="#quote" size="lg" variant="secondary">
              Get an instant quote
            </Button>
          </div>
          <p data-cta-item style={item(4)} className="mt-5 text-[13px] leading-5 text-text-3">
            No credit card. {TRIAL_DAYS} days free on Maker and Studio.
          </p>
        </div>
      </Container>
    </PrintScene>
  );
}
