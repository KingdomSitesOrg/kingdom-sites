import { Container, Section, SectionHeading } from '@/strata/ui';
import { Reveal } from '../customers/Reveal';
import { QuoteWidget } from './QuoteWidget';

export default function Quote() {
  return (
    <Section id="quote" surface="bg-2">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <SectionHeading id="quote-title" eyebrow="Instant quote" title="Price it before your coffee cools." />
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={80}>
            <p className="max-w-[60ch] text-body text-text-2">
              Pick a part, a material and a quantity. This is the same engine our customers call through the API.
            </p>
          </Reveal>
        </div>
        <QuoteWidget />
      </Container>
    </Section>
  );
}
