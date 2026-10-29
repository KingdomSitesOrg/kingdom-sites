/**
 * The referral program (T-284, Thomas, 2026-10-29): its page is here, at
 * /refer, and counts for any custom software Kingdom Sites builds, Farzana
 * for schools included. The records, each referrer's private tracker and
 * Thomas's console live in the Farzana app, which this page's forms post to
 * from the browser (it allows this site's address). Nothing here keeps or
 * pays anything: Thomas sends each gift himself by PayPal, Venmo or Apple Cash.
 */

/** The Farzana app, where the program's records live. */
export const REFER_SERVICE = (
  process.env.NEXT_PUBLIC_REFER_SERVICE_URL?.trim() || 'https://farzana.app'
).replace(/\/+$/, '')

export const REFER_API = `${REFER_SERVICE}/api/refer`

export const CALL_GIFT = 20
export const JOIN_GIFT = 500

/** A personal link, on this site's own address: /r/<code> forwards to the Farzana app. */
export const shareLink = (origin: string, code: string) => `${origin}/r/${code}`

/** A referrer's private tracker, on the Farzana app. */
export const trackerLink = (token: string) => `${REFER_SERVICE}/refer/track/${token}`
