import type { CSSProperties, ReactNode } from 'react';
import { Container, Eyebrow, Section, cn } from '@/strata/ui';
import { Reveal } from './Reveal';

type Testimonial = {
  id: string;
  sector: string;
  /** The quote, with the line that sells it wrapped in <strong>. */
  quote: ReactNode;
  name: string;
  role: string;
  company: string;
  initials: string;
  accent: 'molten' | 'resin';
};

const Em = ({ children }: { children: ReactNode }) => <strong className="font-medium text-text-1">{children}</strong>;

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'kovac',
    sector: 'Aerospace',
    quote: (
      <>
        We went from a napkin sketch to <Em>flight-tested titanium in nine days</Em>. Our old supplier needed nine
        weeks just to quote it.
      </>
    ),
    name: 'Ines Kovač',
    role: 'Head of Structures',
    company: 'Northvane Orbital',
    initials: 'IK',
    accent: 'molten',
  },
  {
    id: 'mensah',
    sector: 'Robotics',
    quote: (
      <>
        The optimizer found <Em>58{'\u00A0'}grams</Em> in a bracket we thought was finished. Across 400 drones, that is range
        we can sell.
      </>
    ),
    name: 'Dario Mensah',
    role: 'VP Engineering',
    company: 'Ferrowing Robotics',
    initials: 'DM',
    accent: 'resin',
  },
  {
    id: 'lindqvist',
    sector: 'Medical',
    quote: (
      <>
        Patient-matched surgical guides in clear resin, <Em>at our door in 48{'\u00A0'}hours</Em>. STRATA is now part of how we
        plan surgery.
      </>
    ),
    name: 'Dr. Hana Lindqvist',
    role: 'Director of Surgical Innovation',
    company: 'Meridell Ortho Labs',
    initials: 'HL',
    accent: 'resin',
  },
];

const discAccent = {
  molten: 'border-molten/70 text-molten-hot shadow-[0_0_24px_-6px_var(--molten)]',
  resin: 'border-resin/60 text-resin shadow-[0_0_24px_-6px_var(--resin)]',
} as const;

function QuoteCard({ t }: { t: Testimonial }) {
  return (
    <figure aria-label={`${t.name}, ${t.role}, ${t.company}`} className="relative flex h-full flex-col rounded-[20px] border border-line bg-bg-3 p-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <div aria-hidden className="flex items-baseline justify-between gap-4">
        <span className="font-display text-[16px] font-semibold tracking-[-0.01em] text-text-1">{t.company}</span>
        <span className="hud-label text-text-3">{t.sector}</span>
      </div>
      <blockquote className="mt-7 flex-1">
        <p className="text-[19px] leading-[30px] tracking-[-0.006em] text-text-2 -indent-[0.42em]">
          “{t.quote}”
        </p>
      </blockquote>
      <figcaption className="mt-10 flex items-center gap-4 border-t border-line pt-6">
        <span
          aria-hidden
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full border bg-bg-3 font-display text-[14px] font-semibold tracking-[0.02em]',
            discAccent[t.accent],
          )}
        >
          {t.initials}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-medium leading-[22px] text-text-1">{t.name}</span>
          <span className="text-[13px] leading-5 text-text-3">
            {t.role}
            <span className="sr-only">, {t.company}</span>
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/** STORYBOARD 7.6: three fictional customer quotes. */
export default function Testimonials() {
  return (
    <Section id="testimonials" surface="bg-2">
      <Container>
        <Reveal>
          <div data-reveal className="flex flex-col gap-5">
            <Eyebrow>From the floor</Eyebrow>
            <h2 id="testimonials-title" className="text-h2 text-balance text-text-1">
              <span className="lg:block">Engineers don’t write love letters.</span>{' '}
              <span className="lg:block">These came close.</span>
            </h2>
          </div>
        </Reveal>
        <Reveal as="ul" amount={0.3} className="mt-16 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <li key={t.id} data-reveal style={{ '--reveal-i': i } as CSSProperties}>
              <QuoteCard t={t} />
            </li>
          ))}
        </Reveal>
        <p className="mt-8 text-[12px] leading-4 text-text-3">People and companies are fictional.</p>
      </Container>
    </Section>
  );
}
