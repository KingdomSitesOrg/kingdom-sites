'use client'

import { useState } from 'react'
import { CONTACT_EMAIL } from '@/lib/contact'
import { AUDIENCE_OTHER, AUDIENCE_TRADES, TIERS } from '@/lib/partnership'

/* The site has no database and no email service on purpose. So this form does
   not post anywhere: it writes the message for the visitor and hands it to
   whatever they send email with. Nothing they type ever leaves their device
   unless they send it themselves.

   A mail app failing to open is common enough on a work phone, so the finished
   message is always shown underneath to copy by hand. */

type Fields = {
  business: string
  name: string
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
  phone: 'Best number to reach you',
  trade: 'What you do',
  plan: 'Plan they have in mind',
  areas: 'Towns or areas you cover',
  website: 'Website you have now (if any)',
  notes: 'Anything else worth knowing',
}

function buildMessage(f: Fields) {
  const lines = (Object.keys(LABELS) as (keyof Fields)[])
    .filter((key) => f[key].trim() !== '')
    .map((key) => `${LABELS[key]}: ${f[key].trim()}`)

  return [
    'Hi Thomas,',
    '',
    'I would like the free look at how my business shows up online.',
    '',
    ...lines,
    '',
    'Thanks,',
    f.name.trim() || '',
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
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent'

export default function QuoteForm() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setFields((f) => ({ ...f, [key]: e.target.value }))

  const message = buildMessage(fields)
  const subject = fields.business.trim()
    ? `Free look — ${fields.business.trim()}`
    : 'Free look at my business online'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    window.location.href = href
    setSent(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${message}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="tile-elevated p-7 sm:p-10">
      <form onSubmit={handleSubmit} className="grid gap-6">
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

          <Field id="trade" label="What you do">
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
        </div>

        <Field
          id="plan"
          label="Plan you have in mind"
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
            placeholder="Springfield, Chatham, and about 30 miles around"
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

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button type="submit" className="btn-primary">
            Send it to Thomas
          </button>
          <button type="button" onClick={copy} className="link-accent text-sm">
            {copied ? 'Copied' : 'Copy the message instead'}
          </button>
        </div>

        <p className="text-[13px] leading-relaxed text-muted">
          {'This opens your own email app with the message written for you — nothing is stored on this site, and nothing is sent until you press send yourself.'}
        </p>
      </form>

      {sent && (
        <div className="mt-8 rounded-2xl bg-surface-2 p-6" role="status">
          <p className="text-sm font-semibold text-ink">{'Your email app should have opened.'}</p>
          <p className="mt-2 text-sm leading-relaxed text-body">
            {'If it did not, copy the message below and send it to '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-accent">
              {CONTACT_EMAIL}
            </a>
            {'. I read every one myself and reply within a day.'}
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-body">
            {message}
          </pre>
          <button type="button" onClick={copy} className="btn-ghost mt-4">
            {copied ? 'Copied' : 'Copy the message'}
          </button>
        </div>
      )}
    </div>
  )
}
