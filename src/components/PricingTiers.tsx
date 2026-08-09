import Link from 'next/link'
import {
  AI_PRICE_LABEL,
  ENTRY_PRICE_LABEL,
  INTENSIVE_DESIGN_NOTE,
  NOTICE_LINE,
  PREPAY_LINE,
  PREPAY_SIX_MONTHS_OFF,
  PREPAY_YEAR_OFF,
  PRICING_ASTERISK,
  TIERS,
  prepaidMonthlyEquivalent,
} from '@/lib/partnership'
import { INQUIRE_PATH } from '@/lib/contact'

function Check() {
  return (
    <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/12">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2.5 6.3 4.7 8.5 9.5 3.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
      </svg>
    </span>
  )
}

/** Pricing complexity bands — Focused / Full / Intensive. */
export default function PricingTiers() {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const sixMonthly = prepaidMonthlyEquivalent(tier.priceAround, PREPAY_SIX_MONTHS_OFF)
          const yearMonthly = prepaidMonthlyEquivalent(tier.priceAround, PREPAY_YEAR_OFF)
          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-[26px] p-7 sm:p-8 ${
                tier.featured
                  ? 'border-2 border-accent bg-surface shadow-[0_18px_44px_rgba(10,99,201,0.16)]'
                  : 'border border-line bg-surface shadow-[0_1px_2px_rgba(16,23,37,0.04),0_10px_28px_rgba(16,23,37,0.05)]'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Typical starting band
                </span>
              )}

              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">{tier.tagline}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{tier.name}</h3>

              <p className="mt-5 text-4xl font-semibold tracking-tight text-ink">
                ~${tier.priceAround.toLocaleString()}
                <span className="text-lg font-medium text-muted">/month</span>
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {`~$${sixMonthly.toLocaleString()}/mo if you pay 6 months ahead (10% off)`}
                <br />
                {`~$${yearMonthly.toLocaleString()}/mo if you pay a year ahead (20% off)`}
              </p>

              <p className="mt-5 text-[15px] leading-relaxed text-body">{tier.promise}</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{tier.bestFor}</p>

              <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-relaxed text-body">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={INQUIRE_PATH}
                className={`mt-7 ${tier.featured ? 'btn-primary' : 'btn-ghost'} w-full text-center`}
              >
                {tier.featured ? 'Enquire about Full' : `Enquire about ${tier.name}`}
              </Link>
            </div>
          )
        })}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-[13.5px] leading-relaxed text-muted">
        {PRICING_ASTERISK}
      </p>
      <p className="mx-auto mt-3 max-w-3xl text-center text-[13.5px] leading-relaxed text-muted">
        {INTENSIVE_DESIGN_NOTE}
      </p>
      <p className="mx-auto mt-4 max-w-3xl text-center text-[13.5px] leading-relaxed text-muted">
        From {ENTRY_PRICE_LABEL}/month · optional AI package from {AI_PRICE_LABEL}/month.{' '}
        {PREPAY_LINE} {NOTICE_LINE}
      </p>
    </div>
  )
}
