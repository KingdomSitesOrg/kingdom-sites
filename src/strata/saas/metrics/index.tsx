import { Container, Section, SectionHeading, cn } from '@/strata/ui';
import { Reveal } from '../customers/Reveal';
import { facts } from '@/strata/story/facts';
import { Counter } from './Counter';

type Metric = { value: number; decimals?: number; unit?: string; unitSize?: 'full' | 'word'; label: string; live?: boolean };

const METRICS: Metric[] = [
  {
    value: facts.partsShipped.count / 1_000_000,
    decimals: 1,
    unit: 'M',
    unitSize: 'full',
    label: `parts shipped since ${facts.partsShipped.since}`,
  },
  { value: facts.fleet.active, label: 'printers running right now', live: true },
  { value: facts.turnaroundDays, decimals: 1, unit: 'days', unitSize: 'word', label: 'average turnaround, quote to dock' },
  { value: facts.avgMassSavedPct, unit: '%', unitSize: 'full', label: 'average mass saved by optimization' },
];

const text = (m: Metric) =>
  `${m.value.toLocaleString('en-US', { minimumFractionDigits: m.decimals ?? 0, maximumFractionDigits: m.decimals ?? 0 })}${
    m.unit ? (m.unitSize === 'word' ? ` ${m.unit}` : m.unit) : ''
  }`;

export default function Metrics() {
  return (
    <Section id="metrics" surface="bg-0">
      <Container>
        <Reveal>
          <SectionHeading id="metrics-title" eyebrow="By the numbers" title="Built for production, not just prototypes." />
        </Reveal>
        <dl className="mt-20 grid grid-cols-1 border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className={cn(
                'flex flex-col-reverse justify-end gap-5 border-line pb-2 pt-10 sm:pr-8',
                i > 0 && 'lg:border-l lg:pl-8',
                i % 2 === 1 && 'sm:border-l sm:pl-8 lg:pl-8',
              )}
            >
              <dt className="relative text-balance text-[15px] leading-6 text-text-2">
                {m.live ? (
                  <span aria-hidden className="absolute -left-4 top-[9px] inline-flex size-1.5">
                    <span className="absolute inset-0 animate-hud-pulse rounded-full bg-molten" />
                    <span className="relative size-1.5 rounded-full bg-molten" />
                  </span>
                ) : null}
                {m.label}
              </dt>
              <dd className="font-display text-[clamp(48px,6.1vw,88px)] font-medium leading-none tracking-[-0.04em] text-text-1 tabular">
                <span className="sr-only">{text(m)}</span>
                <Counter value={m.value} decimals={m.decimals} />
                {m.unit ? (
                  <span
                    aria-hidden
                    className={cn('text-molten', m.unitSize === 'word' && 'ml-2 text-[0.36em] tracking-[-0.01em]')}
                  >
                    {m.unit}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
