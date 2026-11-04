'use client';

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { facts, useChapterProgress, useChapterTimeline, useStoryMode, useStoryTick, useViewport } from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { HudCluster, HudValue, LiveDot, thousands, type PWindow } from '@/strata/hud';
import { partsAt } from './fleet';
import { signals } from './signals';

const STILLS = [0.06, 0.4, 0.84];
const printers = thousands(facts.fleet.printers);
const plants = facts.plants.join(' · ');

/** Counters step with fixed-width fields: 1,248 while there are thousands, then 0421 ... 0001. */
const activeText = (v: number) => (v >= 1000 ? thousands(v) : String(Math.max(0, Math.round(v))).padStart(4, '0'));

function nearestStill(p: number) {
  let best = STILLS[0];
  for (const s of STILLS) if (Math.abs(s - p) < Math.abs(best - p)) best = s;
  return best;
}

const valueClass =
  'font-display text-[clamp(32px,4vw,56px)] font-medium leading-none tracking-[-0.025em] text-text-1 tabular';

/** One large fleet counter in its own cluster, entering on its own p-window (STORYBOARD 3.7, Ch7 HUD). */
function Counter({ label, live, window, className, children }: { label: string; live?: boolean; window: PWindow; className?: string; children: ReactNode }) {
  return (
    <HudCluster window={window} padding="px-6 pb-6 pt-5 md:px-7" className={className}>
      <div data-hud-readout className="flex min-w-0 flex-col gap-3">
        <span className="hud-label flex items-center gap-2 whitespace-nowrap text-text-2">
          {live && <LiveDot />}
          {label}
        </span>
        {children}
      </div>
    </HudCluster>
  );
}

export default function Overlay() {
  const mode = useStoryMode();
  const isStatic = mode === 'static';
  const { width } = useViewport();
  const lead = useRef<SVGSVGElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const box = useRef({ x: 0, y: 0, h: 0 });
  const progress = useChapterProgress();

  // Copy timing (STORYBOARD 3.6): in by 0.10 / 0.14, out before lights-out so only the last counter is left.
  useChapterTimeline((tl) => void tl.to('[data-copy]', { opacity: 0, duration: 0.06 }, 0.84).set({}, {}, 1), [], {
    rest: 0.5,
  });
  // 6 -> 7 is a crossfade on one cabinet: the copy rises over the second half of it, so the window never
  // stands alone on an empty frame and no headline overlaps Ch6's (gone by its p 0.96).
  useChapterTimeline(
    (tl) => {
      tl.from('[data-enter]', { opacity: 0, duration: 0.3 }, 0.55)
        .from('[data-reveal]', { opacity: 0, y: 24, duration: 0.3, stagger: 0.06, ease: 'expo.out' }, 0.6)
        .set({}, {}, 1);
    },
    [],
    { source: 'enter', rest: 1 },
  );
  // 7 -> 8 is a cut through darkness: the last readout goes out with the last window (exit 0-0.5).
  useChapterTimeline(
    (tl) => {
      tl.to('[data-exit]', { opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.05).set({}, {}, 1);
    },
    [],
    { source: 'exit', rest: 0 },
  );

  useLayoutEffect(() => {
    const measure = () => {
      const el = anchor.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const tile = (el.closest('[data-hud-cluster]') ?? el).getBoundingClientRect();
      const host = el.closest('[data-overlay]')?.getBoundingClientRect();
      box.current.x = tile.right - (host?.left ?? 0);
      box.current.y = r.top - (host?.top ?? 0) + r.height * 0.5;
      box.current.h = host?.height ?? window.innerHeight;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [width]);

  // The last lit window keeps a leader to ACTIVE MACHINES 0001: a 3 px dot, a 1 px line, one 45° elbow. Through
  // the exit the overlay scrolls up while the window stays put, so the dot is held on the window until both fade.
  const last = useRef('');
  useStoryTick(
    () => {
      const svg = lead.current;
      if (!svg) return;
      const k = isStatic || width < 768 ? 0 : signals.heroLead;
      if (k <= 0.001) {
        if (last.current !== '') {
          last.current = '';
          svg.style.opacity = '0';
        }
        return;
      }
      const hx = Math.round(signals.heroX);
      const hy = Math.round(signals.heroY + progress.current.exit * box.current.h);
      const ax = Math.round(box.current.x);
      const ay = Math.round(box.current.y);
      const ex = hx - Math.abs(ay - hy);
      const d = `M${hx} ${hy} L${ex} ${ay} L${ax} ${ay}`;
      const key = `${d}|${k.toFixed(2)}`;
      if (key === last.current) return;
      last.current = key;
      svg.style.opacity = k.toFixed(3);
      svg.querySelector('path')!.setAttribute('d', d);
      const dot = svg.querySelector('circle')!;
      dot.setAttribute('cx', String(hx));
      dot.setAttribute('cy', String(hy));
    },
    { after: 'render' },
  );

  const partsGet = () => signals.partsToday;
  const partsStill = (p: number) => partsAt(nearestStill(p));
  const activeGet = () => signals.active;

  return (
    <div className="absolute inset-0">
      <div data-enter className="pointer-events-none absolute inset-0">
        <GlassPanel
          data-copy
          className="pointer-events-auto absolute inset-x-4 top-[10svh] md:inset-x-auto md:left-[6vw] md:top-[13svh] md:w-[min(34vw,520px)]"
        >
          <Eyebrow data-reveal index="07">
            The fleet
          </Eyebrow>
          <h2 id="fleet-title" tabIndex={-1} data-reveal className="mt-4 text-h2 text-text-1">
            {printers} printers. One queue.
          </h2>
          <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
            Three plants in {facts.plants[0]}, {facts.plants[1]} and {facts.plants[2]} run as one machine. Your job goes to
            the first cell that can hold its tolerance, and you can watch it layer by layer.
          </p>
          <p className="sr-only">
            Today: {thousands(facts.partsTodayBase)} parts printed and counting, {thousands(facts.fleet.active)} of {printers}{' '}
            machines active, {facts.turnaroundDays} days average turnaround.
          </p>
        </GlassPanel>
      </div>

      <div data-exit aria-hidden className="pointer-events-none absolute inset-0">
        <svg ref={lead} className="absolute inset-0 h-full w-full opacity-0" fill="none">
          <path stroke="var(--hud-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle r="3" fill="var(--molten-hot)" />
        </svg>

        {/* Four clusters at once: the solid panel material, so the compositor is not re-blurring them every frame. */}
        <div
          className="absolute inset-x-4 bottom-6 flex flex-col items-start gap-2 md:inset-x-auto md:bottom-[7svh] md:left-[6vw]"
          style={{ '--panel-bg': 'var(--panel-bg-solid)', '--panel-filter': 'none' } as CSSProperties}
        >
          <div className="flex items-stretch gap-2">
            <Counter label="Parts printed today" live window={[0.15, 0.88]}>
              <span className={valueClass}>
                <HudValue
                  get={partsGet}
                  scrub={isStatic ? partsStill : undefined}
                  fallback={partsAt(STILLS[1])}
                  format={thousands}
                  throttle={67}
                />
              </span>
            </Counter>
            <Counter label="Active machines" live window={[0.22, 1]}>
              <span ref={anchor} className="flex items-baseline gap-2">
                <span className={valueClass}>
                  <HudValue get={activeGet} fallback={facts.fleet.active} format={activeText} throttle={67} />
                </span>
                <span className="whitespace-nowrap font-mono text-[13px] text-text-2 tabular">/ {printers}</span>
              </span>
            </Counter>
            <Counter label="Avg turnaround" window={[0.29, 0.88]} className="max-md:hidden">
              <span className="flex items-baseline gap-2">
                <span className={valueClass}>{facts.turnaroundDays}</span>
                <span className="font-mono text-[13px] text-text-2">days</span>
              </span>
            </Counter>
          </div>
          <HudCluster window={[0.29, 0.88]} padding="px-4 py-2" className="max-md:hidden">
            <p className="hud-label whitespace-nowrap text-text-2">
              {facts.plants.length} plants · {plants}
            </p>
          </HudCluster>
        </div>
      </div>
    </div>
  );
}
