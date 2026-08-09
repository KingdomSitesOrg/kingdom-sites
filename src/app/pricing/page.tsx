import Link from 'next/link'
import type { Metadata } from 'next'
import PricingTiers from '@/components/PricingTiers'
import EvenGrid from '@/components/EvenGrid'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import {
  AI_PACKAGE,
  AI_PRICE_LABEL,
  COMPLEXITY_FACTORS,
  ENTRY_PRICE_LABEL,
  INTENSIVE_AI_NOTE,
} from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Pricing — monthly product retainers',
  description:
    'Focused, Full, or Intensive monthly product retainers — typical averages from about $1,000/month. Optional AI package. Month to month; prepay discounts available.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Focused, Full, or Intensive —{' '}
            <span className="text-accent">from complexity, not a menu.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Monthly retainers to design, build, ship, and maintain your product. Typical averages
            from about {ENTRY_PRICE_LABEL} — after a short call I place your product on a band.
            Month to month is fine; prepay only if you want the discount.
          </p>
        </div>
      </section>

      <section aria-label="Plans" className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <PricingTiers />
        </div>
      </section>

      <section
        aria-label="What drives the tier"
        className="border-t border-line px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              What decides Focused, Full, or Intensive.
            </h2>
          </div>
          <EvenGrid surface="pricing-complexity" maxCols={3} className="mt-12">
            {COMPLEXITY_FACTORS.map((f) => (
              <div key={f.title} className="tile flex flex-col p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{f.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      <section
        aria-label="AI package"
        className="border-t border-line px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="tile-elevated mx-auto max-w-3xl px-6 py-10 text-center sm:px-10">
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            {AI_PACKAGE.name} — {AI_PRICE_LABEL}/month
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-body">
            {AI_PACKAGE.promise} Free one-time consult when you start the conversation.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
            {INTENSIVE_AI_NOTE}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
            * {AI_PACKAGE.apiNote}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <Link href="/ai-tooling" className="btn-ghost">
              AI tooling detail
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
