import { Container, Section, SectionHeading } from '@/strata/ui';
import { Reveal } from '../customers/Reveal';
import { Rail, type Step } from './Rail';

const STEPS: Step[] = [
  { n: '01', title: 'Describe', line: 'Write a prompt or drop a STEP file. Add loads, fixings and a budget.' },
  { n: '02', title: 'Refine', line: 'Review the optimized model, pick a material and watch the price move in real time.' },
  { n: '03', title: 'Receive', line: 'We print, inspect and ship. Track every layer until it lands on your bench.' },
];

export default function HowItWorks() {
  return (
    <Section id="how-it-works" surface="bg-0">
      <Container>
        <Reveal>
          <SectionHeading id="how-it-works-title" eyebrow="How it works" title="Three steps. No tooling." />
        </Reveal>
        <Rail steps={STEPS} />
      </Container>
    </Section>
  );
}
