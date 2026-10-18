'use client'

import { useEffect, useRef, useState } from 'react'
import { CONTACT_EMAIL } from '@/lib/contact'
import {
  FEEDBACK_API,
  RATING_MAX,
  RATING_MIN,
  RATING_QUESTIONS,
  roundRating,
  type RatingId,
} from '@/lib/feedback'

/**
 * "How well did I do?" — five 1-10 sliders, what went well, what could be
 * better, an optional reference, and whether it may be shared.
 * Posts to /api/feedback. On failure, falls back to mailto.
 */

type Fields = {
  name: string
  project: string
  didWell: string
  doBetter: string
  reference: string
}

const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60'

type Status = 'idle' | 'sending' | 'sent' | 'invalid' | 'error'

const SUBMIT_TIMEOUT_MS = 15_000

/** Where an untouched slider's thumb rests. It counts as a rating only once moved. */
const RATING_REST = (RATING_MIN + RATING_MAX) / 2

const EMPTY: Fields = {
  name: '',
  project: '',
  didWell: '',
  doBetter: '',
  reference: '',
}

export default function FeedbackForm() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [ratings, setRatings] = useState<Partial<Record<RatingId, number>>>({})
  const [shareable, setShareable] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [company, setCompany] = useState('')
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const setRating = (id: RatingId, value: number) =>
    setRatings((prev) => ({ ...prev, [id]: roundRating(value) }))

  const set = (key: keyof Fields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setFields((f) => ({ ...f, [key]: e.target.value }))

  const mailtoBody = [
    ...RATING_QUESTIONS.map((q) => `${q.label}: ${ratings[q.id] ?? '-'}/10`),
    '',
    `What you did well:\n${fields.didWell.trim() || '-'}`,
    '',
    `What you could do better:\n${fields.doBetter.trim() || '-'}`,
    '',
    `Recommendation:\n${fields.reference.trim() || '-'}`,
    '',
    shareable ? 'You may share this feedback.' : 'Please keep this private.',
  ].join('\n')
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Feedback${fields.name.trim() ? ` from ${fields.name.trim()}` : ''}`,
  )}&body=${encodeURIComponent(mailtoBody)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return

    const saidSomething =
      Object.keys(ratings).length > 0 ||
      [fields.didWell, fields.doBetter, fields.reference].some((t) => t.trim())
    if (!saidSomething) {
      setError('Rate or write something first.')
      setStatus('invalid')
      return
    }

    setStatus('sending')
    setError('')

    try {
      const response = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
        body: JSON.stringify({
          ...fields,
          ratings,
          shareable,
          company,
          elapsedMs: Date.now() - openedAt.current,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }

      if (!response.ok || !data.ok) {
        setError(data.error || 'Something went wrong sending that.')
        setStatus(response.status === 400 ? 'invalid' : 'error')
        return
      }

      setStatus('sent')
    } catch (error) {
      const timedOut =
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
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
      <div className="tile-elevated flex items-center gap-4 p-7 sm:p-10" role="status">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/12">
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
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Thank you.</h2>
      </div>
    )
  }

  const sending = status === 'sending'

  return (
    <div className="tile-elevated p-7 sm:p-10">
      <form onSubmit={handleSubmit} className="grid gap-10">
        <fieldset disabled={sending} className="grid gap-10 border-0 p-0">
          <div className="grid gap-7">
            {RATING_QUESTIONS.map((q) => {
              const value = ratings[q.id]
              const shown = value ?? RATING_REST
              const fill = ((shown - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100
              return (
                <div key={q.id}>
                  <div className="flex h-7 items-center justify-between gap-4">
                    <label htmlFor={`rating-${q.id}`} className="block text-sm font-medium text-ink">
                      {q.label}
                    </label>
                    {value === undefined ? null : (
                      <span className="text-lg font-semibold leading-7 tabular-nums text-accent">
                        {value.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <input
                    id={`rating-${q.id}`}
                    type="range"
                    min={RATING_MIN}
                    max={RATING_MAX}
                    step="any"
                    value={shown}
                    onChange={(e) => setRating(q.id, Number(e.target.value))}
                    aria-valuetext={value === undefined ? 'Not rated' : `${value.toFixed(1)} out of 10`}
                    data-unset={value === undefined ? '' : undefined}
                    style={{ '--fill': value === undefined ? '0%' : `${fill}%` } as React.CSSProperties}
                    className="rating-slider mt-2"
                  />
                  <div className="mt-1 flex justify-between text-[12px] text-muted" aria-hidden="true">
                    <span>{RATING_MIN}</span>
                    <span>{RATING_MAX}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 border-t border-line pt-10">
            <div>
              <label htmlFor="didWell" className="block text-sm font-medium text-ink">
                What did I do well?
              </label>
              <textarea
                id="didWell"
                rows={4}
                className={`${inputClass} mt-2 resize-y`}
                value={fields.didWell}
                onChange={set('didWell')}
              />
            </div>
            <div>
              <label htmlFor="doBetter" className="block text-sm font-medium text-ink">
                What could I do better?
              </label>
              <p id="doBetter-hint" className="mt-1 text-[13px] leading-relaxed text-muted">
                Please, be honest. This is the most valuable part. This is what I need to hear to grow.
              </p>
              <textarea
                id="doBetter"
                rows={4}
                className={`${inputClass} mt-2 resize-y`}
                value={fields.doBetter}
                onChange={set('doBetter')}
                aria-describedby="doBetter-hint"
              />
            </div>
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-ink">
                Would you recommend me? Why?
              </label>
              <textarea
                id="reference"
                rows={3}
                className={`${inputClass} mt-2 resize-y`}
                value={fields.reference}
                onChange={set('reference')}
              />
            </div>
          </div>

          <div className="grid gap-6 border-t border-line pt-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ink">
                  Name
                </label>
                <input
                  id="name"
                  className={`${inputClass} mt-2`}
                  value={fields.name}
                  onChange={set('name')}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-ink">
                  Project
                </label>
                <input
                  id="project"
                  className={`${inputClass} mt-2`}
                  value={fields.project}
                  onChange={set('project')}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={shareable}
                onChange={(e) => setShareable(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-accent"
              />
              OK for me to share this
            </label>
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

        <div>
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>

        {status === 'invalid' && (
          <p className="text-sm font-semibold text-warm" role="alert">
            {error}
          </p>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-warm/40 bg-warm/[0.06] p-5" role="alert">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <a href={mailtoHref} className="btn-ghost mt-4">
              Email it instead
            </a>
          </div>
        )}
      </form>
    </div>
  )
}
