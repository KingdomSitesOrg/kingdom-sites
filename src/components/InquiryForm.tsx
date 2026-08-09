'use client'

import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { CONTACT_EMAIL, INQUIRE_API, SALES_EMAIL } from '@/lib/contact'
import { TIERS } from '@/lib/partnership'

/**
 * Product enquiry form.
 *
 * Posts to /api/inquiry (Resend + optional webhook) — same delivery path as
 * the production free-look form. On failure, falls back to mailto so nothing
 * is silently lost.
 */

type Fields = {
  product: string
  name: string
  email: string
  phone: string
  role: string
  building: string
  tier: string
  ai: string
  url: string
  notes: string
}

const EMPTY: Fields = {
  product: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  building: '',
  tier: '',
  ai: '',
  url: '',
  notes: '',
}

const LABELS: Record<keyof Fields, string> = {
  product: 'Product or company name',
  name: 'Your name',
  email: 'Email',
  phone: 'Best number to reach you',
  role: 'Your role',
  building: 'What you are building',
  tier: 'Band you have in mind',
  ai: 'AI package interest',
  url: 'Current product or site (if any)',
  notes: 'Anything else worth knowing',
}

const ROLES = [
  'Product owner',
  'Business founder',
  'Operator / owner',
  'Engineering lead',
  'Something else',
]

function buildMessage(f: Fields) {
  const lines = (Object.keys(LABELS) as (keyof Fields)[])
    .filter((key) => f[key].trim() !== '')
    .map((key) => `${LABELS[key]}: ${f[key].trim()}`)

  return [
    'Hi Thomas,',
    '',
    'I would like to talk about retainers to design, build, ship, and maintain my product.',
    '',
    ...lines,
    '',
    'Thanks,',
    f.name.trim(),
  ]
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setFields((f) => ({ ...f, [key]: e.target.value }))

  /* Fallback opens the visitor's mail app to sales (+ engineering on the To line when supported). */
  const mailtoHref = `mailto:${SALES_EMAIL},${CONTACT_EMAIL}?subject=${encodeURIComponent(
    fields.product.trim()
      ? `Design, build, ship, and maintain — ${fields.product.trim()}`
      : 'Design, build, ship, and maintain enquiry',
  )}&body=${encodeURIComponent(buildMessage(fields))}`

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

      trackEvent('inquiry_submit', {
        tier: fields.tier || 'not_sure',
        ai: fields.ai || 'not_sure',
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
          {'Your enquiry is in my inbox. I read every one myself and reply within a day — usually sooner — about '}
          <span className="font-medium text-ink">{fields.product.trim() || 'your product'}</span>
          {' and whether working with me is a fit.'}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          {'Nothing to do in the meantime. Sales is '}
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
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id="product" label={LABELS.product}>
              <input
                id="product"
                className={inputClass}
                value={fields.product}
                onChange={set('product')}
                placeholder="Acme Field App"
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
                placeholder="Alex Rivera"
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
                placeholder="alex@acme.com"
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

          <Field id="role" label={LABELS.role}>
            <select id="role" className={inputClass} value={fields.role} onChange={set('role')} required>
              <option value="">Choose one…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="building"
            label={LABELS.building}
            hint="Who uses it, what problem it solves, and how far along you are."
          >
            <textarea
              id="building"
              rows={4}
              className={`${inputClass} resize-y`}
              value={fields.building}
              onChange={set('building')}
              placeholder="A mobile app for our crews plus a light office console. We have a prototype; we need someone who owns shipping and the feature list."
              required
            />
          </Field>

          <Field
            id="tier"
            label={LABELS.tier}
            hint="Only if you already know — otherwise leave it and I will recommend a band after we talk."
          >
            <select id="tier" className={inputClass} value={fields.tier} onChange={set('tier')}>
              <option value="">Not sure yet — tell me what fits</option>
              {TIERS.map((t) => (
                <option key={t.id} value={`${t.name} (~$${t.priceAround.toLocaleString()}/month)`}>
                  {`${t.name} — ~$${t.priceAround.toLocaleString()}/month · ${t.tagline}`}
                </option>
              ))}
            </select>
          </Field>

          <Field id="ai" label={LABELS.ai}>
            <select id="ai" className={inputClass} value={fields.ai} onChange={set('ai')}>
              <option value="">Not sure yet</option>
              <option value="Yes — interested in the AI package">Yes — interested in the AI package</option>
              <option value="Maybe later">Maybe later</option>
              <option value="No">No</option>
            </select>
          </Field>

          <Field id="url" label={LABELS.url} hint="App Store link, staging site, or leave blank.">
            <input
              id="url"
              className={inputClass}
              value={fields.url}
              onChange={set('url')}
              placeholder="https://…"
            />
          </Field>

          <Field id="notes" label={LABELS.notes}>
            <textarea
              id="notes"
              rows={3}
              className={`${inputClass} resize-y`}
              value={fields.notes}
              onChange={set('notes')}
              placeholder="Timeline, team around you, what success looks like in six months."
            />
          </Field>

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
            {sending ? 'Sending…' : 'Send enquiry'}
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
