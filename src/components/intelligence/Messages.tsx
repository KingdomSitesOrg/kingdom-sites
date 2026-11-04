'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * The Intelligence panel's "Thomas" tab: write to Thomas himself (lib/chat).
 * The first message asks for a name and an email (his answers are emailed
 * there too), and can bring the conversation with Instant along. After that it
 * is a thread: what they wrote, what he answered, and a box to carry on.
 *
 * The conversation is kept in this browser by its id and private key, and the
 * link in Thomas's email (/?chat=<id>.<key>) brings it back on any device.
 * While the tab is open it checks for his answers every few seconds; otherwise
 * now and then, to show a dot when one has arrived.
 */

type Message = { id: string; from: 'visitor' | 'thomas'; text: string; at: string }
type Thread = { id: string; name: string; email: string; messages: Message[] }
type Saved = { id: string; key: string }

const SAVED = 'ks-chat'
const READ = 'ks-chat-read'
const PROMISE = 'Thomas replies within 12 to 24 hours.'
const FAST_MS = 5_000
const SLOW_MS = 60_000
const MAX_CHARS = 2000

function readSaved(): Saved | null {
  try {
    // A link from Thomas's email brings the conversation to this browser.
    const fromLink = new URLSearchParams(window.location.search).get('chat')
    if (fromLink) {
      const [id, key] = fromLink.split('.')
      if (id && key) {
        const saved = { id, key }
        localStorage.setItem(SAVED, JSON.stringify(saved))
        return saved
      }
    }
    const raw = localStorage.getItem(SAVED)
    const saved = raw ? (JSON.parse(raw) as Saved) : null
    return saved?.id && saved?.key ? saved : null
  } catch {
    return null
  }
}

/** The link from Thomas's email: open the panel on this tab (Intelligence.tsx). */
export function hasChatLink(): boolean {
  return new URLSearchParams(window.location.search).has('chat')
}

const when = (at: string) =>
  new Date(at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Messages({
  active,
  inline,
  aiAnswered,
  aiHistory,
  onUnread,
}: {
  /** The tab is showing (and the panel open). */
  active: boolean
  inline: boolean
  /** Instant has answered something worth bringing along. */
  aiAnswered: boolean
  /** The Instant conversation, signed, as /api/chat expects it. */
  aiHistory: () => unknown[]
  onUnread: (unread: boolean) => void
}) {
  const ids = useId()
  const [saved, setSaved] = useState<Saved | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [draft, setDraft] = useState('')
  const [bring, setBring] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const trap = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSaved(readSaved())
  }, [])

  const load = useCallback(async (s: Saved) => {
    try {
      const response = await fetch(`/api/chat?id=${encodeURIComponent(s.id)}&key=${encodeURIComponent(s.key)}`, { cache: 'no-store' })
      if (response.status === 404) {
        // Gone, or a key that never matched: start afresh.
        localStorage.removeItem(SAVED)
        setSaved(null)
        setThread(null)
        return
      }
      const said = (await response.json().catch(() => null)) as { conversation?: Thread } | null
      if (said?.conversation) setThread(said.conversation)
    } catch {
      /* offline for a moment: the next check will do */
    }
  }, [])

  // Check for answers: often while the tab is open, now and then otherwise.
  useEffect(() => {
    if (!saved) return
    void load(saved)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(saved)
    }, active ? FAST_MS : SLOW_MS)
    return () => window.clearInterval(timer)
  }, [saved, active, load])

  // A dot on the tab for an answer not seen yet; seen once the tab shows it.
  const lastThomas = thread ? [...thread.messages].reverse().find((m) => m.from === 'thomas') : undefined
  useEffect(() => {
    if (!lastThomas) return onUnread(false)
    let read = ''
    try {
      read = localStorage.getItem(READ) ?? ''
    } catch {}
    if (active) {
      try {
        localStorage.setItem(READ, lastThomas.at)
      } catch {}
      onUnread(false)
    } else onUnread(read < lastThomas.at)
  }, [lastThomas, active, onUnread])

  useEffect(() => {
    if (active) end.current?.scrollIntoView({ block: 'nearest' })
  }, [active, thread?.messages.length])

  async function send(action: 'start' | 'send') {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    setError('')
    try {
      const body =
        action === 'start'
          ? { action, name, email, text, company: trap.current?.value ?? '', messages: bring && aiAnswered ? aiHistory() : [] }
          : { action, id: saved?.id, key: saved?.key, text }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const said = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; id?: string; key?: string; conversation?: Thread } | null
      if (!response.ok || !said?.ok) {
        setError(said?.error || 'That did not send just now. Try again in a moment.')
        return
      }
      if (action === 'start' && said.id && said.key) {
        const next = { id: said.id, key: said.key }
        try {
          localStorage.setItem(SAVED, JSON.stringify(next))
        } catch {}
        setSaved(next)
      }
      if (said.conversation) setThread(said.conversation)
      setDraft('')
    } catch {
      setError('That did not send. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  // No conversation yet: who they are, and the first message.
  if (!saved || !thread) {
    if (saved && !thread) return <div className="km-log" aria-busy="true" />
    return (
      <form
        className="km-log km-start"
        onSubmit={(e) => {
          e.preventDefault()
          void send('start')
        }}
      >
        <div className="km-intro">
          <p className="km-intro-title">Message Thomas directly</p>
          <p className="km-intro-text">
            {PROMISE} You will get his answer here and by email.
          </p>
        </div>
        <label htmlFor={`${ids}-name`} className="ki-label">
          Your name
        </label>
        <input id={`${ids}-name`} className="ki-input" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor={`${ids}-email`} className="ki-label">
          Your email
        </label>
        <input id={`${ids}-email`} className="ki-input" type="email" autoComplete="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor={`${ids}-text`} className="ki-label">
          Your message
        </label>
        <textarea
          id={`${ids}-text`}
          className="ki-input km-textarea"
          required
          rows={3}
          maxLength={MAX_CHARS}
          value={draft}
          placeholder="What are you thinking of building?"
          onChange={(e) => setDraft(e.target.value)}
        />
        {/* Only a bot fills this in. */}
        <input ref={trap} type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="km-trap" />
        {aiAnswered ? (
          <label className="km-check">
            <input type="checkbox" checked={bring} onChange={(e) => setBring(e.target.checked)} />
            Include my conversation with Instant
          </label>
        ) : null}
        {error ? (
          <p className="ki-card-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="ki-btn km-go" disabled={busy || !draft.trim()}>
          {busy ? 'Sending…' : 'Send to Thomas'}
        </button>
      </form>
    )
  }

  const last = thread.messages[thread.messages.length - 1]
  return (
    <>
      <div className="km-log" role="log" aria-live="polite" aria-label="Messages with Thomas">
        <p className="km-promise">{PROMISE}</p>
        {thread.messages.map((m) =>
          m.from === 'visitor' ? (
            <div key={m.id} className="km-msg km-mine">
              <span className="ki-sr">You: </span>
              <p className="km-bubble">{m.text}</p>
              <span className="km-when">{when(m.at)}</span>
            </div>
          ) : (
            <div key={m.id} className="km-msg km-his">
              <span className="km-who">Thomas</span>
              <p className="km-bubble">{m.text}</p>
              <span className="km-when">{when(m.at)}</span>
            </div>
          ),
        )}
        {last?.from === 'visitor' ? (
          <p className="km-status">
            Sent. You will hear back here, and at {thread.email}.
          </p>
        ) : null}
        <div ref={end} />
      </div>
      <form
        className="ki-form"
        onSubmit={(e) => {
          e.preventDefault()
          void send('send')
        }}
      >
        <label htmlFor={`${ids}-reply`} className="ki-sr">
          Your message to Thomas
        </label>
        <textarea
          id={`${ids}-reply`}
          rows={1}
          maxLength={MAX_CHARS}
          value={draft}
          placeholder="Write to Thomas"
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => {
            const box = e.currentTarget
            window.setTimeout(() => box.scrollIntoView({ block: inline ? 'center' : 'nearest' }), 300)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void send('send')
            }
          }}
        />
        <button type="submit" className="ki-ask" disabled={busy || !draft.trim()} aria-label="Send">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      {error ? (
        <p className="ki-card-error km-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  )
}
