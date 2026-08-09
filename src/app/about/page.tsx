import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../../public/Photos/about.jpg'
import { INQUIRE_CTA, INQUIRE_PATH, SALES_NAME } from '@/lib/contact'
import { ENTRY_PRICE_LABEL } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Team — Kingdom Sites',
  description:
    'Meet the Kingdom Sites team — Thomas Klein (product ownership & engineering) and Jack (sales).',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="max-w-2xl">
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
          The <span className="text-accent">team.</span>
        </h1>
        <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
          Product ownership and engineering on one side, sales on the other — a small team on
          purpose so you always know who you are talking to.
        </p>
      </div>

      {/* Thomas — full bio, same voice as before */}
      <section
        aria-label="Thomas Klein"
        className="mt-14 grid items-start gap-10 lg:grid-cols-12 lg:gap-12"
      >
        <div className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-md">
            <div className="tile-elevated">
              <Image
                src={aboutImage}
                alt="Thomas and Monisha"
                quality={75}
                placeholder="blur"
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">
            Product ownership &amp; engineering
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Thomas Klein
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
            My name is Thomas Klein — a software engineer and product ownership partner for product
            owners and business founders. I would rather own a handful of custom products with you
            for years than ship a one-off project and disappear after launch.
          </p>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
            The work is mobile-led software people actually use, plus the systems and AI that make
            it real. When you email, you get the person who builds it.
          </p>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
            My wife Monisha and I take on a small number of ownership relationships at a time, on
            purpose. We are currently in the Philippines at IGSL — the International Graduate School
            of Leadership — training in biblical studies and discipleship. Client work carries on
            from here, on the same timelines as always.
          </p>
          <Link href={INQUIRE_PATH} className="link-accent mt-5 inline-block text-sm">{INQUIRE_CTA}</Link>

          <div className="mt-8 grid gap-4">
            <div className="tile p-6">
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                Product ownership, not a handoff
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                A retainer relationship: roadmap with you, design, build, release, support. Month to
                month is fine; prepay discounts if you want them. From about {ENTRY_PRICE_LABEL}/month
                after a call places your product on Focused, Full, or Intensive.{' '}
                <Link href="/pricing" className="link-accent">
                  How ownership works <span aria-hidden="true">›</span>
                </Link>
              </p>
            </div>

            <div className="tile p-6">
              <h3 className="text-sm font-semibold tracking-tight text-ink">Shipped proof</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Ruta (service-management platform — web, mobile, AI), Jam with Latin (mobile learning
                product on a retainer), and Tap to Tick (personal iOS expense app). Proof of how I
                work — not products Kingdom Sites sells off the shelf.{' '}
                <Link href="/my-work" className="link-accent">
                  Proof portfolio <span aria-hidden="true">›</span>
                </Link>
              </p>
            </div>

            <div className="tile p-6">
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                Free websites for ministries
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Ministries, missionaries raising support, and churches get the site built for free
                <span className="align-super text-[0.6em] text-accent">*</span> — the same care a
                paying client gets. It is one of the ways this business goes toward the advance of
                the gospel.{' '}
                <Link href="/mission" className="link-accent">
                  Our mission <span aria-hidden="true">›</span>
                </Link>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                <span className="align-super text-[0.75em] text-accent">*</span> My time is the
                donation. The running costs — the domain name, hosting, and any outside service the
                site depends on — stay with you, billed to you directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jack — sales, photo placeholder */}
      <section
        aria-label={`${SALES_NAME} — sales`}
        className="mt-16 border-t border-line pt-14"
      >
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-md">
              <div
                className="tile-elevated flex aspect-[4/5] w-full flex-col items-center justify-center bg-surface-2 px-6 text-center"
                aria-label={`${SALES_NAME} — photo coming soon`}
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/12 text-3xl font-semibold text-accent">
                  J
                </span>
                <p className="mt-5 text-sm font-medium text-ink">{SALES_NAME}</p>
                <p className="mt-1 text-[13px] text-muted">Photo coming soon</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">Sales</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {SALES_NAME}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
              Sales contact for product ownership. Reach out about fit, complexity band, and getting
              started — he will loop in engineering when it is time to build.
            </p>
            <Link href={INQUIRE_PATH} className="link-accent mt-5 inline-block text-sm">{INQUIRE_CTA}</Link>
          </div>
        </div>
      </section>

      <div className="mt-14 border-t border-line pt-12">
        <Link href={INQUIRE_PATH} className="btn-primary">
          {INQUIRE_CTA}
        </Link>
        <p className="mt-4 text-sm text-body">
          Sales is {SALES_NAME}; engineering is Thomas — both receive every enquiry.
        </p>
        <p className="mt-3 text-sm text-muted">
          <Link href="/software" className="underline underline-offset-4">
            Custom product ownership
          </Link>
          {' · '}
          <Link href="/pricing" className="underline underline-offset-4">
            Pricing
          </Link>
        </p>
      </div>
    </div>
  )
}
