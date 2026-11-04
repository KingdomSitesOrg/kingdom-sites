import { randomBytes, timingSafeEqual } from 'crypto'

/**
 * Messages: a visitor writes to Thomas from the Intelligence panel's "Thomas"
 * tab, he answers from /inbox, and the two can carry on there (Thomas,
 * 2026-11-04). One conversation per visitor, kept in their browser by its id
 * and a private key; only that key (or Thomas's admin login) reads it.
 */

export type Sender = 'visitor' | 'thomas'

export type Message = { id: string; from: Sender; text: string; at: string }

export type Conversation = {
  id: string
  /** The visitor's private key: with the id, it opens the conversation. */
  key: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
  /** What they asked Intelligence before writing, if they brought it along. */
  context?: string
  messages: Message[]
  /** When each side last looked, and when each was last emailed about it. */
  thomasSeenAt?: string
  visitorSeenAt?: string
  thomasAlertedAt?: string
  visitorAlertedAt?: string
}

/** What the visitor's browser gets: never the key or anything of Thomas's. */
export type VisitorView = { id: string; name: string; email: string; messages: Message[]; thomasSeenAt?: string }

/** One line per conversation in Thomas's inbox. */
export type InboxRow = {
  id: string
  name: string
  email: string
  updatedAt: string
  last: { from: Sender; text: string }
  unread: boolean
}

export const CHAT = {
  /** Characters in one message. */
  messageChars: 2000,
  nameChars: 100,
  emailChars: 200,
  contextChars: 12_000,
  /** Messages in one conversation. */
  messages: 300,
  /** Per visitor (IP address), per day: conversations started, messages sent. */
  startsPerDay: 3,
  messagesPerDay: 60,
  /** No second email about the same conversation sooner than this, unless the other side has looked since. */
  alertQuietMs: 20 * 60_000,
  /** What the visitor is told. */
  promise: 'Thomas replies within 12 to 24 hours.',
}

export const CHAT_SAY = {
  needName: 'Add your name.',
  badEmail: 'That email address does not look right.',
  empty: 'Write a message first.',
  tooLong: `Keep a message under ${CHAT.messageChars} characters.`,
  limit: 'That is all the messages for today from here. Thomas will see what you have sent.',
  full: 'This conversation is full. Write to Thomas through the contact form at /get-started.',
  missing: 'That conversation could not be found.',
  failed: 'That did not send just now. Try again in a moment.',
}

export const newId = () => randomBytes(9).toString('base64url')
export const newKey = () => randomBytes(24).toString('base64url')

export function sameKey(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

/**
 * Addresses that can never receive mail (example.com, .test and the rest,
 * RFC 2606): a conversation from one sends no email either way, so the whole
 * loop can be tried on a dev server without writing to anyone.
 */
export function isTestAddress(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return /(^|\.)(example\.(com|org|net)|test|example|invalid|localhost)$/.test(domain)
}

/** Text as typed, tidied: line breaks kept (at most two in a row), ends trimmed. */
export function tidy(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)
}

export function oneLine(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

export function visitorView(c: Conversation): VisitorView {
  return { id: c.id, name: c.name, email: c.email, messages: c.messages, thomasSeenAt: c.thomasSeenAt }
}

export function inboxRow(c: Conversation): InboxRow {
  const last = c.messages[c.messages.length - 1]
  const lastVisitor = [...c.messages].reverse().find((m) => m.from === 'visitor')
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    updatedAt: c.updatedAt,
    last: last ? { from: last.from, text: last.text.slice(0, 160) } : { from: 'visitor', text: '' },
    unread: !!lastVisitor && (!c.thomasSeenAt || c.thomasSeenAt < lastVisitor.at),
  }
}

/** Whether the other side should get an email about a new message now. */
export function shouldAlert(alertedAt: string | undefined, seenAt: string | undefined, now: number): boolean {
  if (!alertedAt) return true
  if (seenAt && seenAt >= alertedAt) return true
  return now - Date.parse(alertedAt) >= CHAT.alertQuietMs
}

/* Per-visitor counts, per server instance (like Intelligence's own limits). */
const counts = new Map<string, number[]>()
const DAY = 24 * 60 * 60_000

export function take(kind: 'start' | 'message', visitor: string, now = Date.now()): boolean {
  const k = `${kind}:${visitor}`
  const times = (counts.get(k) ?? []).filter((t) => now - t < DAY)
  if (times.length >= (kind === 'start' ? CHAT.startsPerDay : CHAT.messagesPerDay)) return false
  times.push(now)
  counts.set(k, times)
  if (counts.size > 10_000) counts.delete(counts.keys().next().value!)
  return true
}

export function resetChatLimitsForTests() {
  counts.clear()
}
