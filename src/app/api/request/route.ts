import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { deliverEnquiry, looksLikeEmail } from '@/lib/enquiry'
import {
  REQUEST_BUDGETS,
  REQUEST_DECIDER,
  REQUEST_NEEDS,
  REQUEST_STARTS,
  pickMany,
  pickOne,
} from '@/lib/request'

/**
 * Project requests from /request (T-547). Checked here, then handed to
 * deliverEnquiry (src/lib/enquiry.ts), the same path as the contact form: an
 * email to Thomas (Resend) and the LEAD_WEBHOOK_URL hook if set. Nothing is
 * stored. The same spam guards as /api/inquiry: a hidden field people never
 * fill, a minimum time on the form, and five sends per address per ten minutes.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

function clean(value: unknown, max = 200): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

function cleanMultiline(value: unknown, max = 4000): string {
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

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status })

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (overLimit(ip)) return bad('Too many requests from here just now. Please email me instead.', 429)

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw) return bad('Could not read that.')

    // Bots fill the hidden field and send at once; tell them it worked and drop it.
    if (clean(raw.company) !== '') return NextResponse.json({ ok: true })
    const elapsed = Number(raw.elapsedMs)
    if (!Number.isFinite(elapsed) || elapsed < 3000) return NextResponse.json({ ok: true })

    const name = clean(raw.name)
    const email = clean(raw.email)
    const business = clean(raw.business)
    const phone = clean(raw.phone, 40)
    const decider = pickOne(REQUEST_DECIDER, raw.decider)
    const deciderName = clean(raw.deciderName)
    const needs = pickMany(REQUEST_NEEDS, raw.needs)
    const needsOther = clean(raw.needsOther)
    const budget = pickOne(REQUEST_BUDGETS, raw.budget)
    const start = pickOne(REQUEST_STARTS, raw.start)
    const website = clean(raw.website)
    const message = cleanMultiline(raw.message)

    if (!name) return bad('Please give your name.')
    if (!looksLikeEmail(email)) return bad('That email address does not look right.')
    if (needs.length === 0) return bad('Please pick at least one thing you need.')
    if (!budget) return bad('Please pick a budget, or "Not sure yet".')
    if (!message) return bad('Please tell me a little about the project.')

    const needLine = [...needs.filter((n) => n !== 'Something else'), ...(needs.includes('Something else') ? [needsOther ? `Something else: ${needsOther}` : 'Something else'] : [])].join(', ')

    const delivered = await deliverEnquiry(request, {
      name,
      email,
      message,
      kind: 'request',
      details: [
        ['Business', business],
        ['Phone', phone],
        ['Decision maker', decider === 'Yes, I decide' ? decider : [decider, deciderName].filter(Boolean).join(': ')],
        ['Needs', needLine],
        ['Budget', budget],
        ['Wants to start', start],
        ['Current website or app', website],
      ],
    })

    if (!delivered) return bad('Something went wrong sending that.', 502)
    return NextResponse.json({ ok: true })
  } catch (error) {
    Sentry.captureException(error)
    return bad('Something went wrong sending that.', 500)
  }
}
