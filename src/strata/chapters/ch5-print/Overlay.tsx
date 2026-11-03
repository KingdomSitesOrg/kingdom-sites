'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  facts,
  range,
  useChapter,
  useChapterProgress,
  useChapterTimeline,
  useReducedMotion,
  useStoryMode,
  useStoryTick,
} from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { HudCluster, HudReadout, HudValue, Leader, clock, fixed } from '@/strata/hud';
import { plot, signals } from './signals';
import { BEAT, LAYER_COUNT, layerNumber, timeLeftAt, zAt } from './timeline';

const PLATE = `FDM CELL 07 · ${facts.plants[0].toUpperCase()}`;
const COMPLETE = `${facts.fdmProof.printTimeLabel} · ${facts.fdmProof.material}`;

/** The still a static page shows at p (STORYBOARD Ch5 stills), so static readouts match their image. */
function stillP(stills: number[], p: number) {
  let best = stills[0];
  for (const s of stills) if (Math.abs(s - p) < Math.abs(best - p)) best = s;
  return best;
}

function XYPlot() {
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const seen = useRef({ version: -1, id: -1, x: -1, y: -1 });
  const progress = useChapterProgress();
  useStoryTick(() => {
    if (!progress.current.visible) return;
    const s = seen.current;
    if (plot.version !== s.version || signals.layerPathId !== s.id) {
      s.version = plot.version;
      s.id = signals.layerPathId;
      path.current?.setAttribute('d', plot.paths[s.id] ?? '');
      if (box.current) box.current.style.opacity = plot.paths.length ? '1' : '0';
    }
    const x = Math.round(signals.plotX * 920) / 10;
    const y = Math.round(signals.plotY * 440) / 10;
    if (x !== s.x || y !== s.y) {
      s.x = x;
      s.y = y;
      dot.current?.setAttribute('transform', `translate(${x} ${y})`);
    }
  });
  return (
    <div ref={box} className="hidden md:block" style={{ opacity: 0 }}>
      <svg viewBox="-2 -2 96 48" width="120" height="62" aria-hidden className="block overflow-visible">
        <rect x="-2" y="-2" width="96" height="48" fill="none" stroke="var(--hud-line)" strokeDasharray="1 3" />
        <path
          ref={path}
          fill="none"
          stroke="var(--text-2)"
          strokeOpacity="0.55"
          strokeWidth="0.35"
          strokeLinejoin="round"
        />
        <g ref={dot}>
          <circle r="2.6" fill="var(--molten)" fillOpacity="0.25" />
          <circle r="1.1" fill="var(--molten-hot)" />
        </g>
      </svg>
    </div>
  );
}

/** HUD opacities at p (STORYBOARD Ch5 HUD): plate and LAYER from 0.06, TIME LEFT from 0.25, both collapse into PRINT COMPLETE at 0.86. */
function hudAt(p: number, out: { plate: number; layer: number; time: number; done: number }) {
  const close = range(p, BEAT.close, BEAT.close + 0.025);
  out.plate = range(p, BEAT.hold, BEAT.hold + 0.02);
  out.layer = out.plate * (1 - close);
  out.time = range(p, BEAT.macro, BEAT.macro + 0.02) * (1 - close);
  out.done = close;
}

/**
 * The readouts follow p in every mode. Under reduced motion and in static mode they step with the still on screen
 * (opacity only), so each still shows its own readouts and still 3 shows PRINT COMPLETE.
 */
function useHud(hudP: (p: number) => number, reduced: boolean) {
  const progress = useChapterProgress();
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<{ plate: HTMLElement; layer: HTMLElement; time: HTMLElement; done: HTMLElement } | null>(null);
  const state = useRef({ plate: -1, layer: -1, time: -1, done: -1 });
  const next = useRef({ plate: 0, layer: 0, time: 0, done: 0 });
  const apply = () => {
    const e = els.current;
    if (!e) return;
    const n = next.current;
    const s = state.current;
    hudAt(hudP(progress.current.p), n);
    if (n.plate !== s.plate) e.plate.style.opacity = String((s.plate = n.plate));
    if (n.layer !== s.layer) e.layer.style.opacity = String((s.layer = n.layer));
    if (n.time !== s.time) e.time.style.opacity = String((s.time = n.time));
    if (n.done !== s.done) {
      e.done.style.opacity = String((s.done = n.done));
      e.done.style.transform = reduced ? '' : `translateY(${(8 * (1 - n.done)).toFixed(2)}px)`;
    }
  };
  useLayoutEffect(() => {
    const q = (k: string) => root.current?.querySelector<HTMLElement>(`[data-hud="${k}"]`) ?? null;
    const plate = q('plate'),
      layer = q('layer'),
      time = q('time'),
      done = q('done');
    els.current = plate && layer && time && done ? { plate, layer, time, done } : null;
    state.current = { plate: -1, layer: -1, time: -1, done: -1 };
    apply();
  });
  useStoryTick(apply);
  return root;
}

export default function Overlay() {
  const { def } = useChapter();
  const mode = useStoryMode();
  const reduced = useReducedMotion();
  const hudP = (p: number) => (mode === 'static' ? stillP(def.stills, p) : p);
  const root = useHud(hudP, reduced);

  // The copy holds the right-hand column the whole chapter: clear of the layer-1 islands and the macro subject at
  // the start, and of the machine (framed left) when it returns. It comes back opaque first, then the lines rise.
  useChapterTimeline(
    (tl) => {
      tl.to('[data-copy]', { opacity: 0, duration: 0.06 }, 0.1)
        .fromTo('[data-copy]', { opacity: 0 }, { opacity: 1, duration: 0.012, immediateRender: false }, 0.876)
        .from(
          '[data-copy] [data-reveal]',
          {
            y: 24,
            opacity: 0,
            duration: 0.05,
            stagger: 0.01,
            ease: 'expo.out',
            immediateRender: false,
          },
          0.88,
        )
        .set({}, {}, 1);
    },
    [],
    { rest: 0.04 },
  );
  // 5 -> 6 wipe: the readouts leave before the seam reaches them; the copy rides out on its own layer.
  useChapterTimeline((tl) => void tl.to('[data-exit]', { opacity: 0, duration: 0.2 }, 0).set({}, {}, 1), [], {
    source: 'exit',
    rest: 0,
  });

  return (
    <div ref={root} data-ch5 className="absolute inset-0">
      <GlassPanel
        data-copy
        className="absolute inset-x-4 top-[10svh] md:inset-x-auto md:right-[6vw] md:top-1/2 md:w-[min(34vw,520px)] md:-translate-y-1/2"
      >
        <Eyebrow data-reveal index="05">
          Printing
        </Eyebrow>
        <h2 id="print-title" data-reveal className="mt-4 text-h2 text-text-1">
          Proof by lunch.
        </h2>
        <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
          Before we commit titanium, a carbon-nylon proof prints on the exact toolpaths you just saw: 840 layers in
          under three hours. Hold it, fit it, break it. Then the metal run starts.
        </p>
      </GlassPanel>

      <div data-exit aria-hidden className="absolute bottom-6 left-4 md:bottom-[7svh] md:left-[6vw]">
        <p data-hud="plate" className="hud-label mb-2 text-text-2" style={{ opacity: 0 }}>
          {PLATE}
        </p>
        <div className="grid">
          <div data-hud="layer" className="[grid-area:1/1]" style={{ opacity: 0 }}>
            <HudCluster>
              <div className="flex gap-7">
                <HudReadout
                  live
                  label="Layer"
                  value={
                    <HudValue scrub={(p) => layerNumber(hudP(p))} format={(v) => fixed(v, 0, 4)} />
                  }
                  unit={`/ ${fixed(LAYER_COUNT, 0, 4)}`}
                />
                <HudReadout
                  size="sm"
                  label="Z"
                  value={<HudValue scrub={(p) => zAt(hudP(p))} format={(v) => fixed(v, 2)} />}
                  unit="mm"
                />
              </div>
            </HudCluster>
          </div>
          <div data-hud="done" className="self-end [grid-area:1/1]" style={{ opacity: 0 }}>
            <HudCluster>
              <div className="flex flex-col gap-1.5">
                <p className="hud-label m-0 flex items-center gap-2.5 text-ok">
                  <span className="size-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" />
                  Print complete
                </p>
                <p className="m-0 font-mono text-[13px] font-medium leading-none text-text-1 tabular">{COMPLETE}</p>
              </div>
            </HudCluster>
          </div>
        </div>
      </div>

      <div
        data-hud="time"
        aria-hidden
        className="absolute bottom-6 right-4 md:bottom-[7svh] md:right-[4vw]"
        style={{ opacity: 0 }}
      >
        <HudCluster>
          <div className="flex items-end gap-6">
            <XYPlot />
            <HudReadout
              live
              align="right"
              label="Time left"
              value={<HudValue scrub={(p) => timeLeftAt(hudP(p))} format={clock} />}
            />
          </div>
        </HudCluster>
      </div>

      <Leader
        anchors={signals.anchors}
        name="tip"
        window={[0.06, 0.85]}
        dx={150}
        dy={-170}
        label="Nozzle"
        value={
          <>
            <HudValue get={() => signals.temp} fallback={facts.fdmProof.nozzleC} format={(v) => fixed(v, 1)} /> °C
          </>
        }
      />
    </div>
  );
}
