import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import {
  CHAT,
  CHAT_SAY,
  isTestAddress,
  looksLikeEmail,
  newId,
  newKey,
  oneLine,
  sameKey,
  shouldAlert,
  take,
  tidy,
  visitorView,
  type Conversation,
} from '@/lib/chat/chat'
import { changeConversation, createConversation, readConversation } from '@/lib/chat/store'
import { parseConversation, transcript } from '@/lib/intelligence'
import { apiKey, fromThisSite, secretFor, visitorOf } from '@/lib/intelligence-server'
import { notifyThomas } from '@/lib/notify'

/**
 * The visitor's side of Messages (lib/chat). POST starts a conversation
 * (name, email, first message, and what they asked Intelligence, if they bring
 * it) or adds a message to one; GET reads one, with its id and private key.
 * Thomas gets an email about a new message, but not about every line of a
 * conversation he has not looked at yet.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const refuse = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })

/** Where the site is being reached, so the links in emails go back to the same place. */
function origin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : new URL(request.url).origin
}

async function alertThomas(request: Request, c: Conversation, text: string, first: boolean) {
  if (isTestAddress(c.email)) return
  const body = [
    first ? `${c.name} sent you a message on kingdom-sites.com.` : `${c.name} wrote again.`,
    '',
    text,
    '',
    `Answer here: ${origin(request)}/inbox?c=${c.id}`,
    '',
    `Their email: ${c.email}`,
    ...(first && c.context ? ['', 'What they asked Intelligence first:', '', c.context] : []),
  ].join('\n')
  const sent = await notifyThomas(`${first ? 'New message' : 'Message'} from ${c.name}`, body, c.email)
  if (sent) await changeConversation(c.id, (doc) => void (doc.thomasAlertedAt = new Date().toISOString()))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id') ?? ''
  const key = url.searchParams.get('key') ?? ''
  const c = await readConversation(id)
  if (!c || !sameKey(c.key, key)) return refuse(CHAT_SAY.missing, 404)
  // The panel reads it every few seconds while it is open: that counts as the
  // visitor looking (Thomas's answers then need no email). Written at most
  // every half minute, or at once when there is an answer they have not seen.
  const lastThomas = [...c.messages].reverse().find((m) => m.from === 'thomas')
  const stale = !c.visitorSeenAt || Date.now() - Date.parse(c.visitorSeenAt) > 30_000
  if (stale || (lastThomas && c.visitorSeenAt! < lastThomas.at)) {
    await changeConversation(id, (doc) => void (doc.visitorSeenAt = new Date().toISOString())).catch(() => null)
  }
  return NextResponse.json({ ok: true, conversation: visitorView(c) })
}

export async function POST(request: Request) {
  try {
    if (!fromThisSite(request)) return refuse(CHAT_SAY.failed, 403)
    if (Number(request.headers.get('content-length') ?? 0) > 64_000) return refuse(CHAT_SAY.tooLong, 413)
    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw) return refuse(CHAT_SAY.failed, 400)
    // The hidden field only a bot fills in: say yes, keep nothing.
    if (oneLine(raw.company, 100) !== '') return NextResponse.json({ ok: true })

    const text = tidy(raw.text, CHAT.messageChars + 1)
    if (!text) return refuse(CHAT_SAY.empty, 400)
    if (text.length > CHAT.messageChars) return refuse(CHAT_SAY.tooLong, 400)
    const visitor = visitorOf(request)
    const now = new Date().toISOString()

    if (raw.action === 'start') {
      const name = oneLine(raw.name, CHAT.nameChars)
      const email = oneLine(raw.email, CHAT.emailChars)
      if (!name) return refuse(CHAT_SAY.needName, 400)
      if (!looksLikeEmail(email)) return refuse(CHAT_SAY.badEmail, 400)
      if (!take('start', visitor)) return refuse(CHAT_SAY.limit, 429)

      // Their Intelligence conversation comes along only as the route signed it.
      let context: string | undefined
      const key = apiKey()
      if (key && Array.isArray(raw.messages) && raw.messages.length) {
        const parsed = parseConversation(raw, secretFor(key), { answered: true })
        if (parsed.ok) context = transcript(parsed.turns).slice(0, CHAT.contextChars)
      }

      const c: Conversation = {
        id: newId(),
        key: newKey(),
        name,
        email,
        createdAt: now,
        updatedAt: now,
        context,
        messages: [{ id: newId(), from: 'visitor', text, at: now }],
      }
      await createConversation(c)
      await alertThomas(request, c, text, true).catch((e) => Sentry.captureException(e))
      return NextResponse.json({ ok: true, id: c.id, key: c.key, conversation: visitorView(c) })
    }

    if (raw.action === 'send') {
      const id = oneLine(raw.id, 40)
      const key = oneLine(raw.key, 80)
      const current = await readConversation(id)
      if (!current || !sameKey(current.key, key)) return refuse(CHAT_SAY.missing, 404)
      if (current.messages.length >= CHAT.messages) return refuse(CHAT_SAY.full, 400)
      if (!take('message', visitor)) return refuse(CHAT_SAY.limit, 429)
      const changed = await changeConversation(id, (doc) => {
        doc.messages.push({ id: newId(), from: 'visitor', text, at: now })
        doc.updatedAt = now
        doc.visitorSeenAt = now
        doc.archived = false
        return shouldAlert(doc.thomasAlertedAt, doc.thomasSeenAt, Date.now())
      })
      if (!changed) return refuse(CHAT_SAY.missing, 404)
      if (changed.result) await alertThomas(request, changed.doc, text, false).catch((e) => Sentry.captureException(e))
      return NextResponse.json({ ok: true, conversation: visitorView(changed.doc) })
    }

    return refuse(CHAT_SAY.failed, 400)
  } catch (error) {
    Sentry.captureException(error)
    return refuse(CHAT_SAY.failed, 500)
  }
}
