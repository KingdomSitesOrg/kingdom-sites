import type { CSSProperties } from 'react';
import { Badge, Container, DemoButton, IconCheck, Section, SectionHeading, cn } from '@/strata/ui';
import { Reveal } from '../testimonials/Reveal';
import { BillingProvider, BillingToggle, PlanPrice } from './billing';
import { PLANS, type Plan } from './plans';

function PlanCard({ plan }: { plan: Plan }) {
  const hot = Boolean(plan.highlighted);
  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-[20px] border p-8',
        hot
          ? 'border-molten/80 bg-bg-3 shadow-[0_0_80px_color-mix(in_oklab,var(--molten)_12%,transparent),inset_0_1px_0_rgb(255_255_255/0.05)]'
          : 'border-line bg-bg-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]',
      )}
    >
      {hot ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 -top-px h-px bg-[linear-gradient(90deg,transparent,var(--molten-hot),transparent)]"
        />
      ) : null}
      <div className="flex min-h-6 items-center justify-between gap-3">
        <h3 className="text-h3 text-text-1">{plan.name}</h3>
        {plan.badge ? (
          <Badge tone="molten" dot>
            {plan.badge}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-[15px] leading-[22px] text-text-2">{plan.pitch}</p>
      <PlanPrice id={plan.id} className="mt-9" />
      <DemoButton
        variant={hot ? 'primary' : 'ghost'}
        magnetic={false}
        wrapperClassName="mt-7 w-full gap-3"
        className={cn('w-full', !hot && 'border border-line-strong bg-white/[0.04] text-text-1! hover:border-text-3 hover:bg-white/[0.08]!')}
      >
        {plan.cta}
      </DemoButton>
      <div className="mt-3 border-t border-line pt-7">
        <p className="hud-label text-text-3">Includes</p>
        <ul className="mt-5 flex flex-col gap-3.5">
          {plan.inherits ? (
            <li className="flex gap-3 text-[15px] font-medium leading-[22px] text-text-1">
              <IconCheck size={16} strokeWidth={2} className="mt-[3px] shrink-0 text-text-1" />
              <span className="text-pretty">{plan.inherits}</span>
            </li>
          ) : null}
          {plan.features.map((f) => (
            <li key={f} className="flex gap-3 text-[15px] leading-[22px] text-text-2">
              <IconCheck
                size={16}
                strokeWidth={2}
                className={cn('mt-[3px] shrink-0', hot ? 'text-molten' : 'text-text-3')}
              />
              <span className="text-pretty">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** STORYBOARD 7.7: three tiers with a Monthly / Annual toggle; Studio highlighted and raised. */
export default function Pricing() {
  return (
    <Section id="pricing" surface="bg-0">
      <Container>
        <BillingProvider>
          <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div data-reveal className="lg:col-span-7">
              <SectionHeading id="pricing-title" eyebrow="Pricing" title="Pay for software. Print at cost-plus." />
            </div>
            <div
              data-reveal
              style={{ '--reveal-i': 1 } as CSSProperties}
              className="flex flex-col items-start gap-7 lg:col-span-4 lg:col-start-9"
            >
              <p className="max-w-[60ch] text-pretty text-body text-text-2">
                Your plan covers the platform. Every part is quoted up front, at the price you approve.
              </p>
              <BillingToggle />
            </div>
          </Reveal>
          <Reveal as="ul" amount={0.25} className="mt-20 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <li
                key={plan.id}
                data-reveal
                style={{ '--reveal-i': i } as CSSProperties}
                className={cn(plan.highlighted && 'max-lg:order-first lg:-mt-3')}
              >
                <PlanCard plan={plan} />
              </li>
            ))}
          </Reveal>
          <p className="mt-10 text-[13px] leading-5 text-text-3">
            Prices in USD, excluding tax. Print orders are billed separately at the quoted price.
          </p>
        </BillingProvider>
      </Container>
    </Section>
  );
}
