import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { deliverEnquiry, looksLikeEmail } from '@/lib/enquiry'
import {
  MODEL,
  SAY,
  SUMMARY_PROMPT,
  dailyBudgetUsd,
  parseConversation,
  takeSend,
  transcript,
} from '@/lib/intelligence'
import { anthropic, apiKey, fromThisSite, secretFor, visitorOf } from '@/lib/intelligence-server'
import { recordAnswer, spentToday } from '@/lib/intelligence-usage'

/**
 * A visitor's "Send to Thomas" from the Intelligence chat (T-375, Thomas,
 * 2026-10-30). Their name, their email, a short summary of the conversation
 * and the conversation itself go to Thomas the way a contact-form message
 * does (deliverEnquiry), and nowhere else; nothing is ever sent to the
 * visitor. Only answers the route itself signed are accepted, so the
 * conversation Thomas reads is the one that happened.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const refuse = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : ''
}

/** A few lines for Thomas from Haiku; the conversation itself always goes too. */
async function summarize(key: string, conversation: string): Promise<string> {
  if ((await spentToday()).usd >= dailyBudgetUsd()) return ''
  try {
    const reply = await anthropic(key).messages.create({
      model: MODEL,
      max_tokens: 250,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: SUMMARY_PROMPT,
      messages: [{ role: 'user', content: `<conversation>\n${conversation}\n</conversation>` }],
    })
    await recordAnswer(reply.usage)
    return reply.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join('')
      .trim()
  } catch (error) {
    Sentry.captureException(error)
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const key = apiKey()
    if (!key) return refuse(SAY.sendFailed, 503)
    if (!fromThisSite(request)) return refuse(SAY.unreadable, 403)
    if (Number(request.headers.get('content-length') ?? 0) > 64_000) return refuse(SAY.unreadable, 413)

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    // The hidden field only a bot fills in: say yes, send nothing.
    if (clean(raw?.company, 100) !== '') return NextResponse.json({ ok: true })

    const name = clean(raw?.name, 100)
    const email = clean(raw?.email, 200)
    if (!name) return refuse(SAY.needName, 400)
    if (!looksLikeEmail(email)) return refuse(SAY.badEmail, 400)

    const parsed = parseConversation(raw, secretFor(key), { answered: true })
    if (!parsed.ok) return refuse(parsed.error, parsed.status)

    if (!takeSend(visitorOf(request))) return refuse(SAY.sendLimit, 429)

    const conversation = transcript(parsed.turns)
    const summary = await summarize(key, conversation)
    const message = [
      summary || '(No summary this time; the conversation is below.)',
      '',
      'The conversation with Intelligence:',
      '',
      conversation,
    ].join('\n')

    const delivered = await deliverEnquiry(request, { name, email, message, kind: 'intelligence' })
    if (!delivered) return refuse(SAY.sendFailed, 502)
    return NextResponse.json({ ok: true })
  } catch (error) {
    Sentry.captureException(error)
    return refuse(SAY.sendFailed, 500)
  }
}
