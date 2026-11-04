import type { ReactNode } from 'react';
import { Container, Section, SectionHeading } from '@/strata/ui';
import { Reveal } from '../customers/Reveal';
import { facts } from '@/strata/story/facts';
import { unitPrice } from '@/strata/story/quote';
import { FeatureCard } from './FeatureCard';
import { IconApi, IconFleet, IconMaterial, IconModel, IconOptimize, IconQuote } from './icons';

const unit = unitPrice('bracket', 'titanium', 1);
const fmt = (n: number) => n.toLocaleString('en-US');
const words = ['zero', 'one', 'two', 'three', 'four', 'five'];

const FEATURES: { title: string; line: ReactNode; icon: ReactNode }[] = [
  {
    title: 'AI modeling',
    line: 'Describe the job in plain words and get an editable, watertight CAD model in under a minute.',
    icon: <IconModel />,
  },
  {
    title: 'Generative optimization',
    line: `Cut up to ${facts.maxMassSavedPct}% of the mass while holding your safety factor. Every result ships with its stress report.`,
    icon: <IconOptimize />,
  },
  {
    title: 'Instant quoting',
    line: 'Price and ship date in seconds, for one part or a production run. No sales call, no spreadsheet.',
    icon: <IconQuote digits={String(Math.floor(unit)).padStart(3, '0').slice(-3)} />,
  },
  {
    title: 'Fleet printing',
    line: `${fmt(facts.fleet.printers)} machines across ${words[facts.plants.length]} plants. Your job goes to the first cell that can hold the tolerance.`,
    icon: <IconFleet lit={Math.round((16 * facts.fleet.active) / facts.fleet.printers)} />,
  },
  {
    title: 'Material library',
    line: (
      <>
        {facts.materialsCount} qualified materials, from PA12 to <span className="whitespace-nowrap">Ti-6Al-4V</span>, each with real
        test data behind it.
      </>
    ),
    icon: <IconMaterial />,
  },
  {
    title: 'API & integrations',
    line: 'Quote, order and track from your PLM, ERP or CI pipeline with one REST API and webhooks.',
    icon: <IconApi />,
  },
];

export default function Features() {
  return (
    <Section id="features" surface="bg-2">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <SectionHeading id="features-title" eyebrow="Platform" title="One pipeline from prompt to part." />
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={80}>
            <p className="max-w-[60ch] text-pretty text-body text-text-2">
              From the first sentence to the parcel on your bench. No CAD seat, no broker, no back-and-forth.
            </p>
          </Reveal>
        </div>
        <ul className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title}>
              <div className="flex items-start justify-between">
                <div className="relative grid size-16 place-items-center">
                  <Corners />
                  {f.icon}
                </div>
                <span aria-hidden className="hud-label tabular text-text-3">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-14 text-h3 text-text-1">{f.title}</h3>
              <p className="mt-3 text-[15px] leading-6 text-text-2">{f.line}</p>
            </FeatureCard>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** HUD corner brackets around the icon (STORYBOARD 3.7 motif). */
function Corners() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="absolute inset-0 size-full text-text-3/60 transition-colors duration-[var(--duration-base)] group-hover/card:text-molten" fill="none">
      <path d="M1 9V1h8M55 1h8v8M63 55v8h-8M9 63H1v-8" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}
