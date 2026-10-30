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
        Upload a PDF, click where each person signs, and send it. They sign from their phone in about
        a minute, and everyone gets the signed PDF. People you send to never need an account.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SIGN_PLANS.map((plan) => (
          <div key={plan.id} className="tile flex flex-col p-5">
            <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              ${plan.priceMonthly}
              <span className="text-sm font-normal text-muted"> / month</span>
            </p>
            <p className="mt-3 flex-1 text-sm text-body">
              Send up to <strong>{plan.contractLimit}</strong> documents a month.
            </p>
            <Link href={`/sign/signup?plan=${plan.id}`} className="btn-primary mt-6 w-full">
              Start {plan.name}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        Billed monthly by card through Stripe. Change plan or cancel any time from your account page.
        Already have an account?{' '}
        <Link href="/sign/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
