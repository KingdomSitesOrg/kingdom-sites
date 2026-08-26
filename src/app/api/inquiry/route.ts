import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { INQUIRY_TO_EMAILS } from '@/lib/contact'

/**
 * Product enquiries.
 *
 * The form posts here; this route delivers by email (Resend) and optionally a
 * webhook. Nothing stored in a DB.
 *
 * Needs RESEND_API_KEY. If delivery fails, the form falls back to mailto.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

async function sendEmail(subject: string, body: string, replyTo: string) {
  const key = process.env.RESEND_API_KEY?.trim()
  const envTo = process.env.LEAD_TO_EMAIL?.trim()
  const to = envTo
    ? envTo.split(',').map((s) => s.trim()).filter(Boolean)
    : [...INQUIRY_TO_EMAILS]
  if (!key || to.length === 0) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.LEAD_FROM_EMAIL?.trim() || 'Kingdom Sites <onboarding@resend.dev>',
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
}

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

    if (clean(raw.company) !== '') return NextResponse.json({ ok: true })
    const elapsed = Number(raw.elapsedMs)
    if (!Number.isFinite(elapsed) || elapsed < 1500) return NextResponse.json({ ok: true })

    const name = clean(raw.name)
    const email = clean(raw.email)
    const message = cleanMultiline(raw.message)

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Please give your name.' }, { status: 400 })
    }
    if (!looksLikeEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'That email address does not look right.' },
        { status: 400 },
      )
    }

    const subject = `Enquiry from ${name}`
    const body = [
      'A new enquiry from kingdom-sites.com',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message ? `Message:\n${message}` : 'Message: (none)',
      '',
      `Received: ${new Date().toISOString()}`,
    ].join('\n')

    const [emailed, hooked] = await Promise.all([
      sendEmail(subject, body, email),
      sendWebhook({
        name,
        email,
        message,
        receivedAt: new Date().toISOString(),
        kind: 'enquiry',
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
