import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import { PAYMENT_LINKS, PORTAL_URL } from '@/lib/billing'
import { annualPrice, TIERS, ANNUAL_MONTHS_CHARGED } from '@/lib/partnership'

/* A utility page for people who are already signed up — not something search
   engines should be showing anyone. */
export const metadata: Metadata = {
  title: 'Set up billing',
  description: 'Start your monthly plan with Kingdom Sites.',
  robots: { index: false, follow: false },
}

export default function Billing() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">Billing</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            {'Set up your monthly plan.'}
          </h1>
          <p className="mx-auto mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
            {'Your first month is free, so this only starts charging once your site is live and you are happy with it. Payment is handled by Stripe — your card or bank details never touch this site.'}
          </p>
        </div>
      </section>

      <section aria-label="Choose a plan" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => {
              const links = PAYMENT_LINKS[tier.id] ?? { monthly: '', annual: '' }
              return (
                <div key={tier.id} className="tile flex flex-col p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">{tier.tagline}</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">{tier.name}</h2>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                    ${tier.price}
                    <span className="text-base font-medium text-muted">/month</span>
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    {`or $${annualPrice(tier).toLocaleString()} a year`}
                  </p>

                  <div className="mt-6 flex-1" />

                  {links.monthly ? (
                    <a href={links.monthly} className="btn-primary w-full">
                      Pay monthly
                    </a>
                  ) : (
                    <span className="rounded-full bg-surface-2 px-4 py-3 text-center text-[13px] text-muted">
                      Payment link coming — email me
                    </span>
                  )}

                  {links.annual ? (
                    <a href={links.annual} className="btn-ghost mt-3 w-full">
                      {`Pay yearly — ${ANNUAL_MONTHS_CHARGED} months`}
                    </a>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="tile-elevated mt-10 p-7 sm:p-9">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Already a customer?</h2>
            {PORTAL_URL ? (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-body">
                  {'Update your card or bank details, download receipts, change plan or cancel — all from your own billing page. No need to call me.'}
                </p>
                <a href={PORTAL_URL} className="btn-ghost mt-5">
                  Manage my billing
                </a>
              </>
            ) : (
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                {'To change your card, switch plan, or cancel, email me at '}
                <a href={CONTACT_MAILTO} className="link-accent">
                  {CONTACT_EMAIL}
                </a>
                {' and it is done the same day.'}
              </p>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-body">
            {'Not signed up yet? '}
            <Link href="/local-business#pricing" className="link-accent">
              Compare the plans <span aria-hidden="true">›</span>
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
