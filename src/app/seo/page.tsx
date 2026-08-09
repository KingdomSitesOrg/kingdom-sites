import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Websites & local SEO',
  description:
    'Websites, Google Business Profile, and local search for businesses that need customers to find them — scoped after a short conversation.',
  alternates: { canonical: '/seo' },
  robots: { index: true, follow: true },
}

const INCLUDES = [
  {
    title: 'A website built to get the phone ringing',
    desc: 'Your services, your area, a clear way to call or enquire on every screen — fast on a phone, where most customers land.',
  },
  {
    title: 'Your Google listing sorted out',
    desc: 'Claimed, filled in properly: categories, service areas, hours, photos, and the details that decide who shows up first.',
  },
  {
    title: 'Local search that compounds',
    desc: 'Real pages for what you do and where you work, plus steady posts and listing activity so you stay present in search.',
  },
  {
    title: 'Scoped to your market',
    desc: 'No fixed menu of plans. After a short conversation we agree what you need and what it costs — then get it live.',
  },
]

export default function SeoPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Websites and local SEO that{' '}
            <span className="text-accent">get you found.</span>
          </h1>
          <p className="mx-auto mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
            A clean site, a proper Google listing, and local search work so customers find you when
            they need what you do — without you living in a marketing dashboard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <Link href="/pricing" className="btn-ghost">
              Product pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {INCLUDES.map((item) => (
              <div key={item.title} className="tile p-6 sm:p-7">
                <h2 className="text-base font-semibold tracking-tight text-ink">{item.title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="tile-elevated mt-10 px-6 py-10 text-center sm:px-10">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink">
              Ready to show up where customers look?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-body">
              Send an enquiry with your trade and towns. We will reply with what makes sense and
              what it would cost — no obligation.
            </p>
            <div className="mt-7">
              <Link href={INQUIRE_PATH} className="btn-primary">
                {INQUIRE_CTA}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
