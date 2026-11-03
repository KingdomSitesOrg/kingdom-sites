import type { CSSProperties } from 'react';
import { Container, Section, SectionHeading, cn } from '@/strata/ui';
import { LogoWall } from './LogoWall';
import { Reveal } from './Reveal';
import { WORDMARKS } from './wordmarks';

type Logo = (typeof WORDMARKS)[number];

// One of each sector per row, so neither row reads as a single industry.
const ROWS: Logo[][] = [
  [WORDMARKS[0], WORDMARKS[2], WORDMARKS[4], WORDMARKS[6]],
  [WORDMARKS[1], WORDMARKS[3], WORDMARKS[5], WORDMARKS[7]],
];

const LOGO = 'h-9 w-auto text-text-3 transition-colors duration-[var(--duration-base)] ease-out-expo hover:text-text-1';

function Track({ logos, hidden }: { logos: Logo[]; hidden: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      aria-label={hidden ? undefined : 'Customers'}
      className="flex shrink-0 items-center gap-24 pr-24"
    >
      {logos.map(({ name, Mark }) => (
        <li key={name} className="flex shrink-0 items-center">
          <Mark className={LOGO} />
        </li>
      ))}
    </ul>
  );
}

/** Four copies loop seamlessly at -50 %; one copy crosses the frame every 40 s. */
function Row({ logos, reverse }: { logos: Logo[]; reverse?: boolean }) {
  return (
    <div className="mask-fade-x overflow-hidden py-2">
      <div
        className={cn(
          'flex w-max animate-marquee',
          'group-hover/wall:[animation-play-state:paused] group-focus-within/wall:[animation-play-state:paused] group-data-paused/wall:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
        style={{ '--marquee-duration': '80s' } as CSSProperties}
      >
        <Track logos={logos} hidden={false} />
        <Track logos={logos} hidden />
        <Track logos={logos} hidden />
        <Track logos={logos} hidden />
      </div>
    </div>
  );
}

export default function Customers() {
  return (
    <Section id="customers" surface="bg-0" className="border-t border-molten">
      {/* The last printed layer, still warm. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(50%_100%_at_50%_0%,color-mix(in_srgb,var(--molten)_9%,transparent),transparent)]"
      />
      <Container className="relative">
        <Reveal>
          <SectionHeading
            id="customers-title"
            eyebrow="Trusted on the shop floor"
            title="Built into the supply chains of people who build hard things."
            className="[&_h2]:max-w-[20ch]"
          />
        </Reveal>
        <div className="mt-20">
          <LogoWall caption={<p className="text-caption text-text-3">All customers are fictional.</p>}>
            <div className="flex flex-col gap-8 motion-reduce:hidden">
              <Row logos={ROWS[0]} />
              <Row logos={ROWS[1]} reverse />
            </div>
            <ul
              aria-label="Customers"
              className="hidden grid-cols-2 border-l border-t border-line motion-reduce:grid lg:grid-cols-4"
            >
              {WORDMARKS.map(({ name, Mark }) => (
                <li key={name} className="flex h-32 items-center justify-center border-b border-r border-line px-6">
                  <Mark className={LOGO} />
                </li>
              ))}
            </ul>
          </LogoWall>
        </div>
      </Container>
    </Section>
  );
}
