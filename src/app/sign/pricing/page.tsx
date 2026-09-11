import Link from 'next/link'
import { SIGN_PLANS } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export default function SignPricingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/sign" className="btn-ghost-sm">
        ← Back to Sign
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Sign plans</h1>
      <p className="mt-2 text-sm text-body">
        Anyone can use Kingdom Sites Sign. Starter covers light volume; Growth is for a busier month.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SIGN_PLANS.map((plan) => (
          <div key={plan.id} className="tile flex flex-col p-5">
            <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              ${plan.priceMonthly}
              <span className="text-sm font-normal text-muted"> / month</span>
            </p>
            <p className="mt-3 text-sm text-body">
              Up to <strong>{plan.contractLimit}</strong> contracts per month.
            </p>
            {plan.paymentLink ? (
              <a href={plan.paymentLink} className="btn-primary mt-6 w-full">
                Start {plan.name}
              </a>
            ) : (
              <p className="mt-6 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
                Stripe Payment Link not set yet (`NEXT_PUBLIC_SIGN_{plan.id.toUpperCase()}_LINK`).
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        Billing runs through the same Stripe account as Kingdom Sites retainers. Over-limit months upgrade
        to Growth (or wait until the next cycle).
      </p>
    </div>
  )
}
