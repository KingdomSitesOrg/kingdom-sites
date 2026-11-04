import { Container, Section, SectionHeading } from '@/strata/ui';
import { Reveal } from '../testimonials/Reveal';
import { facts } from '@/strata/story/facts';
import { leadDays, type QuoteMaterial } from '@/strata/story/quote';
import { FaqAccordion, type FaqItem } from './FaqAccordion';

const days = (m: QuoteMaterial) => leadDays('bracket', m, 1);

const ITEMS: FaqItem[] = [
  {
    id: 'cad',
    question: 'Do I need CAD experience?',
    answer:
      'No. Describe the part in plain words and STRATA builds the model. If you do use CAD, every model exports as an editable STEP file.',
  },
  {
    id: 'ownership',
    question: 'Who owns the designs?',
    answer:
      'You do. Every model, file and derivative belongs to you, and we never train on customer geometry unless you opt in.',
  },
  {
    id: 'tolerances',
    question: 'What tolerances can you hold?',
    answer:
      '±0.05 mm on metal and resin, ±0.10 mm on SLS nylon and ±0.15 mm on FDM. Tighter tolerances are available with post-machining.',
  },
  {
    id: 'speed',
    question: 'How fast do parts ship?',
    answer: `Resin in ${days('clearResin')} business days, carbon nylon in ${days('carbonNylon')} and titanium in ${days('titanium')} for a single part. The fleet averages ${facts.turnaroundDays} days from quote to dock.`,
  },
  {
    id: 'upload',
    question: 'Can I upload my own models?',
    answer: 'Yes. Drop in STEP, STL, 3MF or OBJ and STRATA will repair, optimize and quote it like any generated model.',
  },
  {
    id: 'materials',
    question: 'Which materials do you offer?',
    answer: `${facts.materialsCount} qualified materials, including PA12, PA12-CF, TPU, PEEK, standard and clear resins, biocompatible resins, aluminium AlSi10Mg, stainless 316L and Ti-6Al-4V.`,
  },
  {
    id: 'security',
    question: 'How do you keep my data safe?',
    answer:
      'Files are encrypted in transit and at rest, access is logged, and Enterprise parts run on export-controlled lines with audited staff.',
  },
  {
    id: 'real',
    question: 'Is STRATA a real company?',
    answer: 'No. STRATA, its customers and every number on this page are fictional, made for a design showcase.',
  },
];

/** STORYBOARD 7.8: eight questions, one open at a time. */
export default function Faq() {
  return (
    <Section id="faq" surface="bg-2">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <div data-reveal className="lg:sticky lg:top-28">
            <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions, answered." />
          </div>
        </Reveal>
        <div className="lg:col-span-7 lg:col-start-6">
          <FaqAccordion items={ITEMS} defaultOpen={ITEMS[0].id} />
        </div>
      </Container>
    </Section>
  );
}
