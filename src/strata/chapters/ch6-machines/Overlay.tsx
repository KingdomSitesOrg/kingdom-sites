'use client';

import { useRef, type ReactNode } from 'react';
import { facts, useChapter, useChapterTimeline, useStoryNav, useStoryTick } from '@/strata/story';
import { Eyebrow, GlassPanel } from '@/strata/ui';
import { HudCluster, HudReadout, HudValue, fixed, outOf, thousands } from '@/strata/hud';
import { signals } from './signals';
import { CELL_JUMP, CELL_SWAP, cellAt, lpbfPartTemp, lpbfQA, range, slaLayer } from './timeline';

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const micron = Math.round(facts.sla.layerMM * 1000);

const CELLS = [
  {
    key: 'SLA',
    title: 'Resin SLA',
    line: `Cured by light, ${micron} microns at a time.`,
    plate: 'SLA CELL 12 · OSAKA',
    show: 'group-data-[cell=0]/ch6:opacity-100',
  },
  {
    key: 'SLS',
    title: 'Nylon SLS',
    line: `${WORDS[facts.sls.nestedParts] ?? facts.sls.nestedParts} parts nested in one powder cake. No supports.`,
    plate: 'SLS CELL 03 · AUSTIN',
    show: 'group-data-[cell=1]/ch6:opacity-100',
  },
  {
    key: 'LPBF',
    title: 'Metal LPBF',
    line: `Melted at ${thousands(facts.lpbf.meltPoolC)} °C. Cooled to flight grade.`,
    plate: 'LPBF CELL 21 · ROTTERDAM',
    show: 'group-data-[cell=2]/ch6:opacity-100',
  },
] as const;

const layerOf = (n: number) => outOf(n, facts.layer.count);
/** Each cell's HUD draws in at its own p-window; the h3 and cluster swap at the truck midpoints. */
const HUD_WINDOWS: [number, number][] = [
  [0.02, CELL_SWAP[0]],
  [CELL_SWAP[0], CELL_SWAP[1]],
  [CELL_SWAP[1], 0.94],
];

export default function Overlay() {
  const { index, progress } = useChapter();
  const nav = useStoryNav();
  const root = useRef<HTMLDivElement>(null);
  const last = useRef({ cell: -1, qa: -1, bar: -1 });

  useChapterTimeline(
    (tl) => {
      tl.from('[data-copy], [data-hud], [data-index]', { opacity: 0, duration: 0.05 }, 0)
        .from('[data-reveal]', { opacity: 0, y: 24, duration: 0.08, stagger: 0.02, ease: 'expo.out' }, 0)
        .to('[data-copy], [data-hud], [data-index]', { opacity: 0, duration: 0.04 }, 0.88)
        .set({}, {}, 1);
    },
    [],
    { rest: 0.5 },
  );

  // Cell swaps are scroll thresholds: write data attributes on change, never React state.
  useStoryTick(() => {
    const el = root.current;
    if (!el) return;
    const p = progress.current.p;
    const s = last.current;
    const cell = cellAt(p);
    if (cell !== s.cell) {
      s.cell = cell;
      el.dataset.cell = String(cell);
      el.querySelectorAll<HTMLButtonElement>('[data-cellbtn]').forEach((b, i) => {
        if (i === cell) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
    }
    const qa = lpbfQA(p) ? 1 : 0;
    if (qa !== s.qa) {
      s.qa = qa;
      el.dataset.qa = String(qa);
    }
    const local = cell === 0 ? range(p, 0, 0.28) : cell === 1 ? range(p, 0.34, 0.6) : range(p, 0.66, 1);
    const bar = Math.round(local * 200) / 200;
    if (bar !== s.bar) {
      s.bar = bar;
      el.style.setProperty('--cell-progress', String(bar));
    }
  });

  return (
    <div ref={root} data-cell="0" data-qa="0" className="group/ch6 absolute inset-0">
      <GlassPanel
        data-copy
        className="absolute inset-x-4 top-[10svh] md:inset-x-auto md:left-[6vw] md:top-1/2 md:w-[min(34vw,520px)] md:-translate-y-1/2"
      >
        <Eyebrow data-reveal index="06">
          Every process
        </Eyebrow>
        <h2 id="machines-title" data-reveal className="mt-4 text-h2 text-text-1">
          The right machine for every part.
        </h2>
        <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
          Resin for optics and surgical guides. Sintered nylon for production runs. Laser-fused titanium for parts
          that fly. One order, routed to the process that fits.
        </p>
        <div data-reveal className="mt-7 grid border-t border-line pt-6">
          {CELLS.map((c) => (
            <div key={c.key} className={`opacity-0 transition-opacity duration-[240ms] [grid-area:1/1] ${c.show}`}>
              <h3 className="text-h3 text-text-1">{c.title}</h3>
              <p className="mt-1.5 text-[15px] leading-[22px] text-text-2">{c.line}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      <div
        data-index
        role="group"
        aria-label="Jump to a process"
        className="glass absolute right-4 top-[9svh] flex gap-1 rounded-full p-1 focus-within:opacity-100! md:right-[4vw]"
      >
        {CELLS.map((c, i) => (
          <button
            key={c.key}
            type="button"
            data-cellbtn
            aria-current={i === 0 ? 'step' : undefined}
            aria-label={c.title}
            onClick={() => void nav.scrollTo(index, CELL_JUMP[i])}
            className="relative h-11 min-w-16 rounded-full px-4 font-mono text-[12px] uppercase tracking-[0.14em] text-text-2 transition-colors duration-200 hover:text-text-1 aria-[current=step]:bg-white/[0.07] aria-[current=step]:text-text-1"
          >
            {c.key}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 bottom-1.5 h-px origin-left scale-x-0 bg-molten opacity-0 transition-opacity duration-200 [[aria-current=step]>&]:scale-x-[var(--cell-progress,0)] [[aria-current=step]>&]:opacity-100"
            />
          </button>
        ))}
      </div>

      <div data-hud aria-hidden className="absolute bottom-6 right-4 grid justify-items-end md:bottom-[8svh] md:right-[4vw]">
        <HudCell index={0} plate={CELLS[0].plate} show={CELLS[0].show}>
          <HudReadout label="UV" value={facts.sla.wavelengthNM} unit="nm" />
          <HudReadout label="Exposure" value={fixed(facts.sla.exposureS, 1)} unit="s" />
          <HudReadout label="Layer height" value={fixed(facts.sla.layerMM, 2)} unit="mm" />
          <HudReadout
            live
            label="Layer"
            chars={11}
            value={<HudValue scrub={slaLayer} format={layerOf} />}
          />
        </HudCell>
        <HudCell index={1} plate={CELLS[1].plate} show={CELLS[1].show}>
          <HudReadout label="Laser" value={facts.sls.laserW} unit={`W ${facts.sls.laser}`} tone="molten" />
          <HudReadout
            live
            label="Bed"
            chars={5}
            value={<HudValue get={() => facts.sls.bedC + signals.bedJitter} fallback={facts.sls.bedC} decimals={1} />}
            unit="°C"
          />
          <HudReadout label="Recoat" value={fixed(facts.sls.recoatMM, 2)} unit="mm" />
          <HudReadout label="Nested" value={facts.sls.nestedParts} unit="parts" />
        </HudCell>
        <HudCell index={2} plate={CELLS[2].plate} show={CELLS[2].show}>
          <HudReadout label="Laser" value={facts.lpbf.laserW} unit="W" tone="molten" />
          <div className="grid">
            <HudReadout
              live
              label="Melt pool"
              chars={5}
              className="transition-opacity duration-[240ms] [grid-area:1/1] group-data-[qa=1]/ch6:opacity-0"
              value={
                <HudValue get={() => facts.lpbf.meltPoolC + signals.poolJitter} fallback={facts.lpbf.meltPoolC} format={thousands} />
              }
              unit="°C"
            />
            <HudReadout
              label="QA scan"
              tone="ok"
              className="opacity-0 transition-opacity duration-[240ms] [grid-area:1/1] group-data-[qa=1]/ch6:opacity-100"
              value="PASS"
              unit={`CMM ±${fixed(facts.lpbf.cmmToleranceMM, 2)} mm`}
            />
          </div>
          <HudReadout label="O₂" value={`< ${facts.lpbf.oxygenPctMax}`} unit="%" />
          <HudReadout
            live
            label="Part temp"
            chars={3}
            value={<HudValue scrub={lpbfPartTemp} format={thousands} />}
            unit="°C"
          />
        </HudCell>
      </div>
    </div>
  );
}

function HudCell({ index, plate, show, children }: { index: number; plate: string; show: string; children: ReactNode }) {
  return (
    <div data-hudcell={index} className={`opacity-0 transition-opacity duration-[240ms] [grid-area:1/1] ${show}`}>
      <HudCluster window={HUD_WINDOWS[index]} padding="px-5 pb-4 pt-3.5">
        <p className="hud-label text-text-2">{plate}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3.5 md:auto-cols-max md:grid-flow-col md:grid-cols-none">{children}</div>
      </HudCluster>
    </div>
  );
}
