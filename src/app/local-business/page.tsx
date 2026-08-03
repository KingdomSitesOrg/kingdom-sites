import Link from 'next/link'
import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import { FAQS, INCLUDED, MONTHLY_PRICE_LABEL, STEPS, TRADES } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'For local businesses',
  description:
    `Websites, Google listings and local SEO for pressure washing, window cleaning, landscaping and other home service businesses — one monthly fee, no setup cost, cancel any time.`,
  alternates: { canonical: '/local-business' },
}

/* The difference between how this is normally sold and how I sell it. Left is
   what the owner has already been through; right is the partnership. */
const COMPARISON = [
  {
    them: 'A few thousand dollars up front',
    us: 'Nothing up front, and nothing at all until the site is live',
  },
  {
    them: 'Handed over on launch day, then silence',
    us: 'Someone still working on it every month',
  },
  {
    them: 'Change requests billed by the hour',
    us: 'Text me the change, it is included',
  },
  {
    them: 'The website only — Google listing not their problem',
    us: 'The listing, the reviews and the searching are the actual job',
  },
  {
    them: 'A dashboard you are supposed to learn',
    us: 'A short note each month you can read on a job site',
  },
  {
    them: 'A twelve-month contract',
    us: 'Cancel whenever, and the domain name is yours',
  },
]

/* What actually happens after launch, so the monthly fee is not a mystery. */
const ONGOING = [
  {
    when: 'Every month',
    items: [
      'New job photos posted to your site and your Google listing',
      'Fresh posts and updates on the listing so it stays active',
      'A check on what people searched to find you, and what they did next',
      'Any changes you have asked for',
    ],
  },
  {
    when: 'As it makes sense',
    items: [
      'A new page for a service you have started offering',
      'A new page for a town you have started covering',
      'Seasonal offers put up and taken down at the right time',
      'Chasing the reviews that keep you ahead of the business next door',
    ],
  },
]

export default function LocalBusiness() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">For local businesses</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            {'Everything that gets you found, '}
            <span className="text-accent">handled for you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            {'One monthly fee covers the website, your Google listing, the searching, the photos, the reviews, and every change you ask for along the way. You will not get an invoice for any of it.'}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className="btn-primary">
              See how you look online — free
            </Link>
            <a href={CONTACT_MAILTO} className="btn-ghost">Email me instead</a>
          </div>
        </div>
      </section>

      {/* Everything included */}
      <section aria-label="What is included" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">{'In the ' + MONTHLY_PRICE_LABEL + ' a month'}</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'All of this, all of the time.'}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {INCLUDED.map((item) => (
              <div key={item.title} className="tile flex gap-4 p-7">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6.3 4.7 8.5 9.5 3.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What the monthly fee actually buys after launch */}
      <section aria-label="What happens each month" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">After it is live</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {'What I am actually doing every month.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/65">
              {'This is the part that makes a monthly fee fair. A site nobody touches goes quiet within a year — the work below is what stops that happening.'}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {ONGOING.map((block) => (
              <div key={block.when} className="tile-dark p-7 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">{block.when}</p>
                <ul className="mt-5 space-y-3">
                  {block.items.map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-relaxed text-white/75">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it is normally sold vs how I sell it */}
      <section aria-label="How this compares" className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">The difference</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'You have probably been sold a website before.'}
            </h2>
          </div>

          <div className="tile-elevated mt-12 overflow-hidden">
            <div className="grid grid-cols-2 border-b border-line bg-surface-2">
              <p className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted sm:px-8">
                The usual way
              </p>
              <p className="border-l border-line px-5 py-4 text-xs font-semibold uppercase tracking-wider text-accent sm:px-8">
                Working with me
              </p>
            </div>
            {COMPARISON.map((row) => (
              <div key={row.them} className="grid grid-cols-2 border-b border-line last:border-b-0">
                <p className="px-5 py-5 text-sm leading-relaxed text-muted sm:px-8">{row.them}</p>
                <p className="border-l border-line px-5 py-5 text-sm font-medium leading-relaxed text-ink sm:px-8">
                  {row.us}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section aria-label="How it works" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Getting started</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'From a phone call to a live site.'}
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="tile flex flex-col p-7">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {s.step}
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trades */}
      <section aria-label="Trades I work with" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {'Trades this is built for'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
            {'If your customers find you by searching and decide by calling, this fits. If your trade is not listed, ask anyway.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {TRADES.map((trade) => (
              <span
                key={trade}
                className="rounded-full border border-line bg-surface px-4 py-2 text-[13.5px] font-medium text-body"
              >
                {trade}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="Questions" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow eyebrow-blue">Straight answers</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'The questions everybody asks.'}
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="tile p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{f.q}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Contact" className="px-5 pb-24 sm:px-8">
        <div className="tile-elevated mx-auto max-w-4xl px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {'Find out where you stand — it costs nothing.'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-body">
            {'Tell me your trade and the towns you cover, and I will send you an honest read on how you show up against the businesses winning those jobs today.'}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link href="/get-started" className="btn-primary">
              Get my free look
            </Link>
            <a href={CONTACT_MAILTO} className="link-accent text-sm">{CONTACT_EMAIL}</a>
          </div>
        </div>
      </section>
    </div>
  )
}
