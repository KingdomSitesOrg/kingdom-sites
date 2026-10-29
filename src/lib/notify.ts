import * as Sentry from '@sentry/nextjs'
import { INQUIRY_TO_EMAILS } from '@/lib/contact'

/**
 * The one way the site's forms tell Thomas something: an email to his own
 * inbox (Resend), from the enquiry form and the referral program. It never
 * writes to anyone else. Needs RESEND_API_KEY; LEAD_TO_EMAIL overrides the
 * inbox for testing.
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
  const key = process.env.RESEND_API_KEY?.trim()
  const envTo = process.env.LEAD_TO_EMAIL?.trim()
  const to = envTo
    ? envTo.split(',').map((s) => s.trim()).filter(Boolean)
    : [...INQUIRY_TO_EMAILS]
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
        `Inquiry email rejected (${response.status}): ${detail.slice(0, 400)}`,
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
