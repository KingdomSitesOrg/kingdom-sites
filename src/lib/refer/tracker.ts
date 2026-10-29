import {
  CALL_GIFT,
  CALL_GIFT_DAYS,
  JOIN_GIFT,
  JOIN_GIFT_MONTHS,
  payoutLabel,
  type PayoutMethod,
} from '@/lib/referrals'
import { referrerByTracker, type Referred, type ReferralsDoc } from './store'

/**
 * A referrer's private tracker, ported from Farzana's (T-80, T-284): for each
 * person they sent, the few milestones from "Referred" to "$500 sent", where it
 * stands now, and when each gift should arrive. Everything is read off what
 * Thomas marks on /sign/referrals; nothing here pays anybody.
 *
 * What a referrer may see is decided here and nowhere else: their own
 * referrals only, and of each one its name and its stage, nothing more.
 */

export type StepKey =
  | 'referred'
  | 'booked'
  | 'held'
  | 'callSent'
  | 'signed'
  | 'paid'
  | 'giftSent'
  | 'ended'

export type StepState = 'done' | 'current' | 'upcoming' | 'ended'

export type TrackerStep = {
  key: StepKey
  title: string
  detail: string
  state: StepState
  /** The day it happened, as `YYYY-MM-DD`, when it has. */
  on: string | null
  /** A gift's expected window, from and to as `YYYY-MM-DD`. */
  expected: { from: string; to: string } | null
}

export type TrackerEntry = {
  /** Only the name: nothing else about them reaches the referrer. */
  name: string
  stage: 'going' | 'joined' | 'ended'
  next: string
  steps: TrackerStep[]
  earned: number
  sent: number
}

export type Tracker = {
  firstName: string
  code: string
  entries: TrackerEntry[]
  payout: { method: PayoutMethod; handle: string } | null
  totals: { sent: number; onTheWay: number; toCome: number }
}

const day = (at: string | undefined) => (at ? at.slice(0, 10) : null)

function addDays(on: string, days: number) {
  const d = new Date(`${on}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function addMonths(on: string, months: number) {
  const d = new Date(`${on}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function shortDate(on: string) {
  return new Date(`${on}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const VIA_DETAIL: Record<Referred['via'], string> = {
  link: 'They came through your link.',
  form: 'You told us about them.',
}

function paidLine(amount: number, via: PayoutMethod | undefined, on: string) {
  const how = payoutLabel(via)
  return how ? `Paid $${amount} by ${how} on ${shortDate(on)}.` : `Paid $${amount} on ${shortDate(on)}.`
}

function onItsWay(amount: number, chosen: PayoutMethod | null) {
  return chosen
    ? `Your $${amount} is on its way by ${payoutLabel(chosen)}.`
    : `Your $${amount} is ready. Tell us below how to send it.`
}

function nextSentence(step: TrackerStep, chosen: PayoutMethod | null) {
  const by = chosen ? ` by ${payoutLabel(chosen)}` : ''
  switch (step.key) {
    case 'booked':
      return 'Next: Thomas books a call with them.'
    case 'held':
      return `Next: the call. Once it has happened, $${CALL_GIFT} is yours.`
    case 'callSent':
      return chosen
        ? `Next: your $${CALL_GIFT} arrives${by}.`
        : `Next: your $${CALL_GIFT}. Tell us below how to send it.`
    case 'signed':
      return 'Next: they decide whether to build with Thomas.'
    case 'paid':
      return `Next: their first payment. Once it clears, $${JOIN_GIFT} more is yours.`
    case 'giftSent':
      return chosen
        ? `Next: your $${JOIN_GIFT} arrives${by}.`
        : `Next: your $${JOIN_GIFT}. Tell us below how to send it.`
    default:
      return step.detail
  }
}

/** One referred person's timeline, from what Thomas has marked. */
export function timeline(lead: Referred, chosen: PayoutMethod | null = null): TrackerEntry {
  const booked = day(lead.callBookedAt)
  const held = day(lead.callHeldAt)
  const callSent = day(lead.callPaidAt)
  const signed = day(lead.signedAt)
  const firstPayment = day(lead.firstPaymentAt)
  const giftSent = day(lead.joinPaidAt)

  const isBooked = Boolean(booked || held)
  const isSigned = Boolean(signed || firstPayment)

  type Draft = Omit<TrackerStep, 'state'> & { done: boolean }
  const drafts: Draft[] = [
    {
      key: 'referred',
      title: 'Referred',
      detail: VIA_DETAIL[lead.via],
      done: true,
      on: day(lead.at),
      expected: null,
    },
    {
      key: 'booked',
      title: 'Call booked',
      detail: isBooked ? 'A call with Thomas is booked.' : 'Thomas finds a time to talk with them.',
      done: isBooked,
      on: booked,
      expected: null,
    },
    {
      key: 'held',
      title: `Call held: $${CALL_GIFT} earned`,
      detail: held
        ? `The call happened, so $${CALL_GIFT} is yours.`
        : `Once the call has happened, $${CALL_GIFT} is yours.`,
      done: Boolean(held),
      on: held,
      expected: null,
    },
    {
      key: 'callSent',
      title: `$${CALL_GIFT} sent`,
      detail: callSent
        ? paidLine(CALL_GIFT, lead.callPaidVia, callSent)
        : held
          ? onItsWay(CALL_GIFT, chosen)
          : `Within ${CALL_GIFT_DAYS / 7} weeks of the call.`,
      done: Boolean(callSent),
      on: callSent,
      expected: held && !callSent ? { from: held, to: addDays(held, CALL_GIFT_DAYS) } : null,
    },
    {
      key: 'signed',
      title: 'Signed',
      detail: isSigned ? 'They have signed on to build with Thomas.' : 'They decide whether to build with Thomas.',
      done: isSigned,
      on: signed,
      expected: null,
    },
    {
      key: 'paid',
      title: `First payment cleared: $${JOIN_GIFT} earned`,
      detail: firstPayment
        ? `Their first payment cleared, so $${JOIN_GIFT} more is yours.`
        : `Once their first payment clears, $${JOIN_GIFT} more is yours.`,
      done: Boolean(firstPayment),
      on: firstPayment,
      expected: null,
    },
    {
      key: 'giftSent',
      title: `$${JOIN_GIFT} sent`,
      detail: giftSent
        ? paidLine(JOIN_GIFT, lead.joinPaidVia, giftSent)
        : firstPayment
          ? onItsWay(JOIN_GIFT, chosen)
          : `${JOIN_GIFT_MONTHS.from} to ${JOIN_GIFT_MONTHS.to} months after their first payment.`,
      done: Boolean(giftSent),
      on: giftSent,
      expected:
        firstPayment && !giftSent
          ? {
              from: addMonths(firstPayment, JOIN_GIFT_MONTHS.from),
              to: addMonths(firstPayment, JOIN_GIFT_MONTHS.to),
            }
          : null,
    },
  ]

  const earned = (held ? CALL_GIFT : 0) + (firstPayment ? JOIN_GIFT : 0)
  const sent = (callSent ? CALL_GIFT : 0) + (giftSent ? JOIN_GIFT : 0)

  // Not going ahead, unless they have already paid: what happened stays, a
  // gift earned and not yet sent is still on its way, nothing else is coming.
  const ended = Boolean(lead.endedAt) && !firstPayment
  const kept = ended ? drafts.filter((d) => d.done || (d.key === 'callSent' && held)) : drafts

  let currentFound = false
  const steps: TrackerStep[] = kept.map(({ done, ...step }) => {
    if (done) return { ...step, state: 'done' }
    if (currentFound) return { ...step, state: 'upcoming' }
    currentFound = true
    return { ...step, state: 'current' }
  })

  if (ended) {
    steps.push({
      key: 'ended',
      title: 'Not going ahead',
      detail:
        earned === 0
          ? 'They are not going ahead, so there is no gift for this one.'
          : sent === earned
            ? `They are not going ahead. The $${earned} you earned has been sent.`
            : `They are not going ahead. The $${earned} you earned is still yours.`,
      state: 'ended',
      on: null,
      expected: null,
    })
  }

  const current = steps.find((s) => s.state === 'current')
  const next = current
    ? nextSentence(current, chosen)
    : ended
      ? 'Nothing more is coming for this one.'
      : `All done: $${earned} sent for this one.`

  return { name: lead.name, stage: ended ? 'ended' : isSigned ? 'joined' : 'going', next, steps, earned, sent }
}

/** The tracker a token opens, or null when it opens none. Newest first. */
export function trackerFor(token: string, doc: ReferralsDoc): Tracker | null {
  const referrer = referrerByTracker(doc.referrers, token)
  if (!referrer) return null
  const chosen = referrer.payout?.method ?? null
  const entries = doc.referred
    .filter((r) => r.code === referrer.code)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((r) => timeline(r, chosen))

  const sent = entries.reduce((sum, e) => sum + e.sent, 0)
  const earned = entries.reduce((sum, e) => sum + e.earned, 0)
  const toCome = entries
    .filter((e) => e.stage !== 'ended')
    .reduce((sum, e) => sum + CALL_GIFT + JOIN_GIFT - e.earned, 0)

  return {
    firstName: referrer.name.trim().split(/\s+/)[0] ?? '',
    code: referrer.code,
    entries,
    payout: referrer.payout ? { method: referrer.payout.method, handle: referrer.payout.handle } : null,
    totals: { sent, onTheWay: earned - sent, toCome },
  }
}
