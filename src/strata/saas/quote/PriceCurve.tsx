import { useId } from 'react';
import { QUANTITY, unitPrice, type QuoteMaterial, type QuoteObject } from '@/strata/story/quote';

const W = 300;
const H = 72;
const PAD = 4;
const SAMPLES = 48;
const TICKS = [1, 10, 100, 500];

const lnMax = Math.log(QUANTITY.max);
const x = (q: number) => PAD + (Math.log(q) / lnMax) * (W - 2 * PAD);

/**
 * Unit price against quantity on a log axis, straight from quote.ts, with the current quantity marked.
 * Decorative: the numbers it shows are already in the result rows.
 */
export function PriceCurve({ object, material, q }: { object: QuoteObject; material: QuoteMaterial; q: number }) {
  const id = useId();
  const top = unitPrice(object, material, 1);
  const y = (v: number) => PAD + (1 - v / top) * (H - 2 * PAD);
  // Quantities are whole parts: plot each distinct one once, so the line never steps.
  let line = '';
  let last = 0;
  for (let i = 0; i <= SAMPLES; i++) {
    const n = Math.round(Math.exp((i / SAMPLES) * lnMax));
    if (n === last) continue;
    line += `${last ? 'L' : 'M'}${x(n).toFixed(1)} ${y(unitPrice(object, material, n)).toFixed(1)}`;
    last = n;
  }
  const area = `${line}L${W - PAD} ${H}L${PAD} ${H}Z`;
  const cx = x(q);
  const cy = y(unitPrice(object, material, q));

  return (
    <figure aria-hidden className="pt-6">
      <figcaption className="hud-label flex justify-between text-text-3">
        <span>Unit price by quantity</span>
        <span className="tabular">log scale</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-4 w-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
            <stop offset={0} style={{ stopColor: 'var(--molten)', stopOpacity: 0.16 }} />
            <stop offset={1} style={{ stopColor: 'var(--molten)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={`M${PAD} ${H}H${W - PAD}`} className="stroke-line" strokeWidth={1} />
        <path d={area} fill={`url(#${id})`} />
        <path d={line} className="stroke-text-3" strokeWidth={1.25} strokeLinejoin="round" />
        <g className="transition-transform duration-400 ease-out-expo" style={{ transform: `translate(${cx}px, 0)` }}>
          <path d={`M0 ${PAD}V${H}`} className="stroke-molten/40" strokeWidth={1} strokeDasharray="2 3" />
        </g>
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          className="fill-molten stroke-bg-3 transition-[cx,cy] duration-400 ease-out-expo"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 6px var(--molten))' }}
        />
        {TICKS.map((t) => (
          <text key={t} x={x(t)} y={H + 14} textAnchor={t === 1 ? 'start' : t === QUANTITY.max ? 'end' : 'middle'} className="fill-text-3 font-mono text-[9px]">
            {t}
          </text>
        ))}
      </svg>
    </figure>
  );
}
