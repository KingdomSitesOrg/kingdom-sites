'use client';

import type { ReactNode } from 'react';
import { facts, useChapterTimeline, useStoryMode, type ChapterProgress } from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { HudCluster, HudReadout, HudValue, fixed, outOf } from '@/strata/hud';
import { TOOLPATH } from '@/strata/part/constants';
import { signals } from './signals';

const LAYERS = facts.layer.count;
const LAYER_MM = facts.layer.heightMM.toFixed(2);
const PATH_PAD = String(Math.floor(facts.layer.layer1PathMM)).length;
const CLUSTER = 'absolute bottom-6 right-4 md:bottom-[8svh] md:right-[4vw]';
const at = (p: number) => 0.1 + 0.9 * p;
const timelineSource = (pr: ChapterProgress) => (pr.p > 0 ? at(pr.p) : 0.1 * pr.enter);

// Copy leaves before the toolpaths draw: at the top-down pose layer 1 spans the copy column (STORYBOARD 3.1).
export default function Overlay() {
  const still = useStoryMode() === 'static';
  // The first tenth of the timeline is the entry wipe, so the copy arrives with the new layer; the rest is p.
  useChapterTimeline(
    (tl) => {
      tl.from('[data-copy]', { opacity: 0, duration: 0.03 }, 0.04)
        .from('[data-reveal]', { opacity: 0, y: 24, duration: 0.04, stagger: 0.006, ease: 'expo.out' }, 0.04)
        .to('[data-copy]', { opacity: 0, y: -12, duration: 0.045, ease: 'power1.in' }, at(0.52))
        .set({}, {}, 1);
    },
    [],
    { rest: at(0.3), source: timelineSource },
  );

  return (
    <div className="absolute inset-0">
      <GlassPanel
        data-copy
        className="absolute inset-x-4 top-[10svh] md:inset-x-auto md:left-[6vw] md:top-1/2 md:w-[min(34vw,520px)] md:-translate-y-1/2"
      >
        <Eyebrow data-reveal index="04">
          Slicing
        </Eyebrow>
        <h2 id="slice-title" data-reveal className="mt-4 text-h2 text-text-1">
          {LAYERS} layers. Every path planned.
        </h2>
        <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
          We slice at {LAYER_MM} mm, thinner than a human hair, and plan every path for heat, not just speed: perimeters first, gyroid infill
          second, no wasted moves.
        </p>
      </GlassPanel>

      {still ? null : (
        <HudCluster window={[0.03, 0.53]} className={CLUSTER}>
          <HudReadout label="Layers" value={String(LAYERS)} unit={`· ${LAYER_MM} mm`} />
        </HudCluster>
      )}

      <HudCluster window={[0.61, 0.975]} className={CLUSTER} padding="px-5 py-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <HudReadout label="Layer" value={outOf(signals.layer, LAYERS)} unit={`· Z ${LAYER_MM} mm`} />
          <HudReadout
            live
            label="Path"
            chars={PATH_PAD + 2}
            value={<HudValue get={() => signals.drawMM} fallback={facts.layer.layer1PathMM} format={(v) => fixed(v, 1, PATH_PAD)} />}
            unit="mm"
          />
          <HudReadout desktopOnly label="Perimeters" value={String(TOOLPATH.perimeters)} unit={`· Gyroid ${facts.infill.pct} %`} />
          <HudReadout desktopOnly label="Est. print" value={facts.fdmProof.printTimeLabel} />
        </div>
        <ul className="mt-4 flex items-center gap-5 border-t border-hud-line pt-3 max-md:hidden">
          <Legend swatch="bg-molten">Perimeter</Legend>
          <Legend swatch="bg-resin">Infill</Legend>
          <Legend swatch="travel">Travel</Legend>
        </ul>
      </HudCluster>
    </div>
  );
}

function Legend({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <li className="hud-label flex items-center gap-2 text-text-2">
      {swatch === 'travel' ? (
        <span className="h-px w-4 bg-[linear-gradient(90deg,var(--text-2)_50%,transparent_0)] bg-[length:4px_1px]" />
      ) : (
        <span className={`h-0.5 w-4 rounded-full ${swatch}`} />
      )}
      {children}
    </li>
  );
}
