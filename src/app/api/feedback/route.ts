import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { CONTACT_EMAIL } from '@/lib/contact'
import { clean, feedbackEmail, parseFeedback } from '@/lib/feedback'
import { saveFeedback } from '@/lib/feedback-store'

/**
 * Client feedback from /feedback.
 *
 * Each response is saved (see feedback-store) and emailed to Thomas through
 * Resend. It succeeds if either one works.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const EMAIL_TIMEOUT_MS = 8_000

/** Has to be on the verified kingdom-sites.com domain, as with enquiries. */
const DEFAULT_FROM = 'Client Feedback <contact@kingdom-sites.com>'

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

async function sendEmail(subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return false

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      body: JSON.stringify({
        from: process.env.FEEDBACK_FROM_EMAIL?.trim() || DEFAULT_FROM,
        to: [process.env.FEEDBACK_TO_EMAIL?.trim() || CONTACT_EMAIL],
        subject,
        text,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      Sentry.captureMessage(
        `Feedback email rejected (${response.status}): ${detail.slice(0, 400)}`,
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

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (overLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Too many responses from here just now. Please email me instead.' },
        { status: 429 },
      )
    }

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'Could not read that.' }, { status: 400 })
    }

    if (clean(raw.company) !== '') return NextResponse.json({ ok: true })
    const elapsed = Number(raw.elapsedMs)
    if (!Number.isFinite(elapsed) || elapsed < 3000) return NextResponse.json({ ok: true })

    const parsed = parseFeedback(raw)
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
    }

    const receivedAt = new Date().toISOString()
    const { subject, text } = feedbackEmail(parsed.feedback, receivedAt)
    const [saved, emailed] = await Promise.all([
      saveFeedback(parsed.feedback, receivedAt),
      sendEmail(subject, text),
    ])

    if (!saved && !emailed) {
      Sentry.captureMessage('Feedback could not be delivered — not saved and not emailed', 'error')
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
