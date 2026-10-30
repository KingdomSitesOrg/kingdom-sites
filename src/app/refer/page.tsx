import type { Metadata } from 'next'
import DepositLanding from './DepositLanding'
import ReferForms from './ReferForms'
import { CALL_GIFT, JOIN_GIFT } from '@/lib/referrals'

const DESCRIPTION = `Introduce anyone who needs custom software, or a school to Farzana. You get $${CALL_GIFT} as soon as they have a call with me, and $${JOIN_GIFT} more when they join.`
const SHARE_TITLE = `Refer someone, get $${JOIN_GIFT} | Kingdom Sites`

/* Its own link preview (T-293), not the home page's: the card is opengraph-image.tsx here. */
export const metadata: Metadata = {
  title: 'Refer someone who needs software',
  description: DESCRIPTION,
  alternates: { canonical: '/refer' },
  openGraph: { title: SHARE_TITLE, description: DESCRIPTION, siteName: 'Kingdom Sites', type: 'website', url: '/refer' },
  twitter: { card: 'summary_large_image', title: SHARE_TITLE, description: DESCRIPTION },
}

/**
 * The referral program (T-284, Thomas, 2026-10-29): Kingdom Sites' own, for
 * any custom software, with Farzana as its section for schools. Since T-293 its
 * records, links, trackers and Thomas's console are all on this site
 * (`src/lib/referrals.ts`, `src/lib/refer/`).
 */

const STEPS = [
  {
    title: 'Share your link',
    body: 'Send it to anyone who needs software built: a school, a business, a nonprofit or any other organization. Or tell me about them here.',
  },
  {
    title: `They talk with me: $${CALL_GIFT} for you`,
    body: `I talk with them about what they need. As soon as the call has happened, $${CALL_GIFT} is yours, within 2 weeks.`,
  },
  {
    title: `They join: $${JOIN_GIFT} more`,
    body: `Once they start and their first payment clears, another $${JOIN_GIFT} is yours, within 1 to 2 months.`,
  },
]

const RULES = [
  `One $${CALL_GIFT} gift and one $${JOIN_GIFT} gift for each organization, to the first person who told me about it.`,
  `The $${JOIN_GIFT} is for a project whose build is $2,000 or more, or whose monthly fees add up to more than $3,000 in the first year. Anything smaller earns $100 instead.`,
  `The $${CALL_GIFT} is for a call that happens. A call that is booked but never held earns nothing.`,
  'Someone already talking with me does not count, unless your introduction is what got them to reply.',
  'The person who signs for an organization cannot collect a gift for their own organization.',
  'A gift sent is never asked back.',
  'If you recommend me in public, in a group, a blog or a newsletter, say that you get a gift if they have a call with me or join.',
]

export default function ReferPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <DepositLanding className="mx-auto mb-10 sm:mb-12" />
          <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Introduce someone who needs software.{' '}
            <span className="text-accent">
              ${CALL_GIFT} for the call, ${JOIN_GIFT} more when they join.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            I build custom software for any organization: apps, tools and the systems behind them.
            For schools and education, that is Farzana. Anyone can refer, customer or not.
          </p>
        </div>
      </section>

      <section aria-label="Get your link" className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <ReferForms />
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="tile-elevated flex flex-col gap-3 p-7">
                <span className="text-3xl font-semibold text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="text-pretty text-[15px] leading-relaxed text-body">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-3xl text-pretty text-[15px] leading-relaxed text-body">
            I send each gift myself, by PayPal, Venmo or Apple Cash, whichever you choose on your
            private tracker. There is no account to open.
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="tile-elevated mx-auto flex max-w-6xl flex-col gap-4 p-7 sm:p-10">
          <p className="text-sm font-semibold text-accent">For schools and education</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Farzana</h2>
          <p className="max-w-3xl text-pretty text-[15px] leading-relaxed text-body">
            Farzana is the education software I build for schools, training organizations and
            educational businesses: a proven platform with classes, students and families, payments
            and progress, and the features each school needs built on top. A school you send counts
            the same way: ${CALL_GIFT} for the call, ${JOIN_GIFT} more when it joins.
          </p>
          <a href="https://farzana.app" className="btn-ghost self-start">
            See Farzana
          </a>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">The rules</h2>
          <ul className="mt-6 flex max-w-3xl flex-col gap-3">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3 text-[15px] leading-relaxed text-body">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
