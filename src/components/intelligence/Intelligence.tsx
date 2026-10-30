'use client'

import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { sans } from '@/components/cinematic/fonts'
import './intelligence.css'
import { paintDark } from '@/lib/paint-dark'

/**
 * Intelligence (T-375): the square in the bottom-right corner of every studio
 * page. It opens a small chat that answers questions about Thomas and his work
 * (Claude Haiku, through /api/intelligence, from content/intelligence.md
 * only). While it thinks, a light sweeps across a placeholder line; then the
 * answer comes in word by word. With less motion asked for, the placeholder
 * only pulses and the words simply appear.
 *
 * Someone who wants a quote can send the conversation to Thomas: a short form
 * asks for their name and email, shows them back with exactly what will be
 * shared, and only their own "Send to Thomas" sends it (/api/intelligence/send).
 *
 * A guide or blog post's "Summarize this article" button (SummarizeButton)
 * opens it and asks for that article in a few bullet points. The article's
 * path goes with that question and every follow-up, so the route reads the
 * article's own text (T-388); a new conversation forgets it.
 */

type Item = {
  id: number
  role: 'user' | 'assistant' | 'note'
  text: string
  /** The route's signature on a finished answer; only signed answers go back to it. */
  sig?: string
  /** Still coming in. */
  live?: boolean
  /** Left out of the conversation sent back (a question that got no answer, a note). */
  aside?: boolean
}

type Handoff = 'closed' | 'form' | 'confirm' | 'sending' | 'sent'

const SUGGESTIONS = ['What has Thomas built?', 'What would an app cost?', 'What is AI consultation?']
const MAX_CHARS = 500

/** Fired by site search when nothing on the site matches (T-391): the chat opens and asks exactly that. */
export const ASK_EVENT = 'ki:ask'
export type AskRequest = { question: string }

/** Fired by SummarizeButton; the floating chat answers it. Keep the question in step with SUMMARIZE_QUESTION in src/lib/intelligence.ts. */
export const SUMMARIZE_EVENT = 'ki:summarize'
export type SummarizeRequest = { path: string; title: string }
const SUMMARIZE_QUESTION = 'Summarize this article: '

/** Phones (and a phone on its side): the panel is a bottom sheet. Keep in step with intelligence.css. */
const PHONE = '(max-width: 759px), (max-height: 520px)'
/** Wide touch screens (iPad, a fold phone opened out): a wide panel on the visible part of the screen. Keep in step with intelligence.css. */
const WIDE_TOUCH = '(min-width: 760px) and (min-height: 521px) and (hover: none) and (pointer: coarse)'
/** Touch screens, where putting the cursor in the box would raise the keyboard before they asked for it. */
const NO_AUTOFOCUS = `${PHONE}, ${WIDE_TOUCH}`

let nextId = 1

export default function Intelligence({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(inline)
  const [items, setItems] = useState<Item[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [handoff, setHandoff] = useState<Handoff>('closed')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [handoffError, setHandoffError] = useState('')
  const [full, setFull] = useState(false)
  /** The article the conversation is about, once its Summarize button was pressed. */
  const [about, setAbout] = useState<SummarizeRequest | null>(null)

  const square = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)
  /** Set on close: focus goes back to the square once it is showing again. */
  const returnFocus = useRef(false)
  const phone = useMedia(PHONE)
  const wideTouch = useMedia(WIDE_TOUCH)
  const sheet = phone || wideTouch
  const ids = useId()
  const panelId = `${ids}-panel`
  const titleId = `${ids}-title`

  useEffect(() => () => request.current?.abort(), [])

  // "Summarize this article": open, and ask about that article. A conversation
  // that is full starts again; one already waiting for an answer is left alone.
  const summarize = useRef<(r: SummarizeRequest) => void>(() => {})
  summarize.current = (r) => {
    if (busy) {
      setOpen(true)
      return
    }
    const fresh = full
    if (fresh) {
      setItems([])
      setFull(false)
      setHandoff('closed')
    }
    setAbout(r)
    setOpen(true)
    ask(SUMMARIZE_QUESTION + r.title, { article: r.path, from: fresh ? [] : items, focusAfter: true })
  }
  useEffect(() => {
    if (inline) return
    const on = (e: Event) => summarize.current((e as CustomEvent<SummarizeRequest>).detail)
    window.addEventListener(SUMMARIZE_EVENT, on)
    return () => window.removeEventListener(SUMMARIZE_EVENT, on)
  }, [inline])

  // Opening puts the cursor in the question box (not on a phone, where that
  // would raise the keyboard before they asked for it); closing puts it back on the square.
  useEffect(() => {
    if (open) {
      if (!inline && !window.matchMedia(NO_AUTOFOCUS).matches) input.current?.focus({ preventScroll: true })
    } else if (returnFocus.current) square.current?.focus({ preventScroll: true })
    returnFocus.current = false
  }, [open])

  // On a phone (and on a wide touch screen, T-383) the sheet sits on the visual viewport,
  // the part of the screen that is actually showing: when the keyboard comes up that part
  // shrinks (and Safari may slide it down the page), and the sheet follows it, so the
  // question box stays just above the keys. The page behind is locked while it is open.
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!open || !sheet || !el || inline) return
    const vv = window.visualViewport
    const place = () => {
      const height = vv?.height ?? window.innerHeight
      const top = vv?.offsetTop ?? 0
      el.style.setProperty('--ki-vh', `${height}px`)
      el.style.setProperty('--ki-top', `${top}px`)
      // The gap between the bottom of the page and the bottom of what is showing: the keyboard.
      el.style.setProperty('--ki-bottom', `${Math.max(0, window.innerHeight - (height + top))}px`)
      // The keys are up when the visible part is well short of the window, or
      // (iOS may shrink the window along with it) when a box in the sheet has the cursor.
      const typing = el.contains(document.activeElement) && /^(TEXTAREA|INPUT)$/.test(document.activeElement?.tagName ?? '')
      if (typing || height < window.innerHeight - 120) el.setAttribute('data-keys', '')
      else el.removeAttribute('data-keys')
    }
    place()
    vv?.addEventListener('resize', place)
    vv?.addEventListener('scroll', place)
    window.addEventListener('resize', place)
    el.addEventListener('focusin', place)
    const afterFocus = () => window.setTimeout(place, 0)
    el.addEventListener('focusout', afterFocus)

    const html = document.documentElement
    const y = window.scrollY
    const was = { top: document.body.style.top, position: document.body.style.position, left: document.body.style.left, right: document.body.style.right }
    html.classList.add('ki-lock')
    const unpaint = paintDark()
    document.body.style.position = 'fixed'
    document.body.style.top = `${-y}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    return () => {
      vv?.removeEventListener('resize', place)
      vv?.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
      el.removeEventListener('focusin', place)
      el.removeEventListener('focusout', afterFocus)
      el.removeAttribute('data-keys')
      html.classList.remove('ki-lock')
      unpaint()
      Object.assign(document.body.style, was)
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [open, sheet, inline])

  // Escape closes it wherever the focus is, even after a button it was on has gone.
  useEffect(() => {
    if (!open || inline) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (document.documentElement.classList.contains('cn-menu-lock')) return // the header's menu is open; it closes first
      close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Sent: the cursor goes back to the question box.
  useEffect(() => {
    if (handoff === 'sent' && !inline && !window.matchMedia(NO_AUTOFOCUS).matches) input.current?.focus({ preventScroll: true })
  }, [handoff])

  // Site search found nothing: open and ask what they typed (the chat built into
  // the Get started page answers there, where no floating one is). One already
  // waiting for an answer, or full, keeps the question in the box instead.
  const fromSearch = useRef<(question: string) => void>(() => {})
  fromSearch.current = (question) => {
    setOpen(true)
    if (inline) root.current?.scrollIntoView({ block: 'center' })
    if (busy || full) setDraft(question.slice(0, MAX_CHARS))
    else ask(question.slice(0, MAX_CHARS))
  }
  useEffect(() => {
    const on = (e: Event) => fromSearch.current((e as CustomEvent<AskRequest>).detail.question)
    window.addEventListener(ASK_EVENT, on)
    return () => window.removeEventListener(ASK_EVENT, on)
  }, [])

  // Keep the newest words in view as they come in, unless the reader has
  // scrolled up to read something earlier.
  const pinned = useRef(true)
  useEffect(() => {
    const el = log.current
    if (!el) return
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    }
    const follow = new MutationObserver(() => {
      if (pinned.current) el.scrollTop = el.scrollHeight
    })
    follow.observe(el, { childList: true, subtree: true, characterData: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      follow.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  function close() {
    returnFocus.current = true
    setOpen(false)
  }

  /** The conversation so far, as the route expects it. */
  function history(list: Item[]) {
    return list
      .filter((i) => !i.aside && i.role !== 'note' && !i.live)
      .map((i) => (i.role === 'user' ? { role: 'user', content: i.text } : { role: 'assistant', content: i.text, sig: i.sig }))
  }

  function patch(id: number, change: Partial<Item>) {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)))
  }

  async function ask(
    question: string,
    { article = about?.path, from = items, focusAfter = false }: { article?: string; from?: Item[]; focusAfter?: boolean } = {},
  ) {
    const text = question.trim()
    if (!text || busy || (full && from === items)) return
    const asked: Item = { id: nextId++, role: 'user', text }
    const answer: Item = { id: nextId++, role: 'assistant', text: '', live: true }
    const messages = [...history(from), { role: 'user', content: text }]
    setItems((list) => [...list, asked, answer])
    setDraft('')
    setBusy(true)
    pinned.current = true

    // No answer: the question stays on screen but leaves the conversation.
    const fail = (why: string) => {
      setItems((list) =>
        list.map((i) =>
          i.id === asked.id ? { ...i, aside: true } : i.id === answer.id ? { ...i, role: 'note', text: why, live: false, aside: true } : i,
        ),
      )
    }

    const controller = new AbortController()
    request.current = controller
    try {
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article ? { messages, article } : { messages }),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) {
        const said = (await response.json().catch(() => null)) as { error?: string } | null
        fail(said?.error || 'Something went wrong getting an answer. Try again in a moment, or use /get-started.')
        if (response.status === 400 && said?.error?.startsWith('This conversation is full')) setFull(true)
        return
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      let words = ''
      let finished = false
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as { t?: string; done?: boolean; sig?: string; offer?: boolean; error?: string }
          if (event.t) {
            words += event.t
            patch(answer.id, { text: words })
          } else if (event.done) {
            finished = true
            patch(answer.id, { text: words.trim(), sig: event.sig, live: false })
            if (event.offer) setHandoff((h) => (h === 'sent' ? h : 'form'))
            // After a summary the question box is ready for a follow-up (not on
            // touch screens, where the keyboard would cover the summary).
            if (focusAfter && !window.matchMedia(NO_AUTOFOCUS).matches) input.current?.focus({ preventScroll: true })
          } else if (event.error) {
            fail(event.error)
            return
          }
        }
      }
      if (!finished) fail('The answer was cut off. Try asking again.')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') fail('Intelligence could not be reached. Check your connection and try again.')
    } finally {
      setBusy(false)
      request.current = null
    }
  }

  async function sendToThomas() {
    setHandoff('sending')
    setHandoffError('')
    try {
      const response = await fetch('/api/intelligence/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history(items), name, email, company: '' }),
      })
      const said = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!response.ok || !said?.ok) {
        setHandoffError(said?.error || 'That could not be sent just now. Please use the contact form at /get-started instead.')
        setHandoff('confirm')
        return
      }
      setHandoff('sent')
    } catch {
      setHandoffError('That could not be sent just now. Please use the contact form at /get-started instead.')
      setHandoff('confirm')
    }
  }

  const answered = items.some((i) => i.role === 'assistant' && i.sig)
  const lastIsAnswer = (() => {
    const kept = items.filter((i) => !i.aside && i.role !== 'note')
    const last = kept[kept.length - 1]
    return last?.role === 'assistant' && !!last.sig
  })()

  return (
    <div ref={root} className={`ki ${inline ? 'ki--inline ' : ''}${sans.variable}`} data-open={open ? '' : undefined}>
      {inline ? null : (
      <button
        ref={square}
        type="button"
        className="ki-square"
        aria-expanded={open}
        aria-controls={panelId}
        data-busy={busy ? '' : undefined}
        onClick={() => setOpen(true)}
      >
        <Spark />
        <span className="ki-square-title">Intelligence</span>
        <span className="ki-square-sub">Ask anything about me and what I built</span>
      </button>
      )}

      {inline ? null : <div className="ki-backdrop" hidden={!open} onClick={close} aria-hidden="true" />}

      <section
        id={panelId}
        role={inline ? 'region' : 'dialog'}
        aria-labelledby={titleId}
        className="ki-panel"
        hidden={!open}
        data-busy={busy ? '' : undefined}
      >
        <span className="ki-edge" aria-hidden="true" />
        <header className="ki-head">
          <div>
            <h2 id={titleId} className="ki-title">
              <Spark /> Intelligence
            </h2>
            <p className="ki-sub">Ask anything about me and what I built</p>
          </div>
          {inline ? null : (
            <button type="button" className="ki-close" aria-label="Close Intelligence" onClick={close}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </header>

        <div ref={log} className="ki-log" role="log" aria-live="polite" aria-busy={busy} aria-label="Conversation">
          {items.length === 0 ? (
            <div className="ki-hello">
              <p>
                <span className="ki-long">Ask about the apps and sites Thomas has built, how he works, or what a project of yours might take.</span>
                <span className="ki-short">Ask about Thomas&rsquo;s work, or what a project might cost.</span>
              </p>
              <div className="ki-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="ki-chip" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {items.map((item) =>
            item.role === 'user' ? (
              <p key={item.id} className="ki-q" data-aside={item.aside ? '' : undefined}>
                <span className="ki-sr">You asked: </span>
                {item.text}
              </p>
            ) : item.role === 'note' ? (
              <div key={item.id} className="ki-note">
                <Linked text={item.text} />
              </div>
            ) : item.live && !item.text ? (
              <Thinking key={item.id} />
            ) : (
              <div key={item.id} className="ki-a">
                <span className="ki-sr">Intelligence: </span>
                <Reveal text={item.text} live={!!item.live} />
              </div>
            ),
          )}

          {handoff !== 'closed' ? (
            <Handoff
              step={handoff}
              name={name}
              email={email}
              error={handoffError}
              onName={setName}
              onEmail={setEmail}
              onContinue={() => {
                setHandoffError('')
                setHandoff('confirm')
              }}
              onEdit={() => setHandoff('form')}
              onSend={sendToThomas}
              onCancel={() => setHandoff('closed')}
            />
          ) : null}
        </div>

        <p className="ki-sr" role="status">
          {busy ? 'Intelligence is thinking.' : ''}
        </p>

        {full ? (
          <div className="ki-full">
            <button
              type="button"
              className="ki-link"
              onClick={() => {
                setItems([])
                setFull(false)
                setHandoff('closed')
                setAbout(null)
              }}
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          <form
            className="ki-form"
            onSubmit={(e) => {
              e.preventDefault()
              ask(draft)
            }}
          >
            <label htmlFor={`${ids}-q`} className="ki-sr">
              Your question
            </label>
            <textarea
              ref={input}
              id={`${ids}-q`}
              rows={1}
              maxLength={MAX_CHARS}
              value={draft}
              placeholder={about ? 'Ask about this article, or anything else' : 'Ask a question'}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => {
                // Fallback: once the keyboard has finished rising, make sure the box is in view.
                const box = e.currentTarget
                window.setTimeout(() => box.scrollIntoView({ block: inline ? 'center' : 'nearest' }), 300)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  ask(draft)
                }
              }}
            />
            <button type="submit" className="ki-ask" disabled={busy || !draft.trim()} aria-label="Ask">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        )}
        <p className="ki-foot">
          {answered && lastIsAnswer && handoff === 'closed' && !busy ? (
            <>
              <button type="button" className="ki-link" onClick={() => setHandoff('form')}>
                Send this to Thomas
              </button>
              {' · '}
            </>
          ) : null}
          Answers by Claude Haiku from this site, and can be wrong.
        </p>
      </section>
    </div>
  )
}

/** The same chat, built into a page: always open, in the flow of the page. */
export function IntelligenceInline() {
  return <Intelligence inline />
}

export function Spark() {
  return (
    <svg className="ki-spark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M8 0.8c.5 3.6 2.6 5.7 7.2 7.2-4.6 1.5-6.7 3.6-7.2 7.2C7.5 11.6 5.4 9.5.8 8 5.4 6.5 7.5 4.4 8 .8z" fill="currentColor" />
    </svg>
  )
}

/** The placeholder while Claude is thinking: a light sweeps across it. */
function Thinking() {
  return (
    <div className="ki-think" aria-hidden="true">
      <span className="ki-think-word">Thinking</span>
      <span className="ki-bar" />
      <span className="ki-bar ki-bar-short" />
    </div>
  )
}

/**
 * The answer, a word at a time: words that have arrived are let out at a
 * steady pace, each fading in. Finished and caught up, it shows the plain text
 * with its links. With less motion asked for, everything shows at once.
 */
function Reveal({ text, live }: { text: string; live: boolean }) {
  const words = text.split(/(\s+)/)
  const [shown, setShown] = useState(0)
  const calm = useCalm()
  const caughtUp = calm || shown >= words.length

  useEffect(() => {
    if (caughtUp) return
    const timer = window.setInterval(() => setShown((n) => n + 2), 45)
    return () => window.clearInterval(timer)
  }, [caughtUp])

  if (!live && caughtUp) return <Linked text={text} />
  return (
    <p className="ki-words">
      {words.slice(0, calm ? words.length : shown).map((w, i) => (/\s+/.test(w) ? w : <span key={i} className="ki-word">{w}</span>))}
    </p>
  )
}

const CALM = '(prefers-reduced-motion: reduce)'

function useMedia(media: string) {
  return useSyncExternalStore(
    (change) => {
      const query = window.matchMedia(media)
      query.addEventListener('change', change)
      return () => query.removeEventListener('change', change)
    },
    () => window.matchMedia(media).matches,
    () => false,
  )
}

function useCalm() {
  return useSyncExternalStore(
    (change) => {
      const query = window.matchMedia(CALM)
      query.addEventListener('change', change)
      return () => query.removeEventListener('change', change)
    },
    () => window.matchMedia(CALM).matches,
    () => false,
  )
}

/* Site pages, the email address and the products' own sites become links. */
const PAGES = '(?:get-started|portfolio(?:\\/(?:farzana-classroom|kcupg|delta))?|ai-tooling|about|mission|refer|blog|journal|(?:guides|from-the-field)(?:/[a-z0-9-]+)?|latin-game|tap-to-tick|ruta|prayer|ministry|sign)'
const LINKABLE = new RegExp(
  `(\\/${PAGES}\\b|thomas@kingdom-sites\\.com|\\b(?:farzana\\.app|kcupgs\\.com|getruta\\.com|deltadevelopmentproject\\.com)\\b)`,
  'g',
)

/** A summary's "• " lines are shown as a list. */
const BULLET = /^\s*[•*-]\s+/

function Linked({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/)
  return (
    <>
      {paragraphs.map((para, p) => {
        const lines = para.split('\n').filter((l) => l.trim())
        if (lines.length > 0 && lines.every((l) => BULLET.test(l))) {
          return (
            <ul key={p} className="ki-list">
              {lines.map((l, i) => (
                <li key={i}>
                  <Links text={l.replace(BULLET, '')} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={p} className="ki-words">
            <Links text={para} />
          </p>
        )
      })}
    </>
  )
}

function Links({ text }: { text: string }) {
  return text.split(LINKABLE).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
    const href = part.startsWith('/') ? part : part.includes('@') ? `mailto:${part}` : `https://${part}`
    const external = href.startsWith('https://')
    return (
      <a key={i} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {part}
      </a>
    )
  })
}

function Handoff(props: {
  step: Handoff
  name: string
  email: string
  error: string
  onName: (v: string) => void
  onEmail: (v: string) => void
  onContinue: () => void
  onEdit: () => void
  onSend: () => void
  onCancel: () => void
}) {
  const id = useId()
  const { step } = props
  const nameInput = useRef<HTMLInputElement>(null)
  const sendButton = useRef<HTMLButtonElement>(null)

  // Each step puts the cursor where the visitor goes next.
  useEffect(() => {
    if (step === 'form' && !window.matchMedia(PHONE).matches) nameInput.current?.focus({ preventScroll: true })
    if (step === 'confirm') sendButton.current?.focus({ preventScroll: true })
  }, [step])

  if (step === 'sent') {
    return (
      <div className="ki-card" role="status">
        <p className="ki-card-title">
          <Check /> Sent to Thomas
        </p>
        <p className="ki-card-text">He will reply to you at {props.email}.</p>
      </div>
    )
  }

  const shared = (
    <p className="ki-card-small">
      Thomas gets your name, your email, a short summary of what you are looking for, and this conversation, the same
      way as a message from the contact form. He replies by email. Nothing is sent to you, and nothing goes anywhere
      else.
    </p>
  )

  if (step === 'confirm' || step === 'sending') {
    return (
      <div className="ki-card">
        <p className="ki-card-title">Check before it goes</p>
        <dl className="ki-card-facts">
          <dt>Name</dt>
          <dd>{props.name}</dd>
          <dt>Email</dt>
          <dd>{props.email}</dd>
        </dl>
        {shared}
        {props.error ? (
          <div className="ki-card-error" role="alert">
            <Linked text={props.error} />
          </div>
        ) : null}
        <div className="ki-card-actions">
          <button ref={sendButton} type="button" className="ki-btn" disabled={step === 'sending'} onClick={props.onSend}>
            {step === 'sending' ? 'Sending…' : 'Send to Thomas'}
          </button>
          <button type="button" className="ki-link" disabled={step === 'sending'} onClick={props.onEdit}>
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="ki-card"
      onSubmit={(e) => {
        e.preventDefault()
        props.onContinue()
      }}
    >
      <p className="ki-card-title">Send this to Thomas</p>
      <label htmlFor={`${id}-name`} className="ki-label">
        Your name
      </label>
      <input
        ref={nameInput}
        id={`${id}-name`}
        className="ki-input"
        autoComplete="name"
        required
        maxLength={100}
        value={props.name}
        onChange={(e) => props.onName(e.target.value)}
      />
      <label htmlFor={`${id}-email`} className="ki-label">
        Your email
      </label>
      <input
        id={`${id}-email`}
        className="ki-input"
        type="email"
        autoComplete="email"
        required
        maxLength={200}
        value={props.email}
        onChange={(e) => props.onEmail(e.target.value)}
      />
      {shared}
      <div className="ki-card-actions">
        <button type="submit" className="ki-btn">
          Continue
        </button>
        <button type="button" className="ki-link" onClick={props.onCancel}>
          Not now
        </button>
      </div>
    </form>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
