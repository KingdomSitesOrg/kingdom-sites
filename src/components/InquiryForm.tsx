'use client'

import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { CONTACT_EMAIL, INQUIRE_API, SALES_EMAIL } from '@/lib/contact'

/**
 * Enquiry form — name, email, optional message.
 * Posts to /api/inquiry. On failure, falls back to mailto.
 */

type Fields = {
  name: string
  email: string
  message: string
}

const EMPTY: Fields = {
  name: '',
  email: '',
  message: '',
}

const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function InquiryForm() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [company, setCompany] = useState('')
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setFields((f) => ({ ...f, [key]: e.target.value }))

  const mailtoHref = `mailto:${SALES_EMAIL},${CONTACT_EMAIL}?subject=${encodeURIComponent(
    fields.name.trim() ? `Enquiry from ${fields.name.trim()}` : 'Kingdom Sites enquiry',
  )}&body=${encodeURIComponent(fields.message.trim() || '(no message)')}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setError('')

    try {
      const response = await fetch(INQUIRE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          company,
          elapsedMs: Date.now() - openedAt.current,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }

      if (!response.ok || !data.ok) {
        setError(data.error || 'Something went wrong sending that.')
        setStatus('error')
        trackEvent('inquiry_error', { status: response.status })
        return
      }

      trackEvent('inquiry_submit', { has_message: fields.message.trim() ? 'yes' : 'no' })
      setStatus('sent')
    } catch {
      setError('Could not reach the server. Your connection may have dropped.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="tile-elevated p-7 sm:p-10" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/12">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12.5 10 17.5 19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            />
          </svg>
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          {'Got it, ' + (fields.name.trim().split(' ')[0] || 'thanks') + '.'}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          Your note is in my inbox. I read every one and reply within a day — usually sooner — about
          whether working together is a fit.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          {'Sales is '}
          <a href={`mailto:${SALES_EMAIL}`} className="link-accent">
            {SALES_EMAIL}
          </a>
          {'; engineering is '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    )
  }

  const sending = status === 'sending'

  return (
    <div className="tile-elevated p-7 sm:p-10">
      <form onSubmit={handleSubmit} className="grid gap-6">
        <fieldset disabled={sending} className="grid gap-6 border-0 p-0">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Your name
            </label>
            <input
              id="name"
              className={`${inputClass} mt-2`}
              value={fields.name}
              onChange={set('name')}
              placeholder="Alex Rivera"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`${inputClass} mt-2`}
              value={fields.email}
              onChange={set('email')}
              placeholder="alex@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-ink">
              Message
              <span className="ml-1 font-normal text-muted">(optional)</span>
            </label>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              An idea, a tool, something you want to work through — whatever you have.
            </p>
            <textarea
              id="message"
              rows={6}
              className={`${inputClass} mt-2 resize-y`}
              value={fields.message}
              onChange={set('message')}
              placeholder="I have an idea for an app…"
            />
          </div>

          <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </fieldset>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
          <span className="text-[13px] text-muted">I reply within a day.</span>
        </div>

        {status === 'error' && (
          <div className="rounded-2xl border border-warm/40 bg-warm/[0.06] p-5" role="alert">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Nothing is lost — send it straight to me instead and I will pick it up the same way.
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
