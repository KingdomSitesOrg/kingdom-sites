import Link from 'next/link'
import { annualPrice, FIRST_MONTH_FREE_LONG, TIERS, UNLIMITED_NOTE } from '@/lib/partnership'

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

/* The three plans. Kept as one component so the home page, the local business
   page and the billing page can never drift apart on price or wording. */
export default function PricingTiers({ showLimits = true }: { showLimits?: boolean }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => (
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
                Most businesses start here
              </span>
            )}

            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">{tier.tagline}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{tier.name}</h3>

            <p className="mt-5 text-4xl font-semibold tracking-tight text-ink">
              ${tier.price}
              <span className="text-lg font-medium text-muted">/month</span>
            </p>
            <p className="mt-1.5 text-[13px] text-muted">
              {`or $${annualPrice(tier).toLocaleString()} a year — two months free`}
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

            {showLimits && tier.limits.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-line pt-5">
                {tier.limits.map((l) => (
                  <li key={l} className="flex gap-3 text-[13px] leading-relaxed text-muted">
                    <span className="mt-[9px] h-px w-3 shrink-0 bg-muted" aria-hidden="true" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/get-started"
              className={`mt-7 ${tier.featured ? 'btn-primary' : 'btn-ghost'} w-full`}
            >
              {tier.featured ? 'Start with Growth' : `Start with ${tier.name}`}
            </Link>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-[13.5px] leading-relaxed text-muted">
        <span className="text-accent">*</span> {UNLIMITED_NOTE}
      </p>
      <p className="mx-auto mt-4 max-w-3xl text-center text-[13.5px] leading-relaxed text-muted">
        {FIRST_MONTH_FREE_LONG + ' No contract either — change plan or cancel whenever you like.'}
      </p>
    </div>
  )
}
