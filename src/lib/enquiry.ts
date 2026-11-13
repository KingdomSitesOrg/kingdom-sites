import * as Sentry from '@sentry/nextjs'
import { notifyThomas } from '@/lib/notify'
import { creditReferral } from '@/lib/refer/credit'

/**
 * How an enquiry reaches Thomas, whichever door it came in by: the contact
 * form (/api/inquiry), the Farzana "Book a call" form (the same route), the
 * "Submit a request" form (/api/request, T-547), or a
 * hand-off from the Intelligence chat (/api/intelligence, T-375). Email through
 * Resend (notifyThomas) and, if set, the LEAD_WEBHOOK_URL hook; it counts for a
 * referrer when the visitor came through a referral link. Delivered if either
 * destination took it.
 */

export type Enquiry = {
  name: string
  email: string
  message: string
  kind: 'enquiry' | 'farzana-call' | 'intelligence' | 'request'
  /** Farzana call requests only. */
  teaches?: string
  times?: string
  /** Project requests (/request) only: the answers, label first, in the form's order. */
  details?: [string, string][]
}

const WEBHOOK_TIMEOUT_MS = 4_000

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

async function sendWebhook(payload: Record<string, string>) {
  const url = process.env.LEAD_WEBHOOK_URL?.trim()
  if (!url) return false
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

const SUBJECT: Record<Enquiry['kind'], (name: string) => string> = {
  enquiry: (name) => `Enquiry from ${name}`,
  'farzana-call': (name) => `Farzana call request from ${name}`,
  intelligence: (name) => `Enquiry from ${name} (Ask Thomas)`,
  request: (name) => `Project request from ${name}`,
}

const FIRST_LINE: Record<Enquiry['kind'], string> = {
  enquiry: 'A new enquiry from kingdom-sites.com',
  'farzana-call': 'A new call request from kingdom-sites.com/farzana',
  intelligence: 'A new enquiry from Ask Thomas on kingdom-sites.com',
  request: 'A new project request from kingdom-sites.com/request',
}

const REFERRAL_NOTE: Record<Enquiry['kind'], string> = {
  enquiry: 'Sent an enquiry.',
  'farzana-call': 'Asked for a Farzana call.',
  intelligence: 'Sent an enquiry from Ask Thomas.',
  request: 'Submitted a project request.',
}

export async function deliverEnquiry(request: Request, e: Enquiry): Promise<boolean> {
  const farzanaCall = e.kind === 'farzana-call'

  // Came through someone's referral link: it counts as theirs (T-293).
  const referredBy = await creditReferral(request, { name: e.name, email: e.email, note: REFERRAL_NOTE[e.kind] })

  const body = [
    FIRST_LINE[e.kind],
    '',
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    ...(referredBy ? [`Referred by: ${referredBy} (through their link)`] : []),
    ...(farzanaCall
      ? [`Teaches: ${e.teaches || '(not said)'}`, `When suits them: ${e.times || '(not said)'}`]
      : []),
    ...(e.details ?? []).map(([label, value]) => `${label}: ${value || '(not said)'}`),
    '',
    e.message ? `Message:\n${e.message}` : 'Message: (none)',
    '',
    `Received: ${new Date().toISOString()}`,
  ].join('\n')

  const [emailed, hooked] = await Promise.all([
    notifyThomas(SUBJECT[e.kind](e.name), body, e.email),
    sendWebhook({
      name: e.name,
      email: e.email,
      message: e.message,
      ...(farzanaCall ? { teaches: e.teaches ?? '', times: e.times ?? '' } : {}),
      ...Object.fromEntries(e.details ?? []),
      receivedAt: new Date().toISOString(),
      kind: e.kind,
      ...(referredBy ? { referredBy } : {}),
    }),
  ])

  if (!emailed && !hooked) {
    Sentry.captureMessage('Enquiry could not be delivered — no destination succeeded', 'error')
    return false
  }
  return true
}
