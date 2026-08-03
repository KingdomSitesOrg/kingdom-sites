import Link from 'next/link'
import type { Metadata } from 'next'
import PricingTiers from '@/components/PricingTiers'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import EvenGrid from '@/components/EvenGrid'
import {
  AUDIENCE_OTHER,
  AUDIENCE_TRADES,
  ENTRY_PRICE_LABEL,
  FAQS,
  FIRST_MONTH_FREE_SHORT,
  PILLARS,
  SEO_EXPLAINER,
  SOFTWARE_ANGLE,
  STEPS,
} from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Plans for local businesses',
  description:
    `Websites, Google listings and local SEO for pressure washing, window cleaning, landscaping, restaurants, salons and any local business — three monthly plans from $299, build free, no contract.`,
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
      'The blog posts and SEO hours on your plan',
      'Google listing kept current — photos and simple updates',
      'The small site changes you have asked for',
      'A plain note on what we did (Growth and Everything)',
    ],
  },
  {
    when: 'As it makes sense',
    items: [
      'A new page when you add a service or town (plan limits apply)',
      'Seasonal offers put up and taken down',
      'Extra SEO focus on what is already working',
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
            {'One monthly fee covers the website, your Google listing, the search work, the photos and the reviews. Three plans, each one specific about what it delivers — so you know exactly what you are buying.'}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="#pricing" className="btn-primary">
              {'See the plans — from ' + ENTRY_PRICE_LABEL + '/month'}
            </Link>
            <Link href="/get-started" className="btn-ghost">
              Free look at your business
            </Link>
          </div>
          <p className="mt-6 text-[13.5px] leading-relaxed text-muted">
            {FIRST_MONTH_FREE_SHORT + ' · The build is included · No contract'}
          </p>
        </div>
      </section>

      {/* Everything included */}
      <section aria-label="What is included" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">On every plan</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'What the partnership covers.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              {'Every plan does all four of these. What changes between them is how much of each you get every month.'}
            </p>
          </div>

          <EvenGrid surface="local-business-pillars" maxCols={2} className="mt-12">
            {PILLARS.map((item) => (
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
          </EvenGrid>
        </div>
      </section>

      {/* How getting found actually works */}
      <section
        id="how-it-works"
        aria-label="How getting found works"
        className="scroll-mt-20 border-t border-line px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">In plain English</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'What a blog post has to do with your phone ringing.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              {'The plans below count pages and posts. Before you pay for either, you should understand exactly why they are worth anything — most people selling them never explain it, which is precisely why so many owners think it is a con.'}
            </p>
          </div>

          <div className="mt-12 space-y-5">
            {SEO_EXPLAINER.map((item, i) => (
              <div key={item.title} className="tile flex gap-5 p-7 sm:gap-7 sm:p-8">
                <span className="text-2xl font-semibold tracking-tight text-line-strong sm:text-3xl" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-body">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-[15px] leading-relaxed text-body">
            {'None of this is fast, and anyone telling you otherwise is selling you something. It is steady work that stacks up — which is exactly why it is sold as a monthly partnership and not a one-off build.'}
          </p>
        </div>
      </section>

      {/* The plans */}
      <section id="pricing" aria-label="Plans and pricing" className="scroll-mt-20 border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The plans</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'Counted work, not vague promises.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              {'Each plan is simple on purpose: how many pages, how many posts, and how many hours of SEO work you get each month. That is how you know what you are buying — and how I keep doing this without cutting corners.'}
            </p>
          </div>

          <div className="mt-14">
            <PricingTiers />
          </div>

          {/* Honesty about where these prices sit in the market. */}
          <div className="tile-elevated mt-12 p-7 sm:p-10">
            <h3 className="text-xl font-semibold tracking-tight text-ink">
              {'What this normally costs'}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-body">
              {'Worth knowing before you talk to anyone else. A managed website alone often runs $95 to $195 a month. A Google listing manager is another few hundred. Full agency retainers for home services commonly land at $1,000 to $3,500 a month.'}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-body">
              {'Foundation is honest about the hours: one post and one hour of SEO keeps you present. Growth roughly doubles that work. Everything is the partner plan — weekly posts and two to three hours of SEO a month — for owners who want the phone to ring more, not a prettier brochure.'}
            </p>
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

      {/* Software as well as search */}
      <section aria-label="Software and search" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The other half</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {'I do software as well as search.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/65">
              {'This is the part no agency can match. A marketing company can promote you but cannot build you anything; a developer can build you something but does not care whether anyone finds it. You are getting one person who does both, as a partner in the business rather than an hourly contractor.'}
            </p>
          </div>

          <EvenGrid surface="local-business-software" maxCols={3} className="mt-12">
            {SOFTWARE_ANGLE.map((s) => (
              <div key={s.title} className="tile-dark p-7 sm:p-8">
                <h3 className="text-base font-semibold tracking-tight text-white">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/60">{s.desc}</p>
              </div>
            ))}
          </EvenGrid>

          <div className="mt-10 text-center">
            <Link href="/my-work" className="btn-primary">
              See the software I have built
            </Link>
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
          <EvenGrid surface="local-business-steps" maxCols={4} className="mt-12">
            {STEPS.map((s) => (
              <div key={s.step} className="tile flex flex-col p-7">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {s.step}
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{s.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      {/* Who this is for */}
      <section aria-label="Who I work with" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {'Who this is built for'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
            {'If your customers find you by searching and decide by calling, this fits. I work with any business — the trades are simply where I am sharpest, because I know the work from the inside.'}
          </p>

          <p className="mt-10 text-sm font-medium text-body">The trades</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {AUDIENCE_TRADES.map((trade) => (
              <span
                key={trade}
                className="rounded-full border border-line bg-surface px-4 py-2 text-[13.5px] font-medium text-body"
              >
                {trade}
              </span>
            ))}
          </div>

          <p className="mt-10 text-sm font-medium text-body">And every other local business</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {AUDIENCE_OTHER.map((kind) => (
              <span key={kind} className="rounded-full bg-surface-2 px-4 py-2 text-[13.5px] text-body">
                {kind}
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
