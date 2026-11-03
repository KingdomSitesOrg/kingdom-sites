'use client';

import { useRef } from 'react';
import { useChapter, useStoryMode, useStoryNav, useStoryTick } from '@/strata/story';
import { STAGES, stageAt, stageFill } from './stages';

/** Five real buttons that scrub the chapter to each stage. The active one carries aria-current="step". */
export function StageStrip() {
  const { index, progress } = useChapter();
  const nav = useStoryNav();
  const mode = useStoryMode();
  const list = useRef<HTMLOListElement>(null);
  const last = useRef({ stage: -1, fill: -1 });

  useStoryTick(() => {
    const ol = list.current;
    if (!ol) return;
    const p = progress.current.p;
    const i = stageAt(p);
    const fill = Math.round(stageFill(p, i) * 200) / 200;
    const l = last.current;
    if (i === l.stage && fill === l.fill) return;
    const buttons = ol.querySelectorAll<HTMLButtonElement>('button');
    if (i !== l.stage) {
      buttons.forEach((b, k) => {
        if (k === i) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
    }
    buttons.forEach((b, k) => {
      const bar = b.querySelector<HTMLElement>('[data-fill]');
      if (bar) bar.style.transform = `scaleX(${k < i ? 1 : k === i ? fill : 0})`;
    });
    l.stage = i;
    l.fill = fill;
  });

  return (
    <nav
      data-strip
      aria-label="Modelling stages"
      className="absolute bottom-[5svh] left-1/2 max-w-[calc(100vw-32px)] -translate-x-1/2"
    >
      <ol ref={list} className="glass m-0 flex list-none items-center gap-0 overflow-x-auto rounded-full p-1">
        {STAGES.map((s, i) => (
          <li key={s.label} className="flex items-center">
            {i > 0 ? <span aria-hidden className="h-px w-3 bg-hud-line" /> : null}
            <button
              type="button"
              aria-current={i === 0 ? 'step' : undefined}
              onClick={() => void nav.scrollTo(index, mode === 'static' ? s.still : s.mid)}
              className="group relative flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.12em] text-text-2 transition-colors duration-200 hover:text-text-1 aria-[current=step]:text-text-1"
            >
              <span className="tabular text-text-2 group-aria-[current=step]:text-molten">{String(i + 1).padStart(2, '0')}</span>
              <span>{s.label}</span>
              <span aria-hidden className="absolute inset-x-3.5 bottom-2 h-0.5 overflow-hidden rounded-full bg-hud-line">
                <span data-fill className="block h-full w-full origin-left bg-molten" style={{ transform: 'scaleX(0)' }} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
