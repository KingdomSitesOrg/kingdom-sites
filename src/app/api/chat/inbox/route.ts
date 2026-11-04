import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { SHARE_URL } from '@/lib/seo'
import { CHAT, inboxRow, isTestAddress, newId, oneLine, shouldAlert, tidy } from '@/lib/chat/chat'
import { changeConversation, listConversations, readConversation } from '@/lib/chat/store'
import { emailMessageReply } from '@/lib/notify'
import { fromThisSite } from '@/lib/intelligence-server'
import { getAdminSession } from '@/lib/sign/auth'

/**
 * Thomas's side of Messages, behind his admin sign-in (the one Sign uses).
 * GET lists every conversation, or with ?id= opens one (and marks it read);
 * POST answers one, and emails the visitor his answer with the link back,
 * unless they are on the page and have seen it already; or, with an action,
 * files it away (archive), brings it back (unarchive) or marks it unread.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* The visitor's panel checks for answers every few seconds while it is open. */
const WATCHING_MS = 45_000

const refuse = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })

function origin(request: Request): string {
  // Live, links always point at the site itself, whatever address the request named.
  if (process.env.VERCEL) return SHARE_URL
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : new URL(request.url).origin
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) return refuse('Sign in first.', 401)
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    const all = await listConversations()
    return NextResponse.json({ ok: true, rows: all.map(inboxRow) })
  }
  const c = await readConversation(id)
  if (!c) return refuse('That conversation could not be found.', 404)
  const lastVisitor = [...c.messages].reverse().find((m) => m.from === 'visitor')
  if (lastVisitor && (!c.thomasSeenAt || c.thomasSeenAt < lastVisitor.at)) {
    await changeConversation(id, (doc) => void (doc.thomasSeenAt = new Date().toISOString())).catch(() => null)
  }
  const { key: _key, ...rest } = c
  void _key
  return NextResponse.json({ ok: true, conversation: rest })
}

export async function POST(request: Request) {
  try {
    if (!fromThisSite(request)) return refuse('Sign in first.', 403)
    if (!(await getAdminSession())) return refuse('Sign in first.', 401)
    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const id = oneLine(raw?.id, 40)
    const action = raw?.action
    if (action === 'archive' || action === 'unarchive' || action === 'unread') {
      const changed = await changeConversation(id, (doc) => {
        if (action === 'unread') doc.thomasSeenAt = undefined
        else doc.archived = action === 'archive'
      })
      if (!changed) return refuse('That conversation could not be found.', 404)
      return NextResponse.json({ ok: true, row: inboxRow(changed.doc) })
    }
    const text = tidy(raw?.text, CHAT.messageChars)
    if (!text) return refuse('Write an answer first.', 400)
    const now = new Date().toISOString()
    const changed = await changeConversation(id, (doc) => {
      doc.messages.push({ id: newId(), from: 'thomas', text, at: now })
      doc.updatedAt = now
      doc.thomasSeenAt = now
      // They have the conversation open on the site right now: they will see it there.
      const watching = !!doc.visitorSeenAt && Date.now() - Date.parse(doc.visitorSeenAt) < WATCHING_MS
      return !watching && shouldAlert(doc.visitorAlertedAt, doc.visitorSeenAt, Date.now())
    })
    if (!changed) return refuse('That conversation could not be found.', 404)
    const c = changed.doc
    if (changed.result && !isTestAddress(c.email)) {
      const link = `${origin(request)}/?chat=${c.id}.${c.key}`
      const sent = await emailMessageReply(c.email, c.name, text, link)
      if (sent) await changeConversation(id, (doc) => void (doc.visitorAlertedAt = new Date().toISOString()))
    }
    const { key: _key, ...rest } = changed.doc
    void _key
    return NextResponse.json({ ok: true, conversation: rest })
  } catch (error) {
    Sentry.captureException(error)
    return refuse('That did not send. Try again.', 500)
  }
}
