import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { CONTACT_EMAIL } from '@/lib/contact'

/**
 * Where the free-look enquiries actually go.
 *
 * The form posts here and this route delivers it — by email, and to a webhook
 * as well if one is configured. Nothing is written to a database, because there
 * isn't one: an enquiry is a message, and the inbox is where it belongs.
 *
 * Delivery needs RESEND_API_KEY and LEAD_TO_EMAIL set in the environment. If
 * neither email nor webhook is configured, or both fail, the route answers with
 * an error rather than a cheerful "thanks" — the form then falls back to the
 * visitor's own email app, so an enquiry is never silently swallowed.
 */

export const runtime = 'nodejs'
/* Never cached: every request is a new enquiry. */
export const dynamic = 'force-dynamic'

/** The questions on the form, in the order they should read in the email. */
const FIELDS = [
  ['business', 'Business name'],
  ['name', 'Their name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['trade', 'What they do'],
  ['plan', 'Plan they have in mind'],
  ['areas', 'Towns or areas covered'],
  ['website', 'Current website'],
  ['notes', 'Anything else'],
] as const

type FieldName = (typeof FIELDS)[number][0]

/** Trim, cap the length, and drop anything that is not a string. Header
    characters are stripped so nothing typed here can shape the email itself. */
function clean(value: unknown, max = 300): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

/* A crude limit on how often one address can post. Serverless instances come
   and go so this is not airtight, but it costs nothing and stops the obvious
   flood. Anything determined is caught by the honeypot and the timing check. */
const RECENT = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

function overLimit(ip: string): boolean {
  const now = Date.now()
  const seen = (RECENT.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  seen.push(now)
  RECENT.set(ip, seen)
  if (RECENT.size > 500) RECENT.clear()
  return seen.length > MAX_PER_WINDOW
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

async function sendEmail(subject: string, body: string, replyTo: string) {
  const key = process.env.RESEND_API_KEY?.trim()
  const to = process.env.LEAD_TO_EMAIL?.trim() || CONTACT_EMAIL
  if (!key) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.LEAD_FROM_EMAIL?.trim() || 'Kingdom Sites <onboarding@resend.dev>',
      to: [to],
      reply_to: replyTo && looksLikeEmail(replyTo) ? replyTo : undefined,
      subject,
      text: body,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    Sentry.captureMessage(`Free-look email rejected (${response.status}): ${detail.slice(0, 400)}`, 'error')
    return false
  }
  return true
}

/** An optional second destination — a spreadsheet, a CRM, whatever is wired to
    the URL. Failure here never fails the request on its own. */
async function sendWebhook(payload: Record<string, string>) {
  const url = process.env.LEAD_WEBHOOK_URL?.trim()
  if (!url) return false
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (overLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Too many enquiries from here just now. Please email me instead.' },
        { status: 429 },
      )
    }

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'Could not read that.' }, { status: 400 })
    }

    /* Two quiet checks for robots: a field no human can see, and a form filled
       in faster than anyone could type. Both answer with a normal success so a
       bot has nothing to learn from the reply. */
    if (clean(raw.company) !== '') return NextResponse.json({ ok: true })
    const elapsed = Number(raw.elapsedMs)
    if (!Number.isFinite(elapsed) || elapsed < 1500) return NextResponse.json({ ok: true })

    const values = Object.fromEntries(
      FIELDS.map(([key]) => [key, clean(raw[key], key === 'notes' ? 2000 : 300)]),
    ) as Record<FieldName, string>

    if (!values.business || !values.name) {
      return NextResponse.json(
        { ok: false, error: 'Please give your name and your business name.' },
        { status: 400 },
      )
    }
    if (!looksLikeEmail(values.email)) {
      return NextResponse.json(
        { ok: false, error: 'That email address does not look right.' },
        { status: 400 },
      )
    }

    const subject = `Free look — ${values.business}`
    const body = [
      'A new free-look enquiry from kingdom-sites.com',
      '',
      ...FIELDS.filter(([key]) => values[key] !== '').map(([key, label]) => `${label}: ${values[key]}`),
      '',
      `Received: ${new Date().toISOString()}`,
    ].join('\n')

    const [emailed, hooked] = await Promise.all([
      sendEmail(subject, body, values.email),
      sendWebhook({ ...values, receivedAt: new Date().toISOString() }),
    ])

    if (!emailed && !hooked) {
      Sentry.captureMessage('Free-look enquiry could not be delivered — no destination succeeded', 'error')
      return NextResponse.json(
        { ok: false, error: 'Something went wrong sending that.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Something went wrong sending that.' }, { status: 500 })
  }
}
