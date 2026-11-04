'use client'

import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { sans } from '@/components/cinematic/fonts'
import './intelligence.css'
import { paintDark } from '@/lib/paint-dark'
import Messages, { hasChatLink } from './Messages'

/**
 * Intelligence (T-375): the square in the bottom-right corner of every studio
 * page. It opens a small chat that answers questions about Thomas and his work
 * (Claude Haiku, through /api/intelligence, from content/intelligence.md
 * only). While it thinks, a light sweeps across a placeholder line; then the
 * answer comes in word by word. With less motion asked for, the placeholder
 * only pulses and the words simply appear.
 *
 * A tab bar at the bottom switches between Instant (these answers) and Thomas
 * (Messages.tsx): writing to Thomas himself, who answers within a day, with the
 * conversation with Instant brought along if they like. "Send this to Thomas",
 * under an answer once they have described a project, opens that tab.
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

type Tab = 'instant' | 'thomas'

const SUGGESTIONS = ['What has Thomas built?', 'What would an app cost?', 'What is AI consultation?']
/* How many of their own words a visitor writes before "Send this to Thomas" is offered. */
const SEND_WORDS = 15
const MAX_CHARS = 500

/** Fired by site search when nothing on the site matches (T-391): the chat opens and asks exactly that. */
export const ASK_EVENT = 'ki:ask'
export type AskRequest = { question: string }

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
  const [tab, setTab] = useState<Tab>('instant')
  const [unread, setUnread] = useState(false)
  const [full, setFull] = useState(false)

  const square = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)
  /** Set on close: focus goes back to the square once it is showing again. */
  const returnFocus = useRef(false)
  const phone = useMedia(PHONE)
  const wideTouch = useMedia(WIDE_TOUCH)
  const sheet = phone || wideTouch
  const pathname = usePathname()
  /* On a phone the message form comes first: while the page's form (#talk) is on
     screen, the button steps aside so it never sits on top of it. */
  const [byForm, setByForm] = useState(false)
  useEffect(() => {
    const form = inline ? null : document.getElementById('talk')
    setByForm(false)
    if (!form) return
    const io = new IntersectionObserver(([e]) => setByForm(e.isIntersecting), { rootMargin: '0px 0px -12% 0px' })
    io.observe(form)
    return () => io.disconnect()
  }, [pathname, inline])
  const ids = useId()
  const panelId = `${ids}-panel`
  const titleId = `${ids}-title`

  useEffect(() => () => request.current?.abort(), [])

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

  // The link in Thomas's email: open on his tab, then tidy the address.
  useEffect(() => {
    if (inline || !hasChatLink()) return
    setOpen(true)
    setTab('thomas')
    const url = new URL(window.location.href)
    url.searchParams.delete('chat')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }, [inline])

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

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy || full) return
    const asked: Item = { id: nextId++, role: 'user', text }
    const answer: Item = { id: nextId++, role: 'assistant', text: '', live: true }
    const messages = [...history(items), { role: 'user', content: text }]
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
        body: JSON.stringify({ messages }),
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
            if (event.offer) setTab('thomas')
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

  const answered = items.some((i) => i.role === 'assistant' && i.sig)
  const lastIsAnswer = (() => {
    const kept = items.filter((i) => !i.aside && i.role !== 'note')
    const last = kept[kept.length - 1]
    return last?.role === 'assistant' && !!last.sig
  })()
  // Worth sending to Thomas only once the visitor has told it something of their
  // own: their own words (not a suggestion tapped), adding up to a real
  // description. A bare "what would an app cost?" is not enough.
  const toldEnough = (() => {
    const own = items.filter((i) => i.role === 'user' && !SUGGESTIONS.includes(i.text.trim()))
    const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length
    const total = own.reduce((n, i) => n + words(i.text), 0)
    return total >= SEND_WORDS && own.some((i) => words(i.text) >= 6)
  })()
  const offerSend = answered && lastIsAnswer && toldEnough && !busy

  return (
    <div ref={root} className={`ki ${inline ? 'ki--inline ' : ''}${sans.variable}`} data-open={open ? '' : undefined} data-by-form={byForm ? '' : undefined}>
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
        <span className="sr-only">: ask anything about me and what I built</span>
        {unread ? (
          <>
            <span className="ki-dot" aria-hidden="true" />
            <span className="sr-only"> (Thomas has answered)</span>
          </>
        ) : null}
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
              {tab === 'thomas' ? (
                'Thomas Klein'
              ) : (
                <>
                  <Spark /> Intelligence
                </>
              )}
            </h2>
            <p className="ki-sub">{tab === 'thomas' ? 'Replies within 12 to 24 hours' : 'Ask anything about me and what I built'}</p>
          </div>
          {inline ? null : (
            <button type="button" className="ki-close" aria-label="Close Intelligence" onClick={close}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </header>

        <div className="ki-view" hidden={tab !== 'instant'}>
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

          {offerSend ? (
            <button type="button" className="ki-send" onClick={() => setTab('thomas')}>
              Send this to Thomas
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
              placeholder="Ask a question"
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
          Powered by Kingdom Sites Intelligence. Uses AI, grounded in my responses.
        </p>
        </div>

        <div className="ki-view" hidden={tab !== 'thomas'}>
          <Messages
            active={open && tab === 'thomas'}
            inline={inline}
            aiAnswered={answered}
            aiHistory={() => history(items)}
            onUnread={setUnread}
          />
        </div>

        {/* Two tabs along the bottom: Instant (these answers) and Thomas himself. */}
        <nav className="ki-tabs" aria-label="Who to ask">
          <button type="button" className="ki-tab" aria-pressed={tab === 'instant'} onClick={() => setTab('instant')}>
            <Spark />
            Instant
          </button>
          <button type="button" className="ki-tab" aria-pressed={tab === 'thomas'} onClick={() => setTab('thomas')}>
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <path d="M2.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-3 2.5v-2.5h0.5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            Thomas
            {unread ? <span className="ki-dot ki-dot-tab" aria-label="New answer" /> : null}
          </button>
        </nav>
      </section>
    </div>
  )
}

/** The same chat, built into a page: always open, in the flow of the page. */
export function IntelligenceInline() {
  return <Intelligence inline />
}

function Spark() {
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
const PAGES = '(?:get-started|portfolio(?:\\/(?:farzana-classroom|kcupg|delta))?|ai-tooling|about|mission|refer|latin-game|tap-to-tick|ruta|prayer|ministry|sign)'
const LINKABLE = new RegExp(
  `(\\/${PAGES}\\b|thomas@kingdom-sites\\.com|\\b(?:farzana\\.app|kcupgs\\.com|getruta\\.com|deltadevelopmentproject\\.com)\\b)`,
  'g',
)

function Linked({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/)
  return (
    <>
      {paragraphs.map((para, p) => (
        <p key={p} className="ki-words">
          {para.split(LINKABLE).map((part, i) => {
            if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
            const href = part.startsWith('/') ? part : part.includes('@') ? `mailto:${part}` : `https://${part}`
            const external = href.startsWith('https://')
            return (
              <a key={i} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {part}
              </a>
            )
          })}
        </p>
      ))}
    </>
  )
}
