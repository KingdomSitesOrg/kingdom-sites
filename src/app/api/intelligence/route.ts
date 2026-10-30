import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'
import {
  MAX_OUTPUT_TOKENS,
  MODEL,
  OFFER_TOOL,
  SAY,
  articlePrompt,
  asQuestion,
  dailyBudgetUsd,
  parseConversation,
  sign,
  systemPrompt,
  takeTurn,
} from '@/lib/intelligence'
import { anthropic, apiKey, fromThisSite, readKnowledge, secretFor, visitorOf } from '@/lib/intelligence-server'
import { findArticle } from '@/lib/articles'
import { recordAnswer, spentToday } from '@/lib/intelligence-usage'

/**
 * Intelligence's answers (T-375): the browser sends the conversation, this
 * asks Claude Haiku with the site's knowledge file, and streams the answer
 * back as lines of JSON:
 *   {"t":"some words"}                       part of the answer
 *   {"done":true,"sig":"…","offer":false}    finished; sig vouches for the answer
 *   {"error":"…"}                            stopped, with words to show
 * A refusal before any answer (limits, the day's budget) is plain JSON with
 * `error` and a 4xx/5xx status.
 *
 * A conversation started with "Summarize this article" also names the article
 * by its path (`article: "guides/…"`); its text is added from the site's own
 * guides and posts, so the summary and the follow-ups read that page (T-388).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const refuse = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function POST(request: Request) {
  const key = apiKey()
  if (!key) return refuse(SAY.resting, 503)
  if (!fromThisSite(request)) return refuse(SAY.unreadable, 403)
  if (Number(request.headers.get('content-length') ?? 0) > 64_000) return refuse(SAY.unreadable, 413)

  const secret = secretFor(key)
  const raw = await request.json().catch(() => null)
  const parsed = parseConversation(raw, secret)
  if (!parsed.ok) return refuse(parsed.error, parsed.status)
  const article = findArticle((raw as { article?: unknown } | null)?.article)

  if ((await spentToday()).usd >= dailyBudgetUsd()) return refuse(SAY.resting, 503)

  const turn = takeTurn(visitorOf(request))
  if (turn !== 'ok') return refuse(SAY[turn], 429)

  const messages: Anthropic.MessageParam[] = parsed.turns.map((t) =>
    t.role === 'user' ? { role: 'user', content: asQuestion(t.content) } : { role: 'assistant', content: t.content },
  )

  const stream = anthropic(key).messages.stream({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    // A short answer from a fixed file needs no reasoning step.
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: systemPrompt(readKnowledge()), cache_control: { type: 'ephemeral' } },
      ...(article ? [{ type: 'text' as const, text: articlePrompt(article.title, article.text) }] : []),
    ],
    tools: [OFFER_TOOL],
    tool_choice: { type: 'auto' },
    messages,
  })

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (line: object) => controller.enqueue(encoder.encode(JSON.stringify(line) + '\n'))
      let text = ''
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            text += event.delta.text
            send({ t: event.delta.text })
          }
        }
        const final = await stream.finalMessage()
        await recordAnswer(final.usage)

        const offer = final.content.some((b) => b.type === 'tool_use' && b.name === OFFER_TOOL.name)
        if (final.stop_reason === 'refusal' && !text.trim()) {
          text = SAY.declined
          send({ t: text })
        } else if (offer && !text.trim()) {
          text = SAY.offer
          send({ t: text })
        }
        text = text.trim()
        send({ done: true, sig: sign(text, secret), offer })
      } catch (error) {
        if (!(error instanceof Anthropic.APIUserAbortError)) {
          Sentry.captureException(error)
          send({ error: SAY.failed })
        }
      } finally {
        controller.close()
      }
    },
    cancel() {
      // The visitor closed the page: stop paying for words nobody will read.
      stream.abort()
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
