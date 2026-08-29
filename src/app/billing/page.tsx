import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PAY_URL, RETAINER_300, RETAINER_800 } from '@/lib/billing'

export const metadata: Metadata = {
  title: 'Pay',
  description: 'Pay a Kingdom Sites invoice or start a monthly retainer.',
  robots: { index: false, follow: false },
}

export default function Billing() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Pay Kingdom Sites
          </h1>
          <p className="mx-auto mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
            Monthly retainers bill the same card every month after they sign up once.
            One-time invoices are a separate button.
          </p>
        </div>
      </section>

      <section aria-label="Pay" className="px-5 pb-20 sm:px-8">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <div className="tile-elevated p-7 sm:p-9">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Monthly retainer</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">
              They enter the card once. Stripe charges it every month and emails a receipt.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href={RETAINER_300} className="btn-primary">
                $300 / month
              </a>
              <a href={RETAINER_800} className="btn-primary">
                $800 / month
              </a>
            </div>
          </div>

          <div className="tile-elevated p-7 sm:p-9">
            <h2 className="text-lg font-semibold tracking-tight text-ink">One-time invoice</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">
              Minimum $10. They type the amount on the next screen.
            </p>
            <a href={PAY_URL} className="btn-ghost mt-5">
              Pay with Stripe
            </a>
            <p className="mt-6 text-[14px] leading-relaxed text-muted">
              Question about an invoice?{' '}
              <Link href={INQUIRE_PATH} className="link-accent">
                {INQUIRE_CTA}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
