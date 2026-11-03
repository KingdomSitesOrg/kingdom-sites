'use client';

import { useRef } from 'react';
import { HudValue, thousands } from '@/strata/hud';
import { facts, useChapterProgress, useStoryTick } from '@/strata/story';
import { cn } from '@/strata/ui';
import { signals } from './signals';
import { STAGES, stageAt } from './stages';

type Count = keyof typeof signals.stageCount;
const VALUES: { count?: Count; unit?: string; text?: string }[] = [
  { count: 'points', unit: 'pts' },
  { count: 'edges', unit: 'edges' },
  { count: 'faces', unit: 'faces' },
  { count: 'subdFaces', unit: 'faces' },
  { text: facts.part.material },
];

/**
 * The stage tag (`02 WIREFRAME · 1,228 EDGES`) as a label over its value. All five rows share one grid cell,
 * so the chip keeps the widest row's size; only the active row is shown. `nameOnly` drops the counts
 * (static mode).
 */
export function StageTag({ nameOnly = false, className }: { nameOnly?: boolean; className?: string }) {
  const progress = useChapterProgress();
  const box = useRef<HTMLSpanElement>(null);
  const shown = useRef(-1);

  useStoryTick(() => {
    const el = box.current;
    if (!el) return;
    const i = stageAt(progress.current.p);
    if (i === shown.current) return;
    shown.current = i;
    const rows = el.children as HTMLCollectionOf<HTMLElement>;
    for (let k = 0; k < rows.length; k++) rows[k].dataset.active = k === i ? 'true' : 'false';
  });

  return (
    <span ref={box} className={cn('grid', className)}>
      {STAGES.map((s, i) => {
        const v = VALUES[i];
        return (
          <span
            key={s.label}
            data-active={i === 0 ? 'true' : 'false'}
            className="col-start-1 row-start-1 flex flex-col gap-1 opacity-0 transition-opacity duration-[240ms] data-[active=true]:opacity-100 data-[active=true]:duration-[120ms]"
          >
            <span className="flex gap-2 whitespace-nowrap">
              <span className="hud-label tabular text-resin">{String(i + 1).padStart(2, '0')}</span>
              <span className="hud-label text-text-2">{s.tag}</span>
            </span>
            {nameOnly ? null : (
              <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="hud-value text-text-1">
                  {v.count ? (
                    <HudValue get={() => signals.stageCount[v.count!]} fallback={signals.stageCount[v.count]} format={thousands} />
                  ) : (
                    v.text
                  )}
                </span>
                {v.unit ? <span className="hud-label text-text-2">{v.unit}</span> : null}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
