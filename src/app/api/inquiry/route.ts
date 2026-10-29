import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { notifyThomas } from '@/lib/notify'
import { creditReferral } from '@/lib/refer/credit'

/**
 * Product enquiries, and Farzana call requests.
 *
 * The form posts here; this route delivers by email (Resend) and optionally a
 * webhook. Nothing stored in a DB, except that an enquiry from someone who
 * came through a referral link is added to the referral records. The Farzana page's "Book a call" form
 * (/farzana/book) posts here too, with `kind: 'farzana-call'` and two more
 * optional lines — what they teach and when suits them — so its email says
 * what it is.
 *
 * Needs RESEND_API_KEY. If delivery fails, the form falls back to mailto.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const WEBHOOK_TIMEOUT_MS = 4_000

function clean(value: unknown, max = 300): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

function cleanMultiline(value: unknown, max = 2000): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n/g, '\n').trim().slice(0, max)
}

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

    if (clean(raw.company) !== '') return NextResponse.json({ ok: true })
    const elapsed = Number(raw.elapsedMs)
    if (!Number.isFinite(elapsed) || elapsed < 1500) return NextResponse.json({ ok: true })

    const name = clean(raw.name)
    const email = clean(raw.email)
    const message = cleanMultiline(raw.message)
    const farzanaCall = clean(raw.kind) === 'farzana-call'
    const teaches = clean(raw.teaches)
    const times = clean(raw.times)

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Please give your name.' }, { status: 400 })
    }
    if (!looksLikeEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'That email address does not look right.' },
        { status: 400 },
      )
    }

    // Came through someone's referral link: it counts as theirs (T-293).
    const referredBy = await creditReferral(request, {
      name,
      email,
      note: farzanaCall ? 'Asked for a Farzana call.' : 'Sent an enquiry.',
    })

    const subject = farzanaCall
      ? `Farzana call request from ${name}`
      : `Enquiry from ${name}`
    const body = [
      farzanaCall
        ? 'A new call request from kingdom-sites.com/farzana'
        : 'A new enquiry from kingdom-sites.com',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      ...(referredBy ? [`Referred by: ${referredBy} (through their link)`] : []),
      ...(farzanaCall
        ? [
            `Teaches: ${teaches || '(not said)'}`,
            `When suits them: ${times || '(not said)'}`,
          ]
        : []),
      '',
      message ? `Message:\n${message}` : 'Message: (none)',
      '',
      `Received: ${new Date().toISOString()}`,
    ].join('\n')

    const [emailed, hooked] = await Promise.all([
      notifyThomas(subject, body, email),
      sendWebhook({
        name,
        email,
        message,
        ...(farzanaCall ? { teaches, times } : {}),
        receivedAt: new Date().toISOString(),
        kind: farzanaCall ? 'farzana-call' : 'enquiry',
        ...(referredBy ? { referredBy } : {}),
      }),
    ])

    if (!emailed && !hooked) {
      Sentry.captureMessage(
        'Enquiry could not be delivered — no destination succeeded',
        'error',
      )
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
