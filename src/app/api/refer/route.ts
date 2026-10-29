import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { notifyThomas } from '@/lib/notify'
import { checkPayoutHandle, isPayoutMethod, looksLikeEmail, shareLink } from '@/lib/referrals'
import { linkFor, recordReferred, setPayout } from '@/lib/refer/store'

/**
 * The referral program's forms (T-293; this site's own since the Farzana app
 * stopped holding them): "Get your link", "Or tell us about someone", and the
 * private tracker's payout choice. Same-origin only; no cross-site posts.
 *
 * Open to anyone, by Thomas's say-so (2026-10-27: anyone can put in their name
 * and email and get a link at once). It pays nobody and emails only Thomas
 * (the enquiry form's way, `notifyThomas`). The protection is the enquiry
 * form's:
 *
 * - a hidden field (`company`) a person never sees and a bot fills in;
 * - a form filled in faster than a person could (under 1.5 s);
 * - at most five requests from one address in ten minutes.
 *
 * The first two are answered as if it worked, with no link, so a bot learns
 * nothing. The same email address always gets back the same link, and only a
 * link made just now comes back with its private tracker.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const FASTEST_HUMAN_MS = 1500

/** Recent requests per address, kept in this server's memory only. */
const recent = new Map<string, number[]>()

function overLimit(address: string): boolean {
  const now = Date.now()
  const seen = (recent.get(address) ?? []).filter((at) => now - at < WINDOW_MS)
  seen.push(now)
  recent.set(address, seen)
  if (recent.size > 500) recent.clear()
  return seen.length > MAX_PER_WINDOW
}

/** One line of what was typed: no line breaks, no runaway length. */
function line(value: unknown, max = 300): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

function answer(
  status: number,
  body: { error?: string; code?: string; tracker?: string; handle?: string } = {},
) {
  return NextResponse.json(
    body.error
      ? { ok: false, error: body.error }
      : {
          ok: true,
          code: body.code ?? '',
          tracker: body.tracker ?? '',
          ...(body.handle ? { handle: body.handle } : {}),
        },
    { status, headers: { 'cache-control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  try {
    return await handle(request)
  } catch (error) {
    Sentry.captureException(error)
    return answer(500, { error: 'That did not work just now. Please try again.' })
  }
}

async function handle(request: Request) {
  const address =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  if (overLimit(address)) {
    return answer(429, {
      error: 'Too many requests from here just now. Please try again in a few minutes.',
    })
  }

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>

  // A bot: say it went, keep nothing.
  if (line(body.company) !== '') return answer(200)
  const elapsed = Number(body.elapsedMs)
  if (!Number.isFinite(elapsed) || elapsed < FASTEST_HUMAN_MS) return answer(200)

  if (body.kind === 'payout') {
    const token = line(body.token, 64)
    if (!isPayoutMethod(body.method)) {
      return answer(400, { error: 'Please pick PayPal, Venmo or Apple Cash.' })
    }
    const checked = checkPayoutHandle(body.method, line(body.handle, 200))
    if ('error' in checked) return answer(400, { error: checked.error })
    try {
      const found = await setPayout(token, { method: body.method, handle: checked.handle })
      if (!found) {
        return answer(404, {
          error: 'This tracker link does not work any more. Write to me for your new one.',
        })
      }
    } catch (error) {
      Sentry.captureException(error)
      return answer(503, { error: 'That did not save just now. Please try again.' })
    }
    return answer(200, { handle: checked.handle })
  }

  const name = line(body.name, 120)
  const email = line(body.email, 200)
  if (!name) return answer(400, { error: 'Please give your name.' })
  if (!looksLikeEmail(email)) {
    return answer(400, { error: 'That email address does not look right.' })
  }

  const tip = body.kind === 'school'
  const orgName = line(body.schoolName, 200)
  if (tip && !orgName) {
    return answer(400, { error: 'Please give the name of their school, business or organization.' })
  }
  const contactEmail = line(body.contactEmail, 200)
  if (tip && contactEmail && !looksLikeEmail(contactEmail)) {
    return answer(400, { error: 'Their email address does not look right.' })
  }

  let made: { code: string; tracker: string; isNew: boolean }
  try {
    made = await linkFor({ name, email, showName: body.showName === true })
  } catch (error) {
    Sentry.captureException(error)
    return answer(503, { error: 'That did not work just now. Please try again later.' })
  }
  const { code, tracker } = made
  const link = shareLink(new URL(request.url).origin, code)

  if (!tip) {
    if (made.isNew) {
      await notifyThomas(
        `New referrer: ${name}`,
        [
          'Someone asked for a referral link on kingdom-sites.com/refer.',
          '',
          `Name: ${name}`,
          `Email: ${email.toLowerCase()}`,
          `Their link: ${link}`,
          `Show their first name on it: ${body.showName === true ? 'yes' : 'no'}`,
          '',
          'All referrals: /sign/referrals',
        ].join('\n'),
        email,
      )
    }
    return answer(200, { code, tracker })
  }

  const website = line(body.website, 300)
  const contactName = line(body.contactName, 120)
  const howTheyKnow = line(body.howTheyKnow, 500)
  const mayMention = body.mayMention === true
  const note = [
    howTheyKnow && `How they know them: ${howTheyKnow.replace(/[.!]+$/, '')}.`,
    mayMention ? `You may say ${name} suggested it.` : `Do not say ${name} suggested it.`,
  ]
    .filter(Boolean)
    .join(' ')

  let recorded: boolean
  try {
    recorded = await recordReferred({
      code,
      via: 'form',
      name: orgName,
      contactName,
      contactEmail: contactEmail.toLowerCase(),
      website,
      note,
    })
  } catch (error) {
    Sentry.captureException(error)
    return answer(503, { error: 'That did not work just now. Please try again later.' })
  }

  // The tip is in the records already; an email that cannot go is not worth
  // turning the person away for.
  await notifyThomas(
    `Referral: ${orgName}, from ${name}`,
    [
      'Someone told you about an organization on kingdom-sites.com/refer.',
      recorded ? '' : 'Already in the referrals, so this one is not counted again.',
      '',
      `Organization: ${orgName}`,
      `Website: ${website || '(not said)'}`,
      `Who to talk to: ${contactName || '(not said)'}`,
      `Their email: ${contactEmail || '(not said)'}`,
      `How they know them: ${howTheyKnow || '(not said)'}`,
      mayMention ? `You may say ${name} suggested it.` : `Do not say ${name} suggested it.`,
      '',
      `From: ${name} <${email.toLowerCase()}>, link ${link}`,
      '',
      'All referrals: /sign/referrals',
    ].join('\n'),
    email,
  )
  return answer(200, { code, tracker })
}
