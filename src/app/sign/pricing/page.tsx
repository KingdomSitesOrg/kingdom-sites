import Link from 'next/link'
import { SIGN_PLANS } from '@/lib/billing'
import CheckoutButton from '@/components/sign/CheckoutButton'

export const dynamic = 'force-dynamic'

export default function SignPricingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/sign" className="btn-ghost-sm">
        ← Back to Sign
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Sign plans</h1>
      <p className="mt-2 text-sm text-body">
        You must subscribe to use Kingdom Sites Sign. Choose a monthly plan to create and send
        contracts. Magic-link signers never pay.
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
              Up to <strong>{plan.contractLimit}</strong> contracts per billing cycle.
            </p>
            <CheckoutButton planId={plan.id} label={`Subscribe to ${plan.name}`} />
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        Billing runs through Stripe Checkout (subscriptions). Over-limit months upgrade to Growth
        (or wait until the next cycle). Owner admin login remains available for support.
      </p>
      <p className="mt-3 text-xs text-muted">
        Already the site owner?{' '}
        <Link href="/sign/login" className="text-accent underline-offset-2 hover:underline">
          Admin sign in
        </Link>
      </p>
    </div>
  )
}
