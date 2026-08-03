import type { Metadata } from 'next'
import Link from 'next/link'
import QuoteForm from './QuoteForm'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import { ENTRY_PRICE_LABEL, TIERS } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Get a free look at your business online',
  description:
    'Tell me your trade and the towns you cover. I will check how your business shows up on Google against the ones winning those jobs, and send you what I find — free, no obligation.',
  alternates: { canonical: '/get-started' },
}

/* What the visitor gets back, so filling the form in feels worth the two
   minutes. Every one of these is something I can do before they pay anything. */
const DELIVERABLES = [
  {
    title: 'Where you turn up today',
    desc: 'What your business looks like when someone in your area searches for your service — and who is appearing above you.',
  },
  {
    title: 'What is missing from your Google listing',
    desc: 'The specific gaps costing you calls: categories, service areas, hours, photos, reviews.',
  },
  {
    title: 'The searches you are not showing up for',
    desc: 'The service-and-town phrases people are typing in your area that nobody has claimed yet.',
  },
  {
    title: 'What I would do first, and why',
    desc: 'A short plan in plain English. Take it and do it yourself if you like — no strings.',
  },
]

export default function GetStarted() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Free, no obligation</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            {'Let me look at your business '}
            <span className="text-accent">the way a customer would.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            {'Two minutes of questions below. I do the digging and send you an honest read on where you stand — whether or not you ever become a client.'}
          </p>
        </div>
      </section>

      <section aria-label="Request a free look" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <QuoteForm />

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">{'What you get back'}</h2>
            <div className="mt-6 space-y-4">
              {DELIVERABLES.map((d) => (
                <div key={d.title} className="tile p-6">
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{d.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[22px] bg-dark p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">If you want to go ahead</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {'From ' + ENTRY_PRICE_LABEL}
                <span className="text-base font-medium text-white/50">/month</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {TIERS.map((t) => (
                  <li key={t.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-white/75">
                      {t.name}
                      <span className="text-white/40"> — {t.tagline}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-white">${t.price}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-white/65">
                {'The build is free on every plan and nothing is owed until the site is live. No contract, and you can move between plans whenever you like.'}
              </p>
              <Link href="/local-business#pricing" className="mt-5 inline-block text-sm font-medium text-white underline underline-offset-4">
                {'Compare what each plan delivers ›'}
              </Link>
            </div>

            <p className="mt-8 text-sm leading-relaxed text-body">
              {'Would rather just talk? Email me at '}
              <a href={CONTACT_MAILTO} className="link-accent">
                {CONTACT_EMAIL}
              </a>
              {' and we will find a time to speak.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
