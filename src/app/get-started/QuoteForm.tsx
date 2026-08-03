'use client'

import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { CONTACT_EMAIL } from '@/lib/contact'
import { AUDIENCE_OTHER, AUDIENCE_TRADES, TIERS } from '@/lib/partnership'

/* A real intake: this posts to /api/free-look, which emails the enquiry
   straight to Thomas. Nothing is stored in a database — there isn't one — and
   the visitor never has to open their own email app.

   If delivery fails (a missing key on the server, a provider outage), the form
   says so plainly and offers the same message as a mailto, so an enquiry is
   never quietly lost. */

type Fields = {
  business: string
  name: string
  email: string
  phone: string
  trade: string
  plan: string
  areas: string
  website: string
  notes: string
}

const EMPTY: Fields = {
  business: '',
  name: '',
  email: '',
  phone: '',
  trade: '',
  plan: '',
  areas: '',
  website: '',
  notes: '',
}

const LABELS: Record<keyof Fields, string> = {
  business: 'Business name',
  name: 'Your name',
  email: 'Email',
  phone: 'Best number to reach you',
  trade: 'What you do',
  plan: 'Plan you have in mind',
  areas: 'Towns or areas you cover',
  website: 'Website you have now (if any)',
  notes: 'Anything else worth knowing',
}

/** Only used if the send fails and the visitor has to fall back to email. */
function buildMessage(f: Fields) {
  const lines = (Object.keys(LABELS) as (keyof Fields)[])
    .filter((key) => f[key].trim() !== '')
    .map((key) => `${LABELS[key]}: ${f[key].trim()}`)

  return ['Hi Thomas,', '', 'I would like the free look at how my business shows up online.', '', ...lines, '', 'Thanks,', f.name.trim()]
    .join('\n')
    .trim()
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && <p className="mt-1 text-[13px] leading-relaxed text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function QuoteForm() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  /* A field no visitor can see. Robots fill everything in, so anything here
     means the submission is not a person. */
  const [company, setCompany] = useState('')
  /* Set once the form is on screen, not while rendering — the gap between this
     and the submit is what tells a person apart from a script. */
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setFields((f) => ({ ...f, [key]: e.target.value }))

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    fields.business.trim() ? `Free look — ${fields.business.trim()}` : 'Free look at my business online',
  )}&body=${encodeURIComponent(buildMessage(fields))}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setError('')

    try {
      const response = await fetch('/api/free-look', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, company, elapsedMs: Date.now() - openedAt.current }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }

      if (!response.ok || !data.ok) {
        setError(data.error || 'Something went wrong sending that.')
        setStatus('error')
        trackEvent('free_look_error', { status: response.status })
        return
      }

      trackEvent('free_look_submit', {
        trade: fields.trade || 'unknown',
        plan: fields.plan || 'not_sure',
      })
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
          {'Your enquiry is in my inbox. I do the digging myself and come back within a day — usually sooner — with an honest read on how '}
          <span className="font-medium text-ink">{fields.business.trim() || 'your business'}</span>
          {' shows up against the businesses winning those jobs today.'}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          {'Nothing to do in the meantime. If something urgent comes up, email me at '}
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
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id="business" label={LABELS.business}>
              <input
                id="business"
                className={inputClass}
                value={fields.business}
                onChange={set('business')}
                placeholder="Miller Pressure Washing"
                autoComplete="organization"
                required
              />
            </Field>

            <Field id="name" label={LABELS.name}>
              <input
                id="name"
                className={inputClass}
                value={fields.name}
                onChange={set('name')}
                placeholder="Dave Miller"
                autoComplete="name"
                required
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field id="email" label={LABELS.email}>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={fields.email}
                onChange={set('email')}
                placeholder="dave@millerpressurewashing.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field id="phone" label={LABELS.phone}>
              <input
                id="phone"
                type="tel"
                className={inputClass}
                value={fields.phone}
                onChange={set('phone')}
                placeholder="(555) 123 4567"
                autoComplete="tel"
              />
            </Field>
          </div>

          <Field id="trade" label={LABELS.trade}>
            <select id="trade" className={inputClass} value={fields.trade} onChange={set('trade')} required>
              <option value="">Choose one…</option>
              <optgroup label="Trades">
                {AUDIENCE_TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other local businesses">
                {AUDIENCE_OTHER.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
              <option value="Something else">Something else</option>
            </select>
          </Field>

          <Field
            id="plan"
            label={LABELS.plan}
            hint="Only if you already know — otherwise leave it and I will recommend one."
          >
            <select id="plan" className={inputClass} value={fields.plan} onChange={set('plan')}>
              <option value="">Not sure yet — tell me what fits</option>
              {TIERS.map((t) => (
                <option key={t.id} value={`${t.name} ($${t.price}/month)`}>
                  {`${t.name} — $${t.price}/month`}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="areas"
            label={LABELS.areas}
            hint="The towns matter more than anything else here — it is what people type when they search."
          >
            <input
              id="areas"
              className={inputClass}
              value={fields.areas}
              onChange={set('areas')}
              placeholder="Rochester, Byron, Stewartville, and about 30 miles around"
            />
          </Field>

          <Field id="website" label={LABELS.website} hint="Leave it blank if you do not have one. That is completely fine.">
            <input
              id="website"
              className={inputClass}
              value={fields.website}
              onChange={set('website')}
              placeholder="millerpressurewashing.com"
            />
          </Field>

          <Field id="notes" label={LABELS.notes}>
            <textarea
              id="notes"
              rows={4}
              className={`${inputClass} resize-y`}
              value={fields.notes}
              onChange={set('notes')}
              placeholder="Where your jobs come from now, what you wish you had more of, anything you have tried before."
            />
          </Field>

          {/* The honeypot. Off screen, skipped by tab, and ignored by password
              managers — only a robot ever finds it. */}
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
            {sending ? 'Sending…' : 'Send it to Thomas'}
          </button>
          <span className="text-[13px] text-muted">Takes a day or less to hear back.</span>
        </div>

        {status === 'error' && (
          <div className="rounded-2xl border border-warm/40 bg-warm/[0.06] p-5" role="alert">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {'Nothing is lost — send it straight to me instead and I will pick it up the same way.'}
            </p>
            <a href={mailtoHref} className="btn-ghost mt-4">
              Send it by email instead
            </a>
          </div>
        )}

        <p className="text-[13px] leading-relaxed text-muted">
          {'Your details go straight to my inbox and are used only to reply to you. No account, no newsletter, and nothing passed to anyone else.'}
        </p>
      </form>
    </div>
  )
}
