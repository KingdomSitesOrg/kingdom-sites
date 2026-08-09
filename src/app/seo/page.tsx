import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Websites & local search (side work)',
  description:
    'Occasionally: websites, Google listing help, and local search — secondary to product ownership for custom software.',
  alternates: { canonical: '/seo' },
  robots: { index: true, follow: true },
}

export default function SeoSidePage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">Side service</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Websites and local search{' '}
            <span className="text-accent">when useful.</span>
          </h1>
          <p className="mx-auto mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
            Main work is custom products and product ownership — not local SEO
            plans. When a simple site, Google listing, or light local search help
            is the right next step, that can still be scoped.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/pricing" className="btn-ghost">
              Product ownership
            </Link>
            <Link href="/software" className="btn-ghost">
              Custom software
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="tile p-7 sm:p-9">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              What this is
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">
              Help with a small business website, getting a Google Business
              Profile in order, or improving how you show up in local search —
              only when it makes sense for your situation. There is no menu of
              SEO pricing tiers and no free-look funnel.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-body">
              Scope and price are decided after a short conversation. Email is
              the simplest start.
            </p>

            <h2 className="mt-8 text-lg font-semibold tracking-tight text-ink">
              What this is not
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">
              This is not the core offer. For ongoing product ownership of custom
              software (mobile-led products, platforms, AI in the product), see{' '}
              <Link href="/" className="link-accent">
                the home page
              </Link>{' '}
              or{' '}
              <Link href="/software" className="link-accent">
                custom software
              </Link>
              .
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
              <Link href={INQUIRE_PATH} className="link-accent text-sm">{INQUIRE_CTA}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
