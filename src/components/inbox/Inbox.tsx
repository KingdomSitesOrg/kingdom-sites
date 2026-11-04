'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { sans } from '@/components/cinematic/fonts'
import './inbox.css'

/**
 * Thomas's inbox (/inbox), laid out like a mail app: folders (Inbox, Unread,
 * Archived) and a search over the conversations visitors started from the
 * Intelligence panel's Thomas tab, grouped by day, each with the person's
 * initials, the latest line and "Waiting on you" when they wrote last. The open
 * conversation sits beside the list, with its details on a wide screen; on a
 * phone it is one screen at a time. It checks for new messages every few
 * seconds while it is open. His answer goes to the visitor's chat, and by
 * email unless they are on the page right then (/api/chat/inbox).
 */

type Message = { id: string; from: 'visitor' | 'thomas'; text: string; at: string }
type Row = {
  id: string
  name: string
  email: string
  updatedAt: string
  createdAt: string
  last: { from: Message['from']; text: string }
  unread: boolean
  archived: boolean
  waiting: boolean
  count: number
}
type Conversation = { id: string; name: string; email: string; createdAt: string; context?: string; messages: Message[]; archived?: boolean }
type Folder = 'inbox' | 'unread' | 'archived'

const LIST_MS = 8_000
const OPEN_MS = 5_000
const DAY = 86_400_000

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

/** The same colour for the same person, every time. */
const hue = (name: string) => [...name].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) % 360

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** In the list: a time today, a weekday this week, a date before that. */
function short(at: string): string {
  const t = Date.parse(at)
  const today = startOfDay(Date.now())
  if (t >= today) return new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (t >= today - 6 * DAY) return new Date(t).toLocaleDateString(undefined, { weekday: 'short' })
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function dayLabel(t: number): string {
  const today = startOfDay(Date.now())
  if (t >= today) return 'Today'
  if (t >= today - DAY) return 'Yesterday'
  if (t >= today - 6 * DAY) return new Date(t).toLocaleDateString(undefined, { weekday: 'long' })
  return new Date(t).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

const clock = (at: string) => new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span className="ib-avatar" style={{ width: size, height: size, fontSize: size * 0.38, '--h': hue(name) } as React.CSSProperties} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

function Icon({ d, size = 18, dot }: { d: string; size?: number; dot?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {dot ? <circle cx="15.5" cy="4.5" r="3" fill="var(--hot)" stroke="var(--bg-2)" strokeWidth="1.5" /> : null}
    </svg>
  )
}
const ICONS = {
  search: 'M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM13.5 13.5L17 17',
  back: 'M12.5 4L6.5 10l6 6',
  archive: 'M3 5h14v3H3zM4.5 8v8h11V8M8 11h4',
  unarchive: 'M3 5h14v3H3zM4.5 8v8h11V8M10 15v-5M7.5 12.5L10 10l2.5 2.5',
  unread: 'M3 7h9M3 5.5v9.5h14V9M3 7l7 5 3.5-2.5',
  mail: 'M3 5h14v10H3zM3 6l7 5 7-5',
  send: 'M10 16V4M5 9l5-5 5 5',
  info: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 9v5M10 6.5v.5',
}

/** Their questions to Instant before they wrote, as a short exchange. */
function Context({ text }: { text: string }) {
  const turns = text.split(/\n\n(?=(?:Visitor|Instant|Intelligence): )/).map((t) => {
    const visitor = t.startsWith('Visitor: ')
    return { visitor, text: t.replace(/^(Visitor|Instant|Intelligence): /, '') }
  })
  return (
    <ol className="ib-ctx-turns">
      {turns.map((t, i) => (
        <li key={i} data-visitor={t.visitor ? '' : undefined}>
          <span className="ib-ctx-who">{t.visitor ? 'They asked' : 'Instant'}</span>
          <p>{t.text}</p>
        </li>
      ))}
    </ol>
  )
}

export default function Inbox() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [folder, setFolder] = useState<Folder>('inbox')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [convo, setConvo] = useState<Conversation | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(false)
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

  // The tab's title counts what is waiting, like a mail app.
  const unreadCount = rows?.filter((r) => r.unread && !r.archived).length ?? 0
  useEffect(() => {
    document.title = unreadCount ? `(${unreadCount}) Messages` : 'Messages'
  }, [unreadCount])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (rows ?? []).filter((r) => {
      if (folder === 'archived' ? !r.archived : r.archived) return false
      if (folder === 'unread' && !r.unread) return false
      return !q || `${r.name} ${r.email} ${r.last.text}`.toLowerCase().includes(q)
    })
  }, [rows, folder, query])

  // The list in days: Today, Yesterday, a weekday, then dates.
  const groups = useMemo(() => {
    const out: { label: string; rows: Row[] }[] = []
    for (const r of shown) {
      const label = dayLabel(startOfDay(Date.parse(r.updatedAt)))
      const last = out[out.length - 1]
      if (last?.label === label) last.rows.push(r)
      else out.push({ label, rows: [r] })
    }
    return out
  }, [shown])

  async function act(action: 'archive' | 'unarchive' | 'unread') {
    if (!convo) return
    await fetch('/api/chat/inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: convo.id, action }),
    }).catch(() => null)
    // Archived or marked unread: back to the list (opening it again would read it).
    if (action !== 'unarchive') open(null)
    else setConvo({ ...convo, archived: false })
    void loadRows()
  }

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
    } catch {
      setError('That did not send. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const counts = {
    inbox: rows?.filter((r) => !r.archived).length ?? 0,
    unread: unreadCount,
    archived: rows?.filter((r) => r.archived).length ?? 0,
  }
  const current = rows?.find((r) => r.id === openId)

  // The thread, split into days.
  const days = useMemo(() => {
    const out: { label: string; messages: Message[] }[] = []
    for (const m of convo?.messages ?? []) {
      const label = dayLabel(startOfDay(Date.parse(m.at)))
      const last = out[out.length - 1]
      if (last?.label === label) last.messages.push(m)
      else out.push({ label, messages: [m] })
    }
    return out
  }, [convo])

  return (
    <div className={`ib ${sans.variable}`} data-open={openId ? '' : undefined} data-details={details ? '' : undefined}>
      <aside className="ib-list" aria-label="Conversations">
        <header className="ib-head">
          <div className="ib-head-top">
            <h1 className="ib-title">Messages</h1>
            <Link href="/" className="ib-home">
              Site
            </Link>
          </div>
          <label className="ib-search">
            <Icon d={ICONS.search} size={16} />
            <span className="ib-sr">Search messages</span>
            <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="ib-folders" role="tablist" aria-label="Folders">
            {(['inbox', 'unread', 'archived'] as Folder[]).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={folder === f} className="ib-folder" onClick={() => setFolder(f)}>
                {f === 'inbox' ? 'Inbox' : f === 'unread' ? 'Unread' : 'Archived'}
                {counts[f] ? <span className="ib-folder-n">{counts[f]}</span> : null}
              </button>
            ))}
          </div>
        </header>

        <div className="ib-rows">
          {rows === null ? (
            <div className="ib-skeleton" aria-label="Loading">
              {[0, 1, 2].map((i) => (
                <span key={i} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="ib-empty">
              <Icon d={ICONS.mail} size={28} />
              <p className="ib-empty-title">
                {query ? 'Nothing matches' : folder === 'unread' ? 'All caught up' : folder === 'archived' ? 'Nothing archived' : 'No messages yet'}
              </p>
              <p className="ib-empty-text">
                {query
                  ? 'Try another name, email or word.'
                  : folder === 'inbox'
                    ? 'When someone writes to you from the Thomas tab in Ask Thomas, it shows up here, and you get an email.'
                    : ''}
              </p>
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.label} className="ib-group" aria-label={g.label}>
                <p className="ib-group-label">{g.label}</p>
                <ul>
                  {g.rows.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="ib-row"
                        aria-current={r.id === openId ? 'true' : undefined}
                        data-unread={r.unread ? '' : undefined}
                        onClick={() => open(r.id)}
                      >
                        <span className="ib-row-dot" aria-hidden="true" />
                        <Avatar name={r.name} />
                        <span className="ib-row-main">
                          <span className="ib-row-top">
                            <span className="ib-name">{r.name}</span>
                            <span className="ib-time">{short(r.updatedAt)}</span>
                          </span>
                          <span className="ib-last">
                            {r.last.from === 'thomas' ? <span className="ib-you">You: </span> : null}
                            {r.last.text}
                          </span>
                          <span className="ib-tags">
                            {r.waiting ? <span className="ib-tag ib-tag-wait">Waiting on you</span> : <span className="ib-tag">Answered</span>}
                            {r.count > 1 ? <span className="ib-tag-n">{r.count} messages</span> : null}
                          </span>
                        </span>
                        {r.unread ? <span className="ib-sr">Unread</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </aside>

      <section className="ib-thread" aria-label="Conversation">
        {!openId ? (
          <div className="ib-empty ib-pick">
            <Icon d={ICONS.mail} size={34} />
            <p className="ib-empty-title">{unreadCount ? `${unreadCount} waiting on you` : 'All caught up'}</p>
            <p className="ib-empty-text">Pick a conversation to read and answer it.</p>
          </div>
        ) : !convo ? (
          <div className="ib-skeleton ib-skeleton-thread" aria-label="Loading">
            <span />
            <span />
          </div>
        ) : (
          <>
            <header className="ib-thread-head">
              <button type="button" className="ib-icon-btn ib-back" onClick={() => open(null)} aria-label="Back to all messages">
                <Icon d={ICONS.back} />
              </button>
              <Avatar name={convo.name} size={38} />
              <div className="ib-who">
                <p className="ib-who-name">{convo.name}</p>
                <p className="ib-who-mail">{convo.email}</p>
              </div>
              <div className="ib-actions">
                <a className="ib-icon-btn" href={`mailto:${convo.email}`} aria-label={`Email ${convo.name}`} title="Email them">
                  <Icon d={ICONS.mail} />
                </a>
                <button type="button" className="ib-icon-btn" onClick={() => act('unread')} aria-label="Mark unread" title="Mark unread">
                  <Icon d={ICONS.unread} dot />
                </button>
                <button
                  type="button"
                  className="ib-icon-btn"
                  onClick={() => act(convo.archived ? 'unarchive' : 'archive')}
                  aria-label={convo.archived ? 'Move to Inbox' : 'Archive'}
                  title={convo.archived ? 'Move to Inbox' : 'Archive'}
                >
                  <Icon d={convo.archived ? ICONS.unarchive : ICONS.archive} />
                </button>
                <button type="button" className="ib-icon-btn ib-info" aria-pressed={details} onClick={() => setDetails((d) => !d)} aria-label="Details" title="Details">
                  <Icon d={ICONS.info} />
                </button>
              </div>
            </header>

            <div className="ib-msgs" role="log" aria-live="polite">
              {convo.context ? (
                <details className="ib-ctx">
                  <summary>Before writing, they asked Instant</summary>
                  <Context text={convo.context} />
                </details>
              ) : null}
              {days.map((d) => (
                <div key={d.label} className="ib-day">
                  <p className="ib-day-label">
                    <span>{d.label}</span>
                  </p>
                  {d.messages.map((m, i) => {
                    const first = i === 0 || d.messages[i - 1].from !== m.from
                    return (
                      <div key={m.id} className="ib-msg" data-from={m.from} data-first={first ? '' : undefined}>
                        {m.from === 'visitor' ? (first ? <Avatar name={convo.name} size={28} /> : <span className="ib-avatar-gap" />) : null}
                        <div className="ib-msg-body">
                          <p className="ib-bubble">{m.text}</p>
                          <span className="ib-when">{clock(m.at)}</span>
                        </div>
                      </div>
                    )
                  })}
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
              <button type="submit" className="ib-send" disabled={busy || !draft.trim()} aria-label="Send">
                <Icon d={ICONS.send} />
              </button>
            </form>
            <p className="ib-note" role={error ? 'alert' : undefined} data-error={error ? '' : undefined}>
              {error || 'They see it in their chat at once, and by email if they have left the page.'}
            </p>
          </>
        )}
      </section>

      {convo ? (
        <aside className="ib-details" aria-label="Details">
          <Avatar name={convo.name} size={64} />
          <p className="ib-d-name">{convo.name}</p>
          <a className="ib-d-mail" href={`mailto:${convo.email}`}>
            {convo.email}
          </a>
          <dl className="ib-d-facts">
            <dt>Status</dt>
            <dd>{current?.waiting ? 'Waiting on you' : 'Answered'}</dd>
            <dt>First wrote</dt>
            <dd>{new Date(convo.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd>
            <dt>Messages</dt>
            <dd>{convo.messages.length}</dd>
            <dt>Asked Instant first</dt>
            <dd>{convo.context ? 'Yes' : 'No'}</dd>
          </dl>
        </aside>
      ) : null}
    </div>
  )
}
