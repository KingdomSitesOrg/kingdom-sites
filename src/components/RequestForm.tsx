'use client'

import { useEffect, useRef, useState } from 'react'
import { CONTACT_EMAIL } from '@/lib/contact'
import {
  REQUEST_API,
  REQUEST_BUDGETS,
  REQUEST_DECIDER,
  REQUEST_NEEDS,
  REQUEST_STARTS,
} from '@/lib/request'

/**
 * The "Submit a request" form (T-547): who they are, who decides, what they
 * need, the budget, when, and the project in their own words. Posts to
 * /api/request, which emails it to Thomas the same way as the contact form.
 * On failure it offers the same send-by-email way out as InquiryForm.
 */

type Fields = {
  name: string
  business: string
  email: string
  phone: string
  decider: string
  deciderName: string
  needs: string[]
  needsOther: string
  budget: string
  start: string
  website: string
  message: string
}

const EMPTY: Fields = {
  name: '',
  business: '',
  email: '',
  phone: '',
  decider: '',
  deciderName: '',
  needs: [],
  needsOther: '',
  budget: '',
  start: '',
  website: '',
  message: '',
}

const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60'

/* A choice drawn as a tile you press; the real radio or checkbox sits inside it for keyboards and screen readers. */
const chipClass =
  'relative inline-flex min-h-[44px] cursor-pointer select-none items-center border-2 border-ink bg-surface px-4 py-2 text-[14px] font-medium text-ink transition-colors has-[:checked]:bg-ink has-[:checked]:text-[#f7f5f0] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const SUBMIT_TIMEOUT_MS = 12_000

function Optional() {
  return <span className="ml-1 font-normal text-muted">(optional)</span>
}

function Choices({
  name,
  choices,
  type,
  value,
  onChange,
}: {
  name: string
  choices: readonly string[]
  type: 'radio' | 'checkbox'
  value: string | string[]
  onChange: (choice: string, checked: boolean) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2.5">
      {choices.map((c) => (
        <label key={c} className={chipClass}>
          <input
            type={type}
            name={name}
            value={c}
            className="absolute h-px w-px opacity-0"
            checked={Array.isArray(value) ? value.includes(c) : value === c}
            onChange={(e) => onChange(c, e.target.checked)}
          />
          {c}
        </label>
      ))}
    </div>
  )
}

export default function RequestForm() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [company, setCompany] = useState('')
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }))
  const pick = (key: 'decider' | 'budget' | 'start') => (choice: string) => setFields((f) => ({ ...f, [key]: choice }))
  const toggleNeed = (choice: string, checked: boolean) =>
    setFields((f) => ({ ...f, needs: checked ? [...f.needs, choice] : f.needs.filter((n) => n !== choice) }))

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    fields.name.trim() ? `Project request from ${fields.name.trim()}` : 'Kingdom Sites project request',
  )}&body=${encodeURIComponent(
    [
      fields.business && `Business: ${fields.business}`,
      fields.needs.length > 0 && `Needs: ${fields.needs.join(', ')}`,
      fields.budget && `Budget: ${fields.budget}`,
      fields.start && `Start: ${fields.start}`,
      '',
      fields.message.trim() || '(no message)',
    ]
      .filter((l) => l !== false && l !== '')
      .join('\n'),
  )}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    if (fields.needs.length === 0) {
      setError('Please pick at least one thing you need.')
      setStatus('idle')
      return
    }
    if (!fields.budget) {
      setError('Please pick a budget, or "Not sure yet".')
      setStatus('idle')
      return
    }

    setStatus('sending')
    setError('')

    try {
      const response = await fetch(REQUEST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
        body: JSON.stringify({ ...fields, company, elapsedMs: Date.now() - openedAt.current }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setError(data.error || 'Something went wrong sending that.')
        setStatus('error')
        return
      }
      setStatus('sent')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const timedOut = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')
      setError(
        timedOut
          ? 'That took too long. Try again, or send it by email instead.'
          : 'Could not reach the server. Your connection may have dropped.',
      )
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="tile-elevated p-7 sm:p-10" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/12">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
          </svg>
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          {'Thank you, ' + (fields.name.trim().split(' ')[0] || 'friend') + '.'}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          Your request is in my inbox. I read every one myself and will reply within a day with next steps.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          Anything to add? Write to me at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    )
  }

  const sending = status === 'sending'
  const someoneElse = fields.decider !== '' && fields.decider !== 'Yes, I decide'

  return (
    <div className="tile-elevated p-7 sm:p-10">
      <form onSubmit={handleSubmit} className="grid gap-8">
        <fieldset disabled={sending} className="grid gap-8 border-0 p-0">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="rq-name" className="block text-sm font-medium text-ink">Your name</label>
              <input id="rq-name" className={`${inputClass} mt-2`} value={fields.name} onChange={set('name')} autoComplete="name" required />
            </div>
            <div>
              <label htmlFor="rq-business" className="block text-sm font-medium text-ink">
                Business or organization<Optional />
              </label>
              <input id="rq-business" className={`${inputClass} mt-2`} value={fields.business} onChange={set('business')} autoComplete="organization" />
            </div>
            <div>
              <label htmlFor="rq-email" className="block text-sm font-medium text-ink">Email</label>
              <input id="rq-email" type="email" className={`${inputClass} mt-2`} value={fields.email} onChange={set('email')} autoComplete="email" required />
            </div>
            <div>
              <label htmlFor="rq-phone" className="block text-sm font-medium text-ink">
                Phone<Optional />
              </label>
              <input id="rq-phone" type="tel" className={`${inputClass} mt-2`} value={fields.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
          </div>

          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium text-ink">
              Are you the one who decides?<Optional />
            </legend>
            <Choices name="decider" type="radio" choices={REQUEST_DECIDER} value={fields.decider} onChange={pick('decider')} />
            {someoneElse ? (
              <div className="mt-4">
                <label htmlFor="rq-decider-name" className="block text-sm font-medium text-ink">
                  Their name and role<Optional />
                </label>
                <input id="rq-decider-name" className={`${inputClass} mt-2`} value={fields.deciderName} onChange={set('deciderName')} placeholder="Pat Lee, owner" />
              </div>
            ) : null}
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium text-ink">
              What do you need? <span className="font-normal text-muted">Pick any that fit.</span>
            </legend>
            <Choices name="needs" type="checkbox" choices={REQUEST_NEEDS} value={fields.needs} onChange={toggleNeed} />
            {fields.needs.includes('Something else') ? (
              <input aria-label="What else do you need?" className={`${inputClass} mt-3`} value={fields.needsOther} onChange={set('needsOther')} placeholder="What else?" />
            ) : null}
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium text-ink">Your budget</legend>
            <Choices name="budget" type="radio" choices={REQUEST_BUDGETS} value={fields.budget} onChange={pick('budget')} />
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium text-ink">
              When would you like to start?<Optional />
            </legend>
            <Choices name="start" type="radio" choices={REQUEST_STARTS} value={fields.start} onChange={pick('start')} />
          </fieldset>

          <div>
            <label htmlFor="rq-website" className="block text-sm font-medium text-ink">
              Your current website or app<Optional />
            </label>
            <input id="rq-website" className={`${inputClass} mt-2`} value={fields.website} onChange={set('website')} placeholder="yourbusiness.com" inputMode="url" />
          </div>

          <div>
            <label htmlFor="rq-message" className="block text-sm font-medium text-ink">Tell me about it</label>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              What it should do, who will use it, and what made you start looking now.
            </p>
            <textarea id="rq-message" rows={6} className={`${inputClass} mt-2 resize-y`} value={fields.message} onChange={set('message')} required />
          </div>

          <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="rq-company">Company</label>
            <input id="rq-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </fieldset>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send my request'}
          </button>
          <span className="text-[13px] text-muted">I reply within a day.</span>
        </div>

        {status === 'idle' && error ? (
          <p className="text-sm font-semibold text-ink" role="alert">{error}</p>
        ) : null}

        {status === 'error' && (
          <div className="rounded-2xl border border-warm/40 bg-warm/[0.06] p-5" role="alert">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Nothing is lost. If it keeps failing, send it straight to me instead.
            </p>
            <a href={mailtoHref} className="btn-ghost mt-4">
              Send it by email instead
            </a>
          </div>
        )}

        <p className="text-[13px] leading-relaxed text-muted">
          Your details go straight to my inbox and are used only to reply to you. No account, no
          newsletter, and nothing passed to anyone else.
        </p>
      </form>
    </div>
  )
}
