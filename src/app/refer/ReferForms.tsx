'use client'

import { useEffect, useRef, useState } from 'react'
import { CONTACT_EMAIL } from '@/lib/contact'
import { REFER_API, shareLink, trackerLink } from '@/lib/referrals'
import CopyRow from './CopyRow'

/**
 * The referral page's two forms (T-284): "Get your link" (a name and an email
 * give a personal link at once, and a private tracker the first time) and "Or
 * tell us about someone". Both post to this site's own /api/refer (REFER_API,
 * T-293). The hidden `company` field and the time since the page
 * opened are its spam checks; a person never sees either.
 */

const SUBMIT_TIMEOUT_MS = 12_000
/** The records turn away anything sent faster than a person could; wait it out. */
const FASTEST_HUMAN_MS = 1600

const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60'

type You = { name: string; email: string }
/** `origin` is this site's address, read when the link came back. */
type Link = { code: string; tracker: string; origin: string }

async function post(
  body: Record<string, unknown>,
  openedAt: number,
): Promise<{ code?: string; tracker?: string; error?: string }> {
  const wait = FASTEST_HUMAN_MS - (Date.now() - openedAt)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  try {
    const response = await fetch(REFER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      body: JSON.stringify({ ...body, elapsedMs: Date.now() - openedAt }),
    })
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      code?: string
      tracker?: string
      error?: string
    }
    if (!response.ok || !data.ok || !data.code) {
      return { error: data.error || 'That did not work just now. Please try again.' }
    }
    return { code: data.code, tracker: data.tracker ?? '' }
  } catch (error) {
    const timedOut =
      error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return {
      error: timedOut
        ? 'That took too long. Please try again.'
        : 'Could not reach the server. Your connection may have dropped.',
    }
  }
}

function Field({
  id,
  label,
  optional,
  ...input
}: { id: string; label: string; optional?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {optional ? <span className="ml-1 font-normal text-muted">(optional)</span> : null}
      </label>
      <input id={id} className={`${inputClass} mt-2`} {...input} />
    </div>
  )
}

function Tick({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line-strong p-3 hover:border-ink"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 accent-[var(--color-accent)]"
      />
      <span className="text-sm text-body">{children}</span>
    </label>
  )
}

function Honeypot({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
      <label htmlFor={id}>Company</label>
      <input
        id={id}
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function ReferForms() {
  const [you, setYou] = useState<You>({ name: '', email: '' })
  const [link, setLink] = useState<Link>({ code: '', tracker: '', origin: '' })
  // A second form sent later answers without the tracker; keep the one shown.
  const onLink = (next: { code: string; tracker: string }) =>
    setLink((current) => ({
      code: next.code,
      tracker: next.tracker || current.tracker,
      origin: window.location.origin,
    }))
  const openedAt = useRef(0)
  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <GetYourLink you={you} setYou={setYou} link={link} onLink={onLink} openedAt={openedAt} />
      <TellUs you={you} setYou={setYou} onLink={onLink} openedAt={openedAt} />
    </div>
  )
}

type Shared = {
  you: You
  setYou: (you: You) => void
  onLink: (link: { code: string; tracker: string }) => void
  openedAt: React.RefObject<number>
}

function GetYourLink({ you, setYou, link, onLink, openedAt }: Shared & { link: Link }) {
  const [showName, setShowName] = useState(false)
  const [company, setCompany] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setError('')
    const result = await post({ kind: 'link', ...you, showName, company }, openedAt.current)
    setSending(false)
    if (result.code) onLink({ code: result.code, tracker: result.tracker ?? '' })
    else setError(result.error ?? '')
  }

  return (
    <section className="tile-elevated relative flex flex-col gap-5 p-7 sm:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Get your link</h2>
      {link.code ? (
        <div role="status" className="flex flex-col gap-4">
          <p className="font-semibold text-ink">Here is your link</p>
          <CopyRow value={shareLink(link.origin, link.code)} label="your link" />
          <p className="text-sm text-muted">Asked with the same email again, you get this same link back.</p>
          {link.tracker ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-line-strong p-5">
              <p className="font-semibold text-ink">Your private tracker</p>
              <p className="text-sm text-body">
                Keep this link to yourself. It is shown only once. On it you see how each person you
                referred is getting on, and choose how you are paid: PayPal, Venmo or Apple Cash.
              </p>
              <CopyRow value={trackerLink(link.origin, link.tracker)} label="your tracker link" />
              <a href={trackerLink(link.origin, link.tracker)} className="btn-primary self-start">
                Open your tracker
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Your private tracker was shown when you first got your link. Lost it? Write to{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
                {CONTACT_EMAIL}
              </a>{' '}
              and I will send it to you.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <fieldset disabled={sending} className="grid gap-5 border-0 p-0">
            <Field
              id="refer-name"
              label="Your name"
              autoComplete="name"
              value={you.name}
              onChange={(e) => setYou({ ...you, name: e.target.value })}
              required
            />
            <Field
              id="refer-email"
              label="Your email"
              type="email"
              autoComplete="email"
              value={you.email}
              onChange={(e) => setYou({ ...you, email: e.target.value })}
              required
            />
            <Tick id="refer-show-name" checked={showName} onChange={setShowName}>
              Show my first name on the page my link opens
            </Tick>
            <Honeypot id="refer-company" value={company} onChange={setCompany} />
          </fieldset>
          {error ? (
            <p className="text-sm font-semibold text-ink" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary self-start" disabled={sending}>
            {sending ? 'Getting your link…' : 'Get my link'}
          </button>
        </form>
      )}
    </section>
  )
}

const NO_ONE = { schoolName: '', website: '', contactName: '', contactEmail: '', howTheyKnow: '' }

function TellUs({ you, setYou, onLink, openedAt }: Shared) {
  const [them, setThem] = useState(NO_ONE)
  const [mayMention, setMayMention] = useState(false)
  const [company, setCompany] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sentFor, setSentFor] = useState('')

  const set = (key: keyof typeof NO_ONE) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setThem((current) => ({ ...current, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setError('')
    const result = await post(
      { kind: 'school', ...you, ...them, mayMention, company },
      openedAt.current,
    )
    setSending(false)
    if (result.code) {
      onLink({ code: result.code, tracker: result.tracker ?? '' })
      setSentFor(them.schoolName.trim())
      setThem(NO_ONE)
    } else {
      setError(result.error ?? '')
    }
  }

  return (
    <section className="tile-elevated relative flex flex-col gap-5 p-7 sm:p-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Or tell us about someone</h2>
        <p className="text-body">Tell me who they are and I will get in touch.</p>
      </div>
      {sentFor ? (
        <div role="status" className="flex flex-col items-start gap-4">
          <p className="font-semibold text-ink [overflow-wrap:anywhere]">
            Thank you. {sentFor} is with me, counted as yours.
          </p>
          <p className="text-sm text-muted">Your own link and tracker are in the box beside this one.</p>
          <button type="button" className="btn-ghost" onClick={() => setSentFor('')}>
            Tell us about another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <fieldset disabled={sending} className="grid gap-5 border-0 p-0">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="tip-your-name"
                label="Your name"
                autoComplete="name"
                value={you.name}
                onChange={(e) => setYou({ ...you, name: e.target.value })}
                required
              />
              <Field
                id="tip-your-email"
                label="Your email"
                type="email"
                autoComplete="email"
                value={you.email}
                onChange={(e) => setYou({ ...you, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="tip-org"
                label="Their school, business or organization"
                autoComplete="off"
                value={them.schoolName}
                onChange={set('schoolName')}
                required
              />
              <Field
                id="tip-website"
                label="Their website"
                optional
                autoComplete="off"
                value={them.website}
                onChange={set('website')}
              />
              <Field
                id="tip-contact"
                label="Who to talk to"
                optional
                autoComplete="off"
                value={them.contactName}
                onChange={set('contactName')}
              />
              <Field
                id="tip-contact-email"
                label="Their email"
                optional
                type="email"
                autoComplete="off"
                value={them.contactEmail}
                onChange={set('contactEmail')}
              />
            </div>
            <Field
              id="tip-how"
              label="How do you know them?"
              optional
              autoComplete="off"
              placeholder="A co-op, church or friend"
              value={them.howTheyKnow}
              onChange={set('howTheyKnow')}
            />
            <Tick id="tip-may-mention" checked={mayMention} onChange={setMayMention}>
              You may tell them I suggested this
            </Tick>
            <Honeypot id="tip-company" value={company} onChange={setCompany} />
          </fieldset>
          {error ? (
            <p className="text-sm font-semibold text-ink" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary self-start" disabled={sending}>
            {sending ? 'Sending…' : 'Send it to Thomas'}
          </button>
        </form>
      )}
    </section>
  )
}
