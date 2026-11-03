'use client';

import { useRef, type ReactNode } from 'react';
import { facts, useChapterProgress, useChapterTimeline, useStoryTick } from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { HudCluster, HudReadout, HudValue, Leader, fixed, useHudLive } from '@/strata/hud';
import { signals } from './signals';
import { WINDOWS, inWindow, massAt, savedAt, sigmaAt } from './timeline';

type Win = 'sigma' | 'infill';
const pad3 = (v: number) => fixed(v, 0, 3);
const pad2 = (v: number) => fixed(v, 0, 2);
const FADE =
  'transition-opacity duration-240 ease-out data-[on=0]:opacity-0 data-[on=1]:opacity-100 data-[on=1]:delay-60 data-[on=1]:duration-120';
const sigmaLabel = (
  <>
    <span className="normal-case">σ</span> max
  </>
);

/** A cluster row that takes turns with its neighbour by p-window (fades like the kit: 240 ms out, 120 ms in). */
function Slot({ win, children }: { win: Win; children: ReactNode }) {
  return (
    <div data-win={win} data-on="0" className={`absolute inset-x-0 top-3 whitespace-nowrap ${FADE}`}>
      {children}
    </div>
  );
}

/** The stress legend: the heatmap ramp with its MPa scale. */
function Legend() {
  return (
    <div className="mt-2.5 w-[208px]">
      <div className="h-1.5 w-full rounded-full bg-[linear-gradient(90deg,var(--stress-lo),var(--stress-mid)_55%,var(--stress-hi))]" />
      <div className="mt-1.5 flex justify-between font-mono text-[11px] leading-none text-text-2 tabular">
        <span>0</span>
        <span>180</span>
        <span>360 MPa</span>
      </div>
      <div className="hud-label mt-2 flex justify-between text-text-2">
        <span>Low stress</span>
        <span>High stress</span>
      </div>
    </div>
  );
}

export default function Overlay() {
  const progress = useChapterProgress();
  const live = useHudLive();
  const root = useRef<HTMLDivElement>(null);
  const rows = useRef<HTMLDivElement>(null);
  const slots = useRef<HTMLElement[] | null>(null);

  // In: rises through the second half of the entry crossfade, as Ch2's copy did. Out: leaves over 0.88-0.96.
  useChapterTimeline(
    (tl) => {
      tl.from('[data-copy]', { opacity: 0, duration: 0.5 }, 0.5).from(
        '[data-reveal]',
        { opacity: 0, y: 24, duration: 0.44, stagger: 0.08, ease: 'expo.out' },
        0.4,
      );
    },
    [],
    { source: 'enter', rest: 1 },
  );
  useChapterTimeline(
    (tl) => {
      tl.to('[data-out]', { opacity: 0, duration: 0.08 }, 0.88).set({}, {}, 1);
    },
    [],
    { rest: 0.5, restInStatic: true },
  );

  // The cluster's second row (safety factor, then infill) follows p in every mode, so static stills read right.
  useStoryTick(() => {
    const el = root.current;
    if (!el) return;
    const pp = progress.current.p;
    slots.current ??= Array.from(el.querySelectorAll<HTMLElement>('[data-win]'));
    for (const n of slots.current) {
      const w = WINDOWS[n.dataset.win as Win];
      const on = pp >= w[0] && pp < w[1] ? '1' : '0';
      if (n.dataset.on !== on) n.dataset.on = on;
    }
    const r = rows.current;
    const more = inWindow(pp, WINDOWS.sigma) || inWindow(pp, WINDOWS.infill) ? '1' : '0';
    if (r && r.dataset.extra !== more) r.dataset.extra = more;
  });

  return (
    <div ref={root} className="absolute inset-0">
      <div data-out className="absolute inset-0">
        <GlassPanel
          data-copy
          className="absolute inset-x-4 top-[10svh] md:inset-x-auto md:left-[6vw] md:top-1/2 md:w-[min(34vw,520px)] md:-translate-y-1/2"
        >
          <Eyebrow data-reveal index="03">
            Optimization
          </Eyebrow>
          <h2 id="optimize-title" data-reveal className="mt-4 text-h2 text-text-1">
            Keep the strength. Lose the weight.
          </h2>
          <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
            Generative optimization strips every gram that carries no load, checks what’s left against {facts.load.forceN} N
            and a {facts.load.landingG} g landing, then fills it with a gyroid lattice. {facts.part.massG.solid} grams in,{' '}
            {facts.part.massG.optimized} out.
          </p>
        </GlassPanel>
      </div>

      <Leader
        anchors={signals.anchors}
        name="load"
        tone="resin"
        label="Load case"
        value={`${facts.load.forceN} N · ${facts.load.landingG} g`}
        dx={-64}
        dy={-36}
        window={WINDOWS.load}
        className="max-md:hidden"
      />
      <Leader anchors={signals.anchors} name="sigma" tone="neutral" dx={104} dy={-84} window={WINDOWS.sigma} className="max-md:hidden">
        <div className="flex flex-col whitespace-normal py-1">
          <HudReadout
            live
            label={sigmaLabel}
            unit="MPa"
            chars={3}
            value={<HudValue scrub={sigmaAt} format={pad3} />}
          />
          <Legend />
        </div>
      </Leader>

      <HudCluster window={WINDOWS.mass} padding="px-5 py-4" className="absolute bottom-6 right-4 md:bottom-[8svh] md:right-[4vw]">
        <div className="flex min-w-[232px] items-end gap-8">
          <HudReadout
            live
            size="md"
            label="Mass"
            unit="g"
            chars={3}
            value={<HudValue scrub={massAt} format={pad3} />}
          />
          <HudReadout
            live
            size="md"
            tone="molten"
            label="Saved"
            unit="%"
            chars={2}
            value={<HudValue scrub={savedAt} format={pad2} />}
          />
        </div>
        <div
          ref={rows}
          data-extra="0"
          className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-[extra=0]:grid-rows-[0fr] data-[extra=1]:grid-rows-[1fr]"
        >
          <div className="min-h-0 overflow-hidden">
            <div className="relative mt-4 h-[58px] border-t border-hud-line pt-3">
              <Slot win="sigma">
                <div className="flex gap-8">
                  {!live && (
                    <HudReadout
                      label={sigmaLabel}
                      unit="MPa"
                      value={<HudValue scrub={sigmaAt} format={pad3} />}
                    />
                  )}
                  <HudReadout label="Safety factor" value={fixed(facts.load.safetyFactor, 1)} />
                </div>
              </Slot>
              <Slot win="infill">
                <HudReadout
                  tone="resin"
                  label="Infill"
                  value={`GYROID ${facts.infill.pct} % · CELL ${fixed(facts.infill.cellMM, 0)} mm`}
                />
              </Slot>
            </div>
          </div>
        </div>
      </HudCluster>
    </div>
  );
}
