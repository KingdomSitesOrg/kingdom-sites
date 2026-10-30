import type { Metadata } from 'next'
import DepositLanding from './DepositLanding'
import ReferForms from './ReferForms'
import { CALL_GIFT, JOIN_GIFT, SMALL_JOIN_GIFT } from '@/lib/referrals'

const DESCRIPTION = `Introduce anyone who needs custom software, or a school to Farzana Classroom. You get $${CALL_GIFT} as soon as they have a call with me, and up to $${JOIN_GIFT} more when they join.`
const SHARE_TITLE = `Refer someone, get up to $${JOIN_GIFT} | Kingdom Sites`

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
 * any custom software, with Farzana Classroom as its section for schools. Since T-293 its
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
    title: `They join: up to $${JOIN_GIFT} more`,
    body: `Once they start and their first payment clears, up to $${JOIN_GIFT} more is yours, within 1 to 2 months.`,
  },
]

const RULES = [
  `One $${CALL_GIFT} gift and one join gift for each organization, to the first person who told me about it.`,
  `The $${JOIN_GIFT} is for a project whose build is $2,000 or more, or whose monthly fees add up to more than $3,000 in the first year. Anything smaller earns $${SMALL_JOIN_GIFT} instead.`,
  `The $${CALL_GIFT} is for a call that happens. A call that is booked but never held earns nothing.`,
  'Someone already talking with me does not count, unless your introduction is what got them to reply.',
  'The person who signs for an organization cannot collect a gift for their own organization.',
  'A gift sent is never asked back.',
  'If you recommend me in public, in a group, a blog or a newsletter, say that you get a gift if they have a call with me or join.',
]

export default function ReferPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="cn-wrap pb-14 pt-16 sm:pb-20 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
          <p className="cn-kicker cn-rise">Refer someone</p>
          <h1 className="cn-display cn-h3 cn-rise cn-rise-2 mt-5 text-balance">
            Introduce someone who needs software.{' '}
            <span className="text-accent">
              ${CALL_GIFT} for the call, up to ${JOIN_GIFT} more when they join.
            </span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
            I build custom software for any organization: apps, tools and the systems behind them.
            For schools and education, that is Farzana Classroom. Anyone can refer, customer or not.
          </p>
          </div>
          <DepositLanding className="mx-auto w-full max-w-md" />
        </div>
      </section>

      <section aria-label="Get your link" className="cn-wrap pb-16 sm:pb-24">
        <div>
          <ReferForms />
        </div>
      </section>

      <section className="cn-wrap pb-16 sm:pb-24">
        <div className="border-t border-line pt-12">
          <h2 className="cn-display cn-h3">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="tile-elevated flex flex-col gap-3 p-7">
                <span className="cn-kicker">
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

      <section className="cn-wrap pb-16 sm:pb-24">
        <div className="tile-elevated flex flex-col gap-4 p-7 sm:p-10">
          <p className="cn-kicker">For schools and education</p>
          <h2 className="cn-display cn-h3">Farzana Classroom</h2>
          <p className="max-w-3xl text-pretty text-[15px] leading-relaxed text-body">
            Farzana Classroom is the education software I build for schools, training organizations and
            educational businesses: a proven platform with classes, students and families, payments
            and progress, and the features each school needs built on top. A school you send counts
            the same way: ${CALL_GIFT} for the call, up to ${JOIN_GIFT} more when it joins.
          </p>
          <a href="https://farzana.app" className="btn-ghost self-start">
            See Farzana Classroom
          </a>
        </div>
      </section>

      <section className="cn-wrap pb-24 sm:pb-32">
        <div className="border-t border-line pt-12">
          <h2 className="cn-display cn-h3">The rules</h2>
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
