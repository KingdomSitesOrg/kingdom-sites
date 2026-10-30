import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { deliverEnquiry, looksLikeEmail } from '@/lib/enquiry'

/**
 * Product enquiries, and Farzana call requests.
 *
 * The form posts here; this route checks it and hands it to deliverEnquiry
 * (src/lib/enquiry.ts), which emails it (Resend) and optionally sends a
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

    const delivered = await deliverEnquiry(request, {
      name,
      email,
      message,
      kind: farzanaCall ? 'farzana-call' : 'enquiry',
      teaches,
      times,
    })

    if (!delivered) {
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
