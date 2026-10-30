/**
 * The referral program (T-284, Thomas, 2026-10-29): its page is here, at
 * /refer, and counts for any custom software Kingdom Sites builds, Farzana
 * for schools included. Since T-293 everything lives on this site: the forms
 * post to /api/refer, a personal link is /r/<code>, each referrer's private
 * tracker is /refer/track/<token>, and Thomas runs it from /sign/referrals.
 * Nothing here pays anybody: Thomas sends each gift himself by PayPal, Venmo
 * or Apple Cash, and marks it paid.
 *
 * This file is the program's rules and words, safe for the browser too; the
 * records are in `src/lib/refer/store.ts`.
 */

export const REFER_API = '/api/refer'

export const CALL_GIFT = 20
/**
 * The join gift is up to $500 (T-303, Thomas, 2026-10-30): $500 when the
 * project's build is $2,000 or more, or its monthly fees add up to more than
 * $3,000 in the first year; $100 for anything smaller. Thomas picks which when
 * he marks it paid, and each referral keeps the amount.
 */
export const JOIN_GIFT = 500
export const SMALL_JOIN_GIFT = 100
export const JOIN_GIFTS = [JOIN_GIFT, SMALL_JOIN_GIFT] as const
export type JoinGift = (typeof JOIN_GIFTS)[number]

export function isJoinGift(value: unknown): value is JoinGift {
  return JOIN_GIFTS.some((amount) => amount === value)
}

/** How long after the call the $20 is sent, at the latest. */
export const CALL_GIFT_DAYS = 14
/** How long after the first payment clears the join gift is sent: 1 to 2 months. */
export const JOIN_GIFT_MONTHS = { from: 1, to: 2 } as const

/** The cookie a personal link leaves, and how long it credits the referrer. */
export const REFERRAL_COOKIE = 'ks_ref'
export const REFERRAL_DAYS = 90

/** What a link code looks like: `anna-7k2m`. Anything else is not one. */
export const REFERRAL_CODE = /^[a-z0-9]{1,24}-[a-z0-9]{4}$/

/** A private tracker's token: 24 random bytes, 32 letters, digits, `-` and `_`. */
export const TRACKER_TOKEN = /^[A-Za-z0-9_-]{32}$/

/** A personal link, on this site's own address. */
export const shareLink = (origin: string, code: string) => `${origin}/r/${code}`

/** A referrer's private tracker, on this site's own address. */
export const trackerLink = (origin: string, token: string) => `${origin}/refer/track/${token}`

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

export type PayoutMethod = 'paypal' | 'venmo' | 'applecash'
export type Payout = { method: PayoutMethod; handle: string; updatedAt: string }

/** How a referrer takes their gifts: PayPal, Venmo or Apple Cash, nothing else. */
export const PAYOUT_METHODS: { value: PayoutMethod; label: string; field: string; hint: string }[] = [
  {
    value: 'venmo',
    label: 'Venmo',
    field: 'Your Venmo username',
    hint: 'As it shows in Venmo, like @anna-lopez.',
  },
  {
    value: 'paypal',
    label: 'PayPal',
    field: 'Your PayPal email, or your paypal.me name',
    hint: 'The email you sign in to PayPal with works.',
  },
  {
    value: 'applecash',
    label: 'Apple Cash',
    field: 'The phone number or email you use with Apple Cash',
    hint: 'The one your iPhone uses for Messages.',
  },
]

export function payoutLabel(method: PayoutMethod | undefined | null) {
  return PAYOUT_METHODS.find((m) => m.value === method)?.label ?? ''
}

export function isPayoutMethod(value: unknown): value is PayoutMethod {
  return PAYOUT_METHODS.some((m) => m.value === value)
}

/** What was typed, without a web address's front part or a leading @. */
function bare(raw: string, hosts: string[]) {
  let text = raw.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  for (const host of hosts) {
    if (text.toLowerCase().startsWith(host)) text = text.slice(host.length)
  }
  return text.replace(/^@/, '').replace(/\/+$/, '')
}

/**
 * Where to send, checked lightly and written one way: a Venmo username as
 * `@name`, a PayPal email in lower case or a paypal.me name as
 * `paypal.me/name`, an Apple Cash phone number or email as typed.
 */
export function checkPayoutHandle(
  method: PayoutMethod,
  raw: string,
): { handle: string } | { error: string } {
  const typed = raw.trim().slice(0, 200)
  if (!typed) return { error: 'Please fill in where to send it.' }

  if (method === 'venmo') {
    const name = bare(typed, ['venmo.com/u/', 'venmo.com/', 'account.venmo.com/u/'])
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(name)) {
      return { error: 'That does not look like a Venmo username. It is the name after the @.' }
    }
    return { handle: `@${name}` }
  }

  if (method === 'paypal') {
    if (looksLikeEmail(typed)) return { handle: typed.toLowerCase() }
    const name = bare(typed, ['paypal.me/', 'paypal.com/paypalme/'])
    if (!/^[A-Za-z0-9]{1,20}$/.test(name)) {
      return { error: 'Please give the email you use with PayPal, or your paypal.me name.' }
    }
    return { handle: `paypal.me/${name}` }
  }

  if (looksLikeEmail(typed)) return { handle: typed.toLowerCase() }
  const digits = typed.replace(/\D/g, '')
  if (!/^\+?[\d\s().-]+$/.test(typed) || digits.length < 10 || digits.length > 15) {
    return { error: 'Please give a phone number with its area code, or an email.' }
  }
  return { handle: typed }
}

/**
 * A page that opens the referrer's account to pay them, where one exists:
 * Venmo always, PayPal only for a paypal.me name (an email has no page), and
 * Apple Cash never (it is paid from Messages).
 */
export function payoutLink(method: PayoutMethod, handle: string): string | null {
  if (method === 'venmo') return `https://venmo.com/u/${encodeURIComponent(handle.replace(/^@/, ''))}`
  if (method === 'paypal' && handle.startsWith('paypal.me/')) {
    return `https://paypal.me/${encodeURIComponent(handle.slice('paypal.me/'.length))}`
  }
  return null
}

/**
 * The stages Thomas marks on each referred lead, in order. A gift step
 * (`callPaid`, `joinPaid`) also records how he sent it, and `joinPaid` how
 * much: $100 or $500.
 */
export const STAGES = [
  { key: 'callBooked', button: 'Call booked' },
  { key: 'callHeld', button: 'Call held' },
  { key: 'callPaid', button: `Mark $${CALL_GIFT} paid` },
  { key: 'signed', button: 'Signed' },
  { key: 'firstPayment', button: 'First payment cleared' },
  { key: 'joinPaid', button: 'Mark join gift paid' },
] as const

export type StageKey = (typeof STAGES)[number]['key']

export function isStageKey(value: unknown): value is StageKey {
  return STAGES.some((s) => s.key === value)
}
