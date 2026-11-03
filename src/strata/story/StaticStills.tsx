'use client';

import { useRef, useState } from 'react';
import { director } from './director';
import { useStoryTick } from './hooks';
import { PLATES, plateSrc, stillOpacity } from './plates';
import { useStoryStore } from './store';
import type { ChapterDefinition } from './types';

/** Width in p of the crossfade between two stills (STORYBOARD static rules). */
export const STILL_FADE = 0.12;

/**
 * Static mode: the chapter's captured stills stacked in the sticky container, each held and crossfaded with
 * opacity only over a 0.12-wide p window centred between neighbours. Without captured stills it shows the
 * chapter's designed plate (`plates.ts`), staged the same way; without a plate, a designed placeholder.
 */
export function StaticStills({ def, index }: { def: ChapterDefinition; index: number }) {
  const entry = useStoryStore((s) => s.stills?.chapters[def.id]);
  const loaded = useStoryStore((s) => s.stills !== null);
  const [failed, setFailed] = useState(false);
  const [plateFailed, setPlateFailed] = useState(false);
  const layers = useRef<(HTMLElement | null)[]>([]);
  const labels = useRef<(HTMLElement | null)[]>([]);

  const captured = Boolean(entry && !failed && entry.desktop.length);
  const plate = !captured && !plateFailed ? PLATES[def.id] : undefined;
  const stops = captured ? entry!.stills : plate ? def.stills.slice(0, plate.stages.length) : [];

  useStoryTick(() => {
    const pr = director.progress(index);
    if (!pr.visible || stops.length < 2) return;
    for (let n = 0; n < stops.length; n++) {
      const o = stillOpacity(stops, pr.p, n, STILL_FADE);
      const next = n + 1 < stops.length ? stillOpacity(stops, pr.p, n + 1, STILL_FADE) : 0;
      // Images crossfade; labels hand over (the old one is gone before the new one appears), so text never overlaps.
      const label = Math.min(1, Math.max(0, (o - next - 0.5) * 2));
      setOpacity(layers.current[n], o);
      setOpacity(labels.current[n], label);
    }
  });

  if (!loaded) return <div aria-hidden className="absolute inset-0 bg-bg-0" />;

  const layerRef = (n: number) => (el: HTMLElement | null) => {
    layers.current[n] = el;
  };
  const loading = index < 2 ? 'eager' : 'lazy';

  if (captured) {
    return (
      <div aria-hidden className="absolute inset-0 bg-bg-0">
        {entry!.desktop.map((file, n) => (
          <picture key={file} ref={layerRef(n)} className="absolute inset-0 block" style={{ opacity: n === 0 ? 1 : 0 }}>
            {entry!.mobile[n] && <source media="(max-width: 767px)" srcSet={`/strata/stills/${entry!.mobile[n]}`} />}
            <img
              src={`/strata/stills/${file}`}
              alt=""
              loading={loading}
              decoding="async"
              className="h-full w-full object-cover"
              onError={() => setFailed(true)}
            />
          </picture>
        ))}
      </div>
    );
  }

  if (!plate) return <StillPlaceholder def={def} index={index} />;

  const code = String(index).padStart(2, '0');
  const total = String(director.defs.length - 1).padStart(2, '0');
  return (
    <div aria-hidden data-plate={def.id} className="absolute inset-0 overflow-hidden bg-bg-0">
      {stops.map((_, n) => (
        // eslint-disable-next-line @next/next/no-img-element -- static fallback art, sized by CSS, no optimizer
        <img
          key={n}
          ref={layerRef(n)}
          src={plateSrc(def.id, n)}
          alt=""
          loading={n === 0 ? loading : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[70%_50%] md:object-center"
          style={{ opacity: n === 0 ? 1 : 0 }}
          onError={() => setPlateFailed(true)}
        />
      ))}
      <div className="glass-lite absolute right-[4vw] top-[8svh] hidden min-w-60 rounded-lg px-4 py-3 text-right md:block">
        <div className="hud-label text-text-2">
          <span className="tabular">
            Plate {code} / {total}
          </span>{' '}
          · {def.title}
        </div>
        <div className="ml-auto mt-2 h-px w-full bg-linear-to-l from-text-2/40 to-transparent" />
        <div className="relative mt-2 h-4">
          {stops.map((_, n) => (
            <span
              key={n}
              ref={(el) => {
                labels.current[n] = el;
              }}
              className="hud-label absolute right-0 top-0 whitespace-nowrap text-text-1"
              style={{ opacity: n === 0 ? 1 : 0 }}
            >
              <span className="tabular text-molten-hot">{String(n + 1).padStart(2, '0')}</span> {plate.stages[n]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function setOpacity(el: HTMLElement | null, value: number) {
  const v = value.toFixed(3);
  if (el && el.style.opacity !== v) el.style.opacity = v;
}

const MOLTEN = '255, 106, 26';
const RESIN = '56, 225, 255';

/** Deep gradient, faint print-layer lines, one hot layer right of the copy column, chapter number and title. */
export function StillPlaceholder({ def, index }: { def: ChapterDefinition; index: number }) {
  const accent = index % 2 === 0 ? MOLTEN : RESIN;
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        backgroundColor: def.background,
        backgroundImage: `radial-gradient(70% 60% at 70% 48%, rgba(${accent}, 0.14), transparent 62%), radial-gradient(60% 50% at 20% 90%, rgba(40, 60, 140, 0.22), transparent 70%), linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.55))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 9px)',
          maskImage: 'radial-gradient(55% 45% at 70% 52%, #000 30%, transparent 100%)',
        }}
      />
      <div
        className="absolute left-[46%] right-[6%] top-[58%] h-px"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${accent}, 0.9) 30%, rgba(255, 231, 194, 0.95) 52%, rgba(${accent}, 0.9) 74%, transparent)`,
          boxShadow: `0 0 18px 2px rgba(${accent}, 0.45)`,
        }}
      />
      <div className="absolute right-[4vw] top-[8svh] hidden text-right md:block">
        <div className="hud-label text-text-2">
          <span className="tabular">{String(index).padStart(2, '0')}</span> · {def.title}
        </div>
      </div>
    </div>
  );
}
