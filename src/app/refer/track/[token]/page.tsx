import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { CONTACT_EMAIL } from '@/lib/contact'
import { shareLink } from '@/lib/referrals'
import { readReferrals } from '@/lib/refer/store'
import { shortDate, trackerFor, type TrackerEntry, type TrackerStep } from '@/lib/refer/tracker'
import CopyRow from '../../CopyRow'
import PayoutForm from './PayoutForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your referral tracker',
  // A private page: never in a search engine, and its address never passed on
  // to another site in the Referer header.
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  // Its own link preview, never the home page's; nothing about whose tracker it is.
  openGraph: {
    title: 'Your referral tracker | Kingdom Sites',
    description: 'How the people you referred are getting on, and how you get paid.',
    siteName: 'Kingdom Sites',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your referral tracker | Kingdom Sites',
    description: 'How the people you referred are getting on, and how you get paid.',
  },
}

/**
 * A referrer's private tracker (T-293, ported from Farzana's T-80 / T-284):
 * everyone they sent, each with its milestones and when each gift should
 * arrive, and how they want to be paid. Opened only by the secret token in its
 * address; what it may show is decided in `src/lib/refer/tracker.ts`. A token
 * that opens nothing shows the same plain page whatever it was.
 */

const money = (amount: number) => `$${amount.toLocaleString('en-US')}`

export default async function TrackerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const tracker = trackerFor(token, await readReferrals())

  if (!tracker) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">This link does not open a tracker</h1>
        <p className="max-w-prose text-pretty text-body">
          It may have been replaced with a new one. Write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
            {CONTACT_EMAIL}
          </a>{' '}
          from the address you signed up with, and I will send you yours.
        </p>
      </div>
    )
  }

  const head = await headers()
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? ''
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const link = shareLink(`${proto}://${host}`, tracker.code)
  const { sent, onTheWay, toCome } = tracker.totals
  // Money is waiting and nobody has said where to send it: ask first, at the top.
  const askNow = onTheWay > 0 && !tracker.payout
  const payout = (
    <section className="tile-elevated flex flex-col gap-4 p-7">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          {askNow ? `How should I send your ${money(onTheWay)}?` : 'How you get paid'}
        </h2>
        <p className="max-w-prose text-pretty text-body">
          I send each gift myself, by PayPal, Venmo or Apple Cash. Pick one and say where. You can
          change it here at any time.
        </p>
      </div>
      <PayoutForm token={token} saved={tracker.payout} />
    </section>
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink [overflow-wrap:anywhere]">
        {tracker.firstName
          ? `${tracker.firstName}, here is how your referrals are doing`
          : 'How your referrals are doing'}
      </h1>

      <section aria-label="Your gifts" className="tile-elevated grid grid-cols-1 gap-4 p-7 sm:grid-cols-3">
        <Figure amount={sent} label="Sent to you" />
        <Figure amount={onTheWay} label="On the way" />
        <Figure amount={toCome} label="Still to come" />
      </section>

      {askNow ? payout : null}

      {tracker.entries.length ? (
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {tracker.entries.length === 1 ? 'The one you referred' : `The ${tracker.entries.length} you referred`}
          </h2>
          <ul className="flex flex-col gap-5">
            {tracker.entries.map((entry, index) => (
              <EntryCard key={index} entry={entry} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="tile-elevated p-7 text-pretty text-body">
          No one yet. When someone comes through your link, or you tell me about them, they show here
          with each step and when your gifts arrive.
        </p>
      )}

      {askNow ? null : payout}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Your link to share</h2>
        <p className="max-w-prose text-pretty text-body">
          Send it to anyone who needs software built: a school, a business, a nonprofit or any other
          organization.
        </p>
        <CopyRow value={link} label="your link" />
      </section>
    </div>
  )
}

function Figure({ amount, label }: { amount: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-row-reverse items-baseline justify-between gap-3 sm:flex-col sm:items-start sm:gap-1">
      <span className="text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{money(amount)}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}

const STAGE = {
  going: { label: 'In progress', className: 'bg-surface-2 text-ink' },
  joined: { label: 'Joined', className: 'border border-accent text-ink' },
  ended: { label: 'Not going ahead', className: 'bg-surface-2 text-muted' },
} as const

function EntryCard({ entry }: { entry: TrackerEntry }) {
  const stage = STAGE[entry.stage]
  return (
    <li className="tile-elevated flex flex-col gap-5 p-7">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere]">{entry.name}</h3>
          <span className={`rounded-full px-3 py-1 text-sm ${stage.className}`}>{stage.label}</span>
        </div>
        <p className="text-pretty font-medium text-ink">{entry.next}</p>
        {entry.earned ? (
          <p className="text-sm text-muted">
            {money(entry.earned)} earned{entry.sent ? `, ${money(entry.sent)} sent` : ''}
          </p>
        ) : null}
      </div>
      <ol className="flex flex-col">
        {entry.steps.map((step, index) => (
          <Step key={step.key} step={step} last={index === entry.steps.length - 1} />
        ))}
      </ol>
    </li>
  )
}

const STATE_WORDS: Record<TrackerStep['state'], string> = {
  done: 'Done: ',
  current: 'Now: ',
  upcoming: 'Still to come: ',
  ended: '',
}

function Marker({ step }: { step: TrackerStep }) {
  if (step.state === 'done') {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
        ✓
      </span>
    )
  }
  if (step.state === 'current') {
    return (
      <span className="flex size-6 items-center justify-center rounded-full border-2 border-accent bg-surface">
        <span className="size-2 rounded-full bg-accent" />
      </span>
    )
  }
  if (step.state === 'ended') {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
        ✕
      </span>
    )
  }
  return <span className="size-6 rounded-full border border-line-strong bg-surface" />
}

function Step({ step, last }: { step: TrackerStep; last: boolean }) {
  const quiet = step.state === 'upcoming'
  const paidGift = step.state === 'done' && (step.key === 'callSent' || step.key === 'giftSent')
  const date = paidGift
    ? null
    : step.on
      ? shortDate(step.on)
      : step.expected
        ? step.key === 'giftSent'
          ? `Expected between ${shortDate(step.expected.from)} and ${shortDate(step.expected.to)}`
          : `Expected by ${shortDate(step.expected.to)}`
        : null

  return (
    <li className="flex gap-3" aria-current={step.state === 'current' ? 'step' : undefined}>
      <div aria-hidden="true" className="flex flex-col items-center">
        <Marker step={step} />
        {last ? null : (
          <span className={`w-px flex-1 ${step.state === 'done' ? 'bg-accent' : 'bg-line-strong'}`} />
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-0.5 ${last ? '' : 'pb-5'}`}>
        <span className={`leading-6 [overflow-wrap:anywhere] ${quiet ? 'text-muted' : 'font-medium text-ink'}`}>
          <span className="sr-only">{STATE_WORDS[step.state]}</span>
          {step.title}
        </span>
        <span className="text-pretty text-sm text-body">{step.detail}</span>
        {date ? (
          <span className={`text-sm ${step.on ? 'text-muted' : 'font-medium text-ink'}`}>{date}</span>
        ) : null}
      </div>
    </li>
  )
}
