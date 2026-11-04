import * as Sentry from '@sentry/nextjs'
import { CONTACT_EMAIL, INQUIRY_TO_EMAILS } from '@/lib/contact'
import { CALL_GIFT, JOIN_GIFT } from '@/lib/referrals'

/**
 * The site's forms' one email sender (Resend, from the verified
 * kingdom-sites.com address): `notifyThomas` tells Thomas about an enquiry, a
 * referral or a new message, `emailReferrer` sends a new referrer their own two
 * links (T-293, Thomas, 2026-10-29), and `emailMessageReply` tells a visitor
 * Thomas has answered their message, with the link back to it (2026-11-04).
 * Nothing else here writes to anyone. Needs RESEND_API_KEY; LEAD_TO_EMAIL
 * overrides Thomas's inbox for testing.
 */

const EMAIL_TIMEOUT_MS = 8_000

/**
 * Resend's own sending address only delivers to the account owner's inbox, so
 * enquiries to anyone else are rejected outright. Sending has to come from the
 * verified domain; LEAD_FROM_EMAIL overrides the address and the display name.
 */
const DEFAULT_FROM = 'Website Contact <contact@kingdom-sites.com>'

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

export async function notifyThomas(subject: string, body: string, replyTo: string) {
  const envTo = process.env.LEAD_TO_EMAIL?.trim()
  const to = envTo
    ? envTo.split(',').map((s) => s.trim()).filter(Boolean)
    : [...INQUIRY_TO_EMAILS]
  return sendMail(to, subject, body, replyTo)
}

/**
 * A new referrer's share link and private tracker, to the address they typed
 * on /refer, sent once, when the link is made. Replies go to Thomas.
 */
export async function emailReferrer(
  to: string,
  name: string,
  links: { share: string; tracker: string },
) {
  if (!looksLikeEmail(to)) return false
  const first = name.trim().split(/\s+/)[0] || 'there'
  const body = [
    `Hi ${first},`,
    '',
    'Here is your referral link. Send it to anyone who needs software built: a school, a business, a nonprofit or any other organization.',
    '',
    links.share,
    '',
    `You get $${CALL_GIFT} as soon as they have a call with me, and up to $${JOIN_GIFT} more when they join.`,
    '',
    'Your private tracker shows how each person you refer is getting on, and is where you choose how you are paid (PayPal, Venmo or Apple Cash). Keep this one to yourself:',
    '',
    links.tracker,
    '',
    'Thank you,',
    'Thomas',
    'Kingdom Sites',
  ].join('\n')
  return sendMail([to], 'Your Kingdom Sites referral link', body, CONTACT_EMAIL)
}

/**
 * Thomas answered a visitor's message (lib/chat): his words, and the link that
 * opens the conversation on the site so they can answer. Replies go to Thomas.
 */
export async function emailMessageReply(to: string, name: string, reply: string, link: string) {
  if (!looksLikeEmail(to)) return false
  const first = name.trim().split(/\s+/)[0] || 'there'
  const body = [
    `Hi ${first},`,
    '',
    'Thomas answered your message on kingdom-sites.com:',
    '',
    reply,
    '',
    'Carry on the conversation here:',
    link,
    '',
    'Kingdom Sites',
  ].join('\n')
  return sendMail([to], 'Thomas answered your message', body, CONTACT_EMAIL)
}

async function sendMail(to: string[], subject: string, body: string, replyTo: string) {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key || to.length === 0) return false

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL?.trim() || DEFAULT_FROM,
        to,
        reply_to: replyTo && looksLikeEmail(replyTo) ? replyTo : undefined,
        subject,
        text: body,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      Sentry.captureMessage(
        `Form email rejected (${response.status}): ${detail.slice(0, 400)}`,
        'error',
      )
      return false
    }
    return true
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}
