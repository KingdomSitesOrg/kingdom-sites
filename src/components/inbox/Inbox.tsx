'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { sans } from '@/components/cinematic/fonts'
import './inbox.css'

/**
 * Thomas's inbox (/inbox): every conversation visitors started from the
 * Intelligence panel's Thomas tab, newest first, and the one open beside it
 * (on a phone, one screen at a time). It checks for new messages every few
 * seconds while it is open. His answer goes to the visitor's chat, and by
 * email unless they are on the page right then (/api/chat/inbox).
 */

type Message = { id: string; from: 'visitor' | 'thomas'; text: string; at: string }
type Row = { id: string; name: string; email: string; updatedAt: string; last: { from: Message['from']; text: string }; unread: boolean }
type Conversation = { id: string; name: string; email: string; createdAt: string; context?: string; messages: Message[] }

const LIST_MS = 8_000
const OPEN_MS = 5_000

const ago = (at: string) => {
  const s = Math.max(0, (Date.now() - Date.parse(at)) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86_400) return `${Math.floor(s / 3600)}h`
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
const when = (at: string) =>
  new Date(at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Inbox() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [convo, setConvo] = useState<Conversation | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef<HTMLDivElement>(null)

  // ?c=<id>: the link in the email about a new message opens it.
  useEffect(() => {
    setOpenId(new URLSearchParams(window.location.search).get('c'))
  }, [])

  const open = (id: string | null) => {
    setOpenId(id)
    setConvo(null)
    setDraft('')
    setError('')
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('c', id)
    else url.searchParams.delete('c')
    window.history.replaceState(null, '', url.pathname + url.search)
  }

  const loadRows = useCallback(async () => {
    const response = await fetch('/api/chat/inbox', { cache: 'no-store' }).catch(() => null)
    if (response?.status === 401) return window.location.assign('/sign/login?next=/inbox')
    const said = (await response?.json().catch(() => null)) as { rows?: Row[] } | null
    if (said?.rows) setRows(said.rows)
  }, [])

  const loadOpen = useCallback(async (id: string) => {
    const response = await fetch(`/api/chat/inbox?id=${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
    const said = (await response?.json().catch(() => null)) as { conversation?: Conversation } | null
    if (said?.conversation) setConvo(said.conversation)
  }, [])

  useEffect(() => {
    void loadRows()
    const timer = window.setInterval(() => document.visibilityState === 'visible' && loadRows(), LIST_MS)
    return () => window.clearInterval(timer)
  }, [loadRows])

  useEffect(() => {
    if (!openId) return
    void loadOpen(openId).then(loadRows)
    const timer = window.setInterval(() => document.visibilityState === 'visible' && loadOpen(openId), OPEN_MS)
    return () => window.clearInterval(timer)
  }, [openId, loadOpen, loadRows])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [convo?.messages.length])

  async function reply() {
    const text = draft.trim()
    if (!text || !convo || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/chat/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convo.id, text }),
      })
      const said = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; conversation?: Conversation } | null
      if (!response.ok || !said?.ok) {
        setError(said?.error || 'That did not send. Try again.')
        return
      }
      if (said.conversation) setConvo(said.conversation)
      setDraft('')
      void loadRows()
    } finally {
      setBusy(false)
    }
  }

  const unread = rows?.filter((r) => r.unread).length ?? 0

  return (
    <div className={`ib ${sans.variable}`} data-open={openId ? '' : undefined}>
      <aside className="ib-list" aria-label="Conversations">
        <header className="ib-head">
          <h1 className="ib-title">Messages{unread ? <span className="ib-count">{unread}</span> : null}</h1>
          <Link href="/" className="ib-home">
            kingdom-sites.com
          </Link>
        </header>
        {rows === null ? (
          <p className="ib-empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="ib-empty">No messages yet. When someone writes to you from the Thomas tab in Intelligence, it shows up here, and you get an email.</p>
        ) : (
          <ul className="ib-rows">
            {rows.map((r) => (
              <li key={r.id}>
                <button type="button" className="ib-row" aria-current={r.id === openId ? 'true' : undefined} data-unread={r.unread ? '' : undefined} onClick={() => open(r.id)}>
                  <span className="ib-row-top">
                    <span className="ib-name">{r.name}</span>
                    <span className="ib-ago">{ago(r.updatedAt)}</span>
                  </span>
                  <span className="ib-last">
                    {r.last.from === 'thomas' ? 'You: ' : ''}
                    {r.last.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="ib-thread" aria-label="Conversation">
        {!openId ? (
          <p className="ib-empty ib-pick">Pick a conversation.</p>
        ) : !convo ? (
          <p className="ib-empty">Loading…</p>
        ) : (
          <>
            <header className="ib-thread-head">
              <button type="button" className="ib-back" onClick={() => open(null)} aria-label="Back to all messages">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="ib-who">
                <p className="ib-who-name">{convo.name}</p>
                <a className="ib-who-mail" href={`mailto:${convo.email}`}>
                  {convo.email}
                </a>
              </div>
            </header>
            <div className="ib-msgs" role="log" aria-live="polite">
              {convo.context ? (
                <details className="ib-context">
                  <summary>What they asked Instant first</summary>
                  <pre>{convo.context}</pre>
                </details>
              ) : null}
              {convo.messages.map((m) => (
                <div key={m.id} className="ib-msg" data-from={m.from}>
                  <p className="ib-bubble">{m.text}</p>
                  <span className="ib-when">{when(m.at)}</span>
                </div>
              ))}
              <div ref={end} />
            </div>
            <form
              className="ib-compose"
              onSubmit={(e) => {
                e.preventDefault()
                void reply()
              }}
            >
              <label htmlFor="ib-reply" className="ib-sr">
                Your answer to {convo.name}
              </label>
              <textarea
                id="ib-reply"
                rows={1}
                maxLength={2000}
                value={draft}
                placeholder={`Answer ${convo.name.split(/\s+/)[0]}`}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    void reply()
                  }
                }}
              />
              <button type="submit" className="ib-send" disabled={busy || !draft.trim()}>
                {busy ? 'Sending…' : 'Send'}
              </button>
            </form>
            <p className="ib-note">{error || 'They see it in their chat right away, and by email if they have left the page.'}</p>
          </>
        )}
      </section>
    </div>
  )
}
