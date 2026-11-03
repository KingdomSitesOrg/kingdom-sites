'use client';

import { BBoxBrackets, Leader } from '@/strata/hud';
import { facts, useChapterTimeline } from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { signals } from './signals';
import { StageStrip } from './StageStrip';
import { StageTag } from './StageTag';

const mm = (v: number) => `${v.toFixed(1)} mm`;
// HUD p-windows. The brackets stay on through the entry crossfade (p holds at 0 there), so they never drop out
// across the 1-2 seam; the stage tag locks on once the shot settles. Both leave before the exit crossfade.
const BBOX_WINDOW = [0, 0.94] as const;
const HUD_WINDOW = [0.02, 0.94] as const;

export default function Overlay() {
  // In: rises through the second half of the entry crossfade. Out: copy and strip leave over 0.88-0.96.
  useChapterTimeline(
    (tl) => {
      tl.from('[data-in]', { opacity: 0, duration: 0.5 }, 0.5).from(
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

  return (
    <div className="absolute inset-0">
      <div data-out className="absolute inset-0">
        <GlassPanel
          data-in
          className="absolute inset-x-4 top-[10svh] md:inset-x-auto md:left-[6vw] md:top-1/2 md:w-[min(34vw,520px)] md:-translate-y-1/2"
        >
          <Eyebrow data-reveal index="02">
            The model
          </Eyebrow>
          <h2 id="model-title" data-reveal className="mt-4 text-h2 text-text-1">
            From points to a part.
          </h2>
          <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
            Points become edges, edges become faces, faces become a watertight solid you can measure and edit. Scrub
            back and forth: every stage stays inspectable, and every model exports as STEP.
          </p>
        </GlassPanel>
        <div data-in className="pointer-events-none absolute inset-0 *:pointer-events-auto">
          <StageStrip />
        </div>
        <div
          aria-hidden
          className="glass absolute right-[4vw] top-[14svh] hidden rounded-xs px-3 py-2 [[data-mode=static]_&]:block"
        >
          <StageTag nameOnly />
        </div>
      </div>
      <BBoxBrackets
        bbox={signals.bbox}
        width={mm(facts.part.envelopeMM.x)}
        height={mm(facts.part.envelopeMM.y)}
        window={BBOX_WINDOW}
        className="max-md:hidden"
      />
      <Leader anchors={signals.anchors} name="collar" tone="resin" dx={52} dy={-52} mobile={{ dx: -48, dy: 48 }} window={HUD_WINDOW}>
        <StageTag />
      </Leader>
    </div>
  );
}
