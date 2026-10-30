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
      <section className="cn-wrap pb-14 pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <p className="cn-kicker cn-rise">Billing</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5">Pay Kingdom Sites</h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
            Monthly retainers bill the same card every month after they sign up once.
            One-time invoices are a separate button.
          </p>
        </div>
      </section>

      <section aria-label="Pay" className="cn-wrap pb-24 sm:pb-32">
        <div className="cn-rise cn-rise-3 grid gap-6 md:grid-cols-2">
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
