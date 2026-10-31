'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ASK_EVENT, type AskRequest } from '@/components/intelligence/Intelligence'
import { sans } from '@/components/cinematic/fonts'
import { paintDark } from '@/lib/paint-dark'
import { search, type Piece, type SearchIndex } from '@/lib/site-search'
import './search.css'

/**
 * Site search (T-391): the magnifying glass in the header, on every studio
 * page. It opens a search panel (a full-screen sheet on phones) with the
 * cursor in the box; results come in as you type, and Enter opens the first.
 * The index (public/search-index.json, written at build time) is fetched only
 * the first time search is about to open, so pages load no faster or slower.
 *
 * When nothing matches, one button hands exactly what was typed to the
 * Intelligence chat as its question; the chat opens, answers and stays open.
 */

const MAX_CHARS = 500 // Intelligence's own limit for one question.

let loading: Promise<SearchIndex> | null = null
function loadIndex() {
  loading ??= fetch('/search-index.json')
    .then((r) => {
      if (!r.ok) throw new Error(`search index ${r.status}`)
      return r.json() as Promise<SearchIndex>
    })
    .catch((error) => {
      loading = null // try again next time it opens
      throw error
    })
  return loading
}

export default function SiteSearch({ onOpen }: { onOpen?: () => void }) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // A new page (back, forward, a result) closes it.
  const [shownOn, setShownOn] = useState(pathname)
  if (shownOn !== pathname) {
    setShownOn(pathname)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        className="ss-btn"
        aria-label="Search the site"
        aria-haspopup="dialog"
        aria-expanded={open}
        // Start fetching as soon as they are about to open it.
        onPointerEnter={() => void loadIndex().catch(() => {})}
        onFocus={() => void loadIndex().catch(() => {})}
        onClick={() => {
          onOpen?.()
          // Opened inside the tap itself, so the box can take the cursor and a phone raises its keyboard.
          flushSync(() => setOpen(true))
        }}
      >
        <Glass />
      </button>
      {open
        ? createPortal(
            <SearchPanel
              onClose={(returnFocus) => {
                setOpen(false)
                if (returnFocus) button.current?.focus({ preventScroll: true })
              }}
            />,
            document.body,
          )
        : null}
    </>
  )
}

type Loaded = { state: 'loading' } | { state: 'ready'; index: SearchIndex } | { state: 'failed' }

function SearchPanel({ onClose }: { onClose: (returnFocus: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' })
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const askButton = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const ids = useId()

  useEffect(() => {
    let live = true
    loadIndex().then(
      (index) => live && setLoaded({ state: 'ready', index }),
      () => live && setLoaded({ state: 'failed' }),
    )
    return () => {
      live = false
    }
  }, [])

  // The panel sits on the visual viewport, the part of the screen that is actually
  // showing (as the Intelligence sheet does): when a phone's keyboard comes up that
  // part shrinks, and the panel shrinks with it, so nothing in it is under the keys.
  // The page behind is held still while it is open.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const vv = window.visualViewport
    const place = () => {
      el.style.setProperty('--ss-vh', `${vv?.height ?? window.innerHeight}px`)
      el.style.setProperty('--ss-top', `${vv?.offsetTop ?? 0}px`)
    }
    place()
    vv?.addEventListener('resize', place)
    vv?.addEventListener('scroll', place)
    window.addEventListener('resize', place)

    const html = document.documentElement
    const touch = window.matchMedia('(pointer: coarse)').matches
    const y = window.scrollY
    const was = { top: document.body.style.top, position: document.body.style.position, left: document.body.style.left, right: document.body.style.right }
    html.classList.add('ss-lock')
    const unpaint = paintDark()
    // iOS scrolls the page behind an overflow-hidden html; pinning the body stops it.
    if (touch) Object.assign(document.body.style, { position: 'fixed', top: `${-y}px`, left: '0', right: '0' })
    return () => {
      vv?.removeEventListener('resize', place)
      vv?.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
      html.classList.remove('ss-lock')
      unpaint()
      if (touch) {
        Object.assign(document.body.style, was)
        window.scrollTo({ top: y, behavior: 'instant' })
      }
    }
  }, [])

  const typed = query.trim()
  const results = useMemo(() => (loaded.state === 'ready' && typed ? search(loaded.index, typed) : []), [loaded, typed])
  const nothing = typed !== '' && (loaded.state === 'failed' || (loaded.state === 'ready' && results.length === 0))

  function askIntelligence() {
    if (!typed) return
    onClose(false)
    window.dispatchEvent(new CustomEvent<AskRequest>(ASK_EVENT, { detail: { question: typed } }))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      // Handled here: the Intelligence chat behind leaves an Escape that is already used alone.
      e.preventDefault()
      e.stopPropagation()
      onClose(true)
      return
    }
    if (e.key === 'Tab' && panel.current) {
      // Focus goes round the panel, nowhere else.
      const stops = [...panel.current.querySelectorAll<HTMLElement>('input, button, a[href]')]
      const at = stops.indexOf(document.activeElement as HTMLElement)
      const next = e.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : at === stops.length - 1 ? 0 : at + 1
      e.preventDefault()
      stops[next]?.focus()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const links = [...(panel.current?.querySelectorAll<HTMLElement>('.ss-result') ?? [])]
      if (!links.length) return
      const at = links.indexOf(document.activeElement as HTMLElement)
      e.preventDefault()
      if (e.key === 'ArrowDown') links[Math.min(links.length - 1, at + 1)].focus()
      else if (at <= 0) input.current?.focus()
      else links[at - 1].focus()
    }
  }

  return (
    <div ref={root} className={`ss ${sans.variable}`}>
      <div className="ss-backdrop" onClick={() => onClose(true)} aria-hidden="true" />
      <div ref={panel} className="ss-panel" role="dialog" aria-modal="true" aria-label="Search the site" onKeyDown={onKeyDown}>
        <form
          className="ss-bar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (!typed) return
            if (results[0]) {
              onClose(false)
              router.push(results[0].url)
            } else if (nothing) askButton.current?.focus()
          }}
        >
          <Glass />
          <label htmlFor={`${ids}-q`} className="ss-sr">
            Search the site
          </label>
          <input
            ref={input}
            id={`${ids}-q`}
            className="ss-input"
            type="search"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            maxLength={MAX_CHARS}
            placeholder="Search the site"
            value={query}
            aria-controls={`${ids}-results`}
            aria-describedby={`${ids}-status`}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="ss-close" aria-label="Close search" onClick={() => onClose(true)}>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <div className="ss-body" id={`${ids}-results`}>
          {results.length ? (
            <ul className="ss-list">
              {results.map((r, i) => (
                <li key={r.url}>
                  <Link href={r.url} className="ss-result" data-first={i === 0 ? '' : undefined} onClick={() => onClose(false)}>
                    <span className="ss-section">{r.section}</span>
                    <span className="ss-title">
                      <Marked pieces={r.title} />
                    </span>
                    {r.snippet.length ? (
                      <span className="ss-snippet">
                        <Marked pieces={r.snippet} />
                      </span>
                    ) : null}
                    {i === 0 ? (
                      <span className="ss-enter" aria-hidden="true">
                        Enter ↵
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : nothing ? (
            <div className="ss-none">
              <p>
                {loaded.state === 'failed'
                  ? 'Search could not load just now. Ask Intelligence instead?'
                  : 'Nothing on the site matches that. Ask Intelligence instead?'}
              </p>
              <button ref={askButton} type="button" className="ss-ask" onClick={askIntelligence}>
                <Spark /> Ask Intelligence
              </button>
            </div>
          ) : typed && loaded.state === 'loading' ? (
            <p className="ss-hint">Searching…</p>
          ) : (
            <p className="ss-hint">Every page: the portfolio, the apps, the Journal, the guides and the ministries.</p>
          )}
        </div>

        <p id={`${ids}-status`} className="ss-sr" role="status">
          {!typed ? '' : results.length ? `${results.length} ${results.length === 1 ? 'page' : 'pages'} found. Enter opens the first.` : nothing ? 'Nothing found.' : ''}
        </p>
      </div>
    </div>
  )
}

function Marked({ pieces }: { pieces: Piece[] }) {
  return pieces.map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : p.text))
}

function Glass() {
  return (
    <svg className="ss-glass" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <circle cx="8.6" cy="8.6" r="5.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M12.8 12.8l4.4 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Spark() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 0.8c.5 3.6 2.6 5.7 7.2 7.2-4.6 1.5-6.7 3.6-7.2 7.2C7.5 11.6 5.4 9.5.8 8 5.4 6.5 7.5 4.4 8 .8z" fill="currentColor" />
    </svg>
  )
}
