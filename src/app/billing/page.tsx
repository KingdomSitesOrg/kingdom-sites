import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PORTAL_URL } from '@/lib/billing'
import { RETAINER } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Billing for Kingdom Sites retainers and consultations.',
  robots: { index: false, follow: false },
}

export default function Billing() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Billing
          </h1>
          <p className="mx-auto mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
            {RETAINER.line} AI consultation is invoiced after the hour and is separate.
          </p>
        </div>
      </section>

      <section aria-label="Existing customers" className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="tile-elevated p-7 sm:p-9">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Already a customer?</h2>
            {PORTAL_URL ? (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-body">
                  Update payment details or download receipts from the billing portal.
                </p>
                <a href={PORTAL_URL} className="btn-ghost mt-5">
                  Manage my billing
                </a>
              </>
            ) : (
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                Email me about an invoice or a payment change.{' '}
                <Link href={INQUIRE_PATH} className="link-accent">
                  {INQUIRE_CTA}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
