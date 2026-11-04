'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Button, IconArrowRight, RadioCards, SegmentedControl, cn } from '@/strata/ui';
import { storyToday } from '@/strata/story/ambient';
import { facts } from '@/strata/story/facts';
import {
  MATERIAL_KEYS,
  OBJECT_KEYS,
  QUANTITY,
  clampQuantity,
  discount,
  formatShipDate,
  formatUSD,
  leadDays,
  materials,
  objects,
  parseISODate,
  shipDate,
  total,
  unitPrice,
  type QuoteMaterial,
} from '@/strata/story/quote';
import { partStore, storyStore, type QuotePreset } from '@/strata/story/store';
import { Odometer } from './Odometer';
import { PriceCurve } from './PriceCurve';
import { SILHOUETTES } from './silhouettes';

const STOPS = [1, 5, 10, 25, 50, 100, 250, 500] as const;
const LEAD_SCALE = 15;
const DEFAULT: QuotePreset = { object: 'bracket', material: 'titanium', q: 1 };

const businessDays = (n: number) => `${n} business ${n === 1 ? 'day' : 'days'}`;
function describe({ object, material, q }: QuotePreset) {
  return `Unit price ${formatUSD(unitPrice(object, material, q))}. Ships in ${businessDays(leadDays(object, material, q))}.`;
}

const wholePart = (v: string) => Number(v.split(/[.,]/)[0].slice(0, 3));

/** 'Mon, Nov 9', with the year added when the part ships in a later year than today. */
function shipLabel(today: Date, ships: Date) {
  const date = formatShipDate(ships);
  return ships.getUTCFullYear() === today.getUTCFullYear() ? date : `${date}, ${ships.getUTCFullYear()}`;
}

/** Slider position (0..7) for any quantity: stop index plus a log-scale fraction between stops. */
function posOf(q: number) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (q <= b) return i + Math.log(q / a) / Math.log(b / a);
  }
  return STOPS.length - 1;
}

export function QuoteWidget() {
  const [sel, setSel] = useState<QuotePreset>(() => partStore.getState().quotePreset ?? DEFAULT);
  const [draft, setDraft] = useState<string | null>(null);
  // Seeded with the first quote so only changes are announced, never the page load.
  const [announce, setAnnounce] = useState(() => describe(partStore.getState().quotePreset ?? DEFAULT));

  // Chapter 8's "Quote this part" writes the preset; follow it whenever it changes.
  useEffect(
    () =>
      partStore.subscribe((s, prev) => {
        if (s.quotePreset && s.quotePreset !== prev.quotePreset) {
          setSel(s.quotePreset);
          setDraft(null);
        }
      }),
    [],
  );

  const { object, material, q } = sel;
  const unit = unitPrice(object, material, q);
  const sum = total(object, material, q);
  const lead = leadDays(object, material, q);
  const m = materials[material];
  const off = Math.round((1 - discount(q)) * 100);

  // The ship date needs the visitor's today, so it appears after mount (capture uses facts.captureToday).
  const today = useSyncExternalStore(
    (cb) => storyStore.subscribe(cb),
    () => storyToday().toISOString().slice(0, 10),
    () => null,
  );
  const ships = today ? shipLabel(parseISODate(today), shipDate(object, material, q, parseISODate(today))) : null;

  const days = businessDays(lead);
  useEffect(() => {
    const t = setTimeout(() => setAnnounce(describe(sel)), 400);
    return () => clearTimeout(t);
  }, [sel]);

  const set = (patch: Partial<QuotePreset>) => setSel((s) => ({ ...s, ...patch }));
  const setQ = (n: number) => {
    set({ q: clampQuantity(n) });
    setDraft(null);
  };

  const mass =
    object === 'bracket'
      ? { label: 'Mass', value: `${facts.part.massByMaterialG[material]} g per part` }
      : { label: 'Volume', value: `${objects[object].V} cm³ per part` };

  return (
    <div className="mt-16 grid overflow-hidden rounded-[24px] border border-line bg-bg-1/60 shadow-panel lg:grid-cols-12">
      {/* Controls */}
      <div className="flex flex-col gap-10 p-6 sm:p-10 lg:col-span-7">
        <fieldset>
          <Legend n="01" id="quote-part">
            Part
          </Legend>
          <RadioCards
            labelledBy="quote-part"
            value={object}
            onChange={(v) => set({ object: v })}
            gridClassName="grid-cols-1 sm:grid-cols-2"
            className="mt-4"
            options={OBJECT_KEYS.map((id) => {
              const Shape = SILHOUETTES[id];
              return {
                value: id,
                label: objects[id].name,
                description: `${objects[id].V} cm³`,
                media: <Shape className="h-10 w-14" />,
              };
            })}
          />
        </fieldset>

        <fieldset>
          <Legend n="02" id="quote-material">
            Material
          </Legend>
          <SegmentedControl
            labelledBy="quote-material"
            value={material}
            onChange={(v) => set({ material: v })}
            tone="neutral"
            className="mt-4 min-w-full"
            options={MATERIAL_KEYS.map((id) => ({
              value: id,
              label: (
                <>
                  <Swatch id={id} />
                  {materials[id].name}
                </>
              ),
              description: materials[id].process,
            }))}
          />
        </fieldset>

        <fieldset>
          <Legend n="03" id="quote-qty">
            Quantity
          </Legend>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={STOPS.length - 1}
                step="any"
                value={posOf(q)}
                aria-labelledby="quote-qty"
                aria-valuetext={`${q} ${q === 1 ? 'part' : 'parts'}`}
                onChange={(e) => setQ(STOPS[Math.round(Number(e.target.value))])}
                onKeyDown={(e) => {
                  const up = e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp';
                  const down = e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown';
                  if (!up && !down && e.key !== 'Home' && e.key !== 'End') return;
                  e.preventDefault();
                  if (e.key === 'Home') return setQ(QUANTITY.min);
                  if (e.key === 'End') return setQ(QUANTITY.max);
                  const next = up ? STOPS.find((s) => s > q) : [...STOPS].reverse().find((s) => s < q);
                  if (next !== undefined) setQ(next);
                }}
                style={{ '--p': `${(posOf(q) / (STOPS.length - 1)) * 100}%` } as React.CSSProperties}
                className={cn(
                  'relative z-10 block h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none',
                  '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,var(--molten)_var(--p),var(--line-strong)_var(--p))]',
                  '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[linear-gradient(90deg,var(--molten)_var(--p),var(--line-strong)_var(--p))]',
                  '[&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-molten [&::-webkit-slider-thumb]:bg-text-1 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--molten)_18%,transparent),0_0_16px_var(--molten)]',
                  // The focus ring sits on the thumb (2 px resin, 3 px gap) instead of boxing the track and its labels.
                  'focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--bg-1),0_0_0_5px_var(--focus-ring)] focus-visible:[&::-moz-range-thumb]:outline-2 focus-visible:[&::-moz-range-thumb]:outline-offset-3 focus-visible:[&::-moz-range-thumb]:outline-(--focus-ring)',
                  '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-molten [&::-moz-range-thumb]:bg-text-1',
                )}
              />
              <div aria-hidden className="relative mx-2.5 h-5">
                {STOPS.map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      'hud-label absolute top-0 -translate-x-1/2 tabular transition-colors',
                      s === q ? 'text-text-1' : 'text-text-3',
                    )}
                    style={{ left: `${(i / (STOPS.length - 1)) * 100}%` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex h-12 shrink-0 items-center self-start rounded-pill border border-line-strong bg-bg-0/60 p-0.5">
              <StepButton label="Decrease quantity" disabled={q <= QUANTITY.min} onClick={() => setQ(q - 1)}>
                <path d="M3 8h10" />
              </StepButton>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                role="spinbutton"
                aria-label={`Quantity, ${QUANTITY.min} to ${QUANTITY.max}`}
                aria-valuemin={QUANTITY.min}
                aria-valuemax={QUANTITY.max}
                aria-valuenow={q}
                value={draft ?? String(q)}
                onChange={(e) => {
                  // A typed decimal stays visible while editing; only its whole part counts ("2.5" is 2, not 25).
                  const v = e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6);
                  setDraft(v);
                  const n = wholePart(v);
                  if (n >= QUANTITY.min && n <= QUANTITY.max) set({ q: n });
                }}
                onBlur={() => setQ(draft ? wholePart(draft) || QUANTITY.min : q)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  setQ(q + (e.key === 'ArrowUp' ? 1 : -1));
                }}
                className="h-10 w-14 rounded-[10px] bg-transparent text-center font-mono text-[15px] font-medium tabular text-text-1"
              />
              <StepButton label="Increase quantity" disabled={q >= QUANTITY.max} onClick={() => setQ(q + 1)}>
                <path d="M3 8h10M8 3v10" />
              </StepButton>
            </div>
          </div>
        </fieldset>

        <ApiRequest object={object} material={material} q={q} />
      </div>

      {/* Result */}
      <div className="relative flex flex-col border-t border-line bg-bg-3 p-6 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between">
          <span className="hud-label text-text-3">Quote</span>
          <span className="hud-label inline-flex items-center gap-2 text-text-2">
            <span aria-hidden className="relative inline-flex size-1.5">
              <span className="absolute inset-0 animate-hud-pulse rounded-full bg-molten" />
              <span className="relative size-1.5 rounded-full bg-molten" />
            </span>
            Live
          </span>
        </div>

        <p className="hud-label mt-8 text-text-3">Unit</p>
        <p className="mt-3 font-display text-[56px] font-medium tracking-[-0.03em] text-text-1">
          <Odometer value={formatUSD(unit)} />
          <span className="sr-only">{formatUSD(unit)}</span>
        </p>
        <p className="mt-3 text-[13px] text-text-2">
          {off > 0 ? (
            <>
              Volume pricing <span className="font-mono tabular text-molten-hot">−{off}%</span> at {q} parts
            </>
          ) : (
            'Single part, setup included'
          )}
        </p>

        <dl className="mt-8 flex flex-col border-t border-line">
          <Row label="Total" hint={`${q} × ${formatUSD(unit)}`}>
            <Odometer value={formatUSD(sum)} />
            <span className="sr-only">{formatUSD(sum)}</span>
          </Row>
          {/* Label and value share one grid cell, so the bar can run full width inside the dd. */}
          <div className="grid border-b border-line pb-5 pt-4">
            <dt className="hud-label pt-[3px] text-text-3 [grid-area:1/1]">Ships in</dt>
            <dd className="font-mono text-[15px] font-medium tabular text-text-1 [grid-area:1/1]">
              <span className="flex flex-col items-end gap-1 text-right">
                <span>{days}</span>
                <span className="text-[12px] font-normal text-text-3">{ships ?? '\u00a0'}</span>
              </span>
              <span aria-hidden className="mt-4 block">
                <span className="relative block h-2 overflow-hidden rounded-full bg-bg-0/70">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--molten-deep),var(--molten))] transition-[width] duration-400 ease-out-expo"
                    style={{ width: `${(Math.min(lead, LEAD_SCALE) / LEAD_SCALE) * 100}%` }}
                  />
                  <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_calc(100%/15-1px),var(--bg-3)_calc(100%/15-1px),var(--bg-3)_calc(100%/15))]" />
                </span>
                <span className="mt-2 flex justify-between text-[11px] font-normal text-text-3">
                  <span>0</span>
                  <span className={cn(lead > LEAD_SCALE && 'text-molten-hot')}>
                    {lead > LEAD_SCALE ? `${LEAD_SCALE}+` : LEAD_SCALE} business days
                  </span>
                </span>
              </span>
            </dd>
          </div>
          <Row label="Process">
            {m.process} <span className="text-text-3">· {m.spec}</span>
          </Row>
          <Row label={mass.label}>{mass.value}</Row>
        </dl>

        <PriceCurve object={object} material={material} q={q} />

        <output className="sr-only" aria-live="polite">
          {announce}
        </output>

        <div className="mt-auto pt-8">
          <Button href="#pricing" size="lg" magnetic={false} trailingIcon={<IconArrowRight />} className="w-full">
            Order this part
          </Button>
          <p className="mt-4 text-center text-caption text-text-3">Demo pricing for a fictional company. Not an offer.</p>
        </div>
      </div>
    </div>
  );
}

function Legend({ n, id, children }: { n: string; id: string; children: ReactNode }) {
  return (
    <legend id={id} className="hud-label flex items-center gap-3 text-text-2">
      <span aria-hidden className="tabular text-text-3">
        {n}
      </span>
      {children}
    </legend>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-4">
      <dt className="flex flex-col gap-1">
        <span className="hud-label text-text-3">{label}</span>
        {hint ? <span className="font-mono text-[11px] tabular text-text-3">{hint}</span> : null}
      </dt>
      <dd className="text-right font-mono text-[15px] font-medium tabular text-text-1">{children}</dd>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className="group/step grid size-11 place-items-center rounded-full text-text-2 transition-colors hover:bg-white/[0.06] hover:text-text-1 aria-disabled:cursor-default aria-disabled:hover:bg-transparent aria-disabled:hover:text-text-2"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 group-aria-disabled/step:opacity-35" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
        {children}
      </svg>
    </button>
  );
}

function Swatch({ id }: { id: QuoteMaterial }) {
  const look = {
    titanium: 'bg-[linear-gradient(135deg,var(--text-1),var(--text-3)_60%,var(--text-2))]',
    carbonNylon: 'bg-bg-0 shadow-[inset_0_0_0_1px_var(--text-3)]',
    clearResin: 'bg-resin/20 shadow-[inset_0_0_0_1px_var(--resin)]',
  }[id];
  return <span aria-hidden className={cn('size-2.5 rounded-full', look)} />;
}

/** The same request the widget makes, as a customer would send it. Mirrors the current selection. */
function ApiRequest({ object, material, q }: QuotePreset) {
  const line = (k: string, v: ReactNode, last = false) => (
    <span className="block pl-5">
      <span className="text-text-2">&quot;{k}&quot;</span>
      <span className="text-text-3">: </span>
      {v}
      {last ? null : <span className="text-text-3">,</span>}
    </span>
  );
  const str = (v: string) => <span className="text-resin">&quot;{v}&quot;</span>;
  return (
    <figure className="mt-auto overflow-hidden rounded-2xl border border-line bg-bg-0/70">
      <figcaption className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="hud-label text-text-3">API request</span>
        <span className="font-mono text-[12px] text-text-2">
          <span className="text-molten-hot">POST</span> /v1/quotes
        </span>
      </figcaption>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-6 tabular">
        <code>
          <span className="text-text-3">{'{'}</span>
          {line('part', str(object))}
          {line('material', str(material))}
          {line('quantity', <span className="text-molten-hot">{q}</span>, true)}
          <span className="text-text-3">{'}'}</span>
        </code>
      </pre>
    </figure>
  );
}
