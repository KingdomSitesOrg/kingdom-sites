'use client'

import { useEffect, useRef, useState } from 'react'
import { CONTACT_EMAIL } from '@/lib/contact'
import {
  FEEDBACK_API,
  RATING_QUESTIONS,
  RATING_SCALE,
  type RatingId,
} from '@/lib/feedback'

/**
 * "How well did Thomas do?" — five ratings, what went well, what could be
 * better, an optional reference, and whether it may be shared.
 * Posts to /api/feedback. On failure, falls back to mailto.
 */

type Fields = {
  name: string
  project: string
  didWell: string
  doBetter: string
  reference: string
  referenceName: string
}

const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60'

type Status = 'idle' | 'sending' | 'sent' | 'invalid' | 'error'

const SUBMIT_TIMEOUT_MS = 15_000

export default function FeedbackForm({
  defaultName = '',
  defaultProject = '',
}: {
  defaultName?: string
  defaultProject?: string
}) {
  const [fields, setFields] = useState<Fields>({
    name: defaultName,
    project: defaultProject,
    didWell: '',
    doBetter: '',
    reference: '',
    referenceName: '',
  })
  const [ratings, setRatings] = useState<Partial<Record<RatingId, number>>>({})
  const [shareable, setShareable] = useState(false)
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

  const mailtoBody = [
    ...RATING_QUESTIONS.map((q) => `${q.label}: ${ratings[q.id] ?? '-'}/5`),
    '',
    `What you did well:\n${fields.didWell.trim() || '-'}`,
    '',
    `What you could do better:\n${fields.doBetter.trim() || '-'}`,
    '',
    `Reference:\n${fields.reference.trim() || '-'}`,
    '',
    shareable ? 'You may share this feedback.' : 'Please keep this private.',
  ].join('\n')
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Feedback${fields.name.trim() ? ` from ${fields.name.trim()}` : ''}`,
  )}&body=${encodeURIComponent(mailtoBody)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return

    if (RATING_QUESTIONS.some((q) => !ratings[q.id])) {
      setError('Please give a rating for every question.')
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
          {'Thank you, ' + (fields.name.trim().split(' ')[0] || 'truly') + '.'}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          Your feedback is with me. I read every word of it, and I will put it to work on the next
          project.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          {shareable
            ? 'You said I may share it with others, so it may help someone decide to work with me.'
            : 'You asked me to keep it private, so it stays with me.'}
        </p>
      </div>
    )
  }

  const sending = status === 'sending'

  return (
    <div className="tile-elevated p-7 sm:p-10">
      <form onSubmit={handleSubmit} className="grid gap-10">
        <fieldset disabled={sending} className="grid gap-10 border-0 p-0">
          <div className="grid gap-7">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Rate the work</h2>
            {RATING_QUESTIONS.map((q) => (
              <fieldset key={q.id} className="border-0 p-0">
                <legend className="block text-sm font-medium text-ink">{q.label}</legend>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{q.hint}</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {RATING_SCALE.map((r) => (
                    <label
                      key={r.value}
                      className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-surface text-[15px] font-semibold text-ink transition-colors hover:bg-surface-2 has-checked:border-accent has-checked:bg-accent has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-accent/40"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={r.value}
                        checked={ratings[q.id] === r.value}
                        onChange={() => setRatings((prev) => ({ ...prev, [q.id]: r.value }))}
                        className="sr-only"
                        aria-label={`${r.value}, ${r.label}`}
                        required
                      />
                      {r.value}
                    </label>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[12px] text-muted" aria-hidden="true">
                  <span>{RATING_SCALE[0].label}</span>
                  <span>{RATING_SCALE[RATING_SCALE.length - 1].label}</span>
                </div>
              </fieldset>
            ))}
          </div>

          <div className="grid gap-6 border-t border-line pt-10">
            <h2 className="text-lg font-semibold tracking-tight text-ink">In your own words</h2>
            <div>
              <label htmlFor="didWell" className="block text-sm font-medium text-ink">
                What did I do well?
              </label>
              <textarea
                id="didWell"
                rows={5}
                className={`${inputClass} mt-2 resize-y`}
                value={fields.didWell}
                onChange={set('didWell')}
                placeholder="What you would want me to keep doing…"
              />
            </div>
            <div>
              <label htmlFor="doBetter" className="block text-sm font-medium text-ink">
                What could I do better?
              </label>
              <textarea
                id="doBetter"
                rows={5}
                className={`${inputClass} mt-2 resize-y`}
                value={fields.doBetter}
                onChange={set('doBetter')}
                placeholder="Anything that frustrated you, slowed you down, or could have gone differently…"
              />
            </div>
          </div>

          <div className="grid gap-6 border-t border-line pt-10">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                A reference
                <span className="ml-2 text-sm font-normal text-muted">(optional)</span>
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                If you would recommend me, a few sentences for someone deciding whether to work
                with me.
              </p>
            </div>
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-ink">
                Why should someone work with Thomas?
              </label>
              <textarea
                id="reference"
                rows={4}
                className={`${inputClass} mt-2 resize-y`}
                value={fields.reference}
                onChange={set('reference')}
                placeholder="Thomas built our app from scratch and…"
              />
            </div>
            {fields.reference.trim() ? (
              <div>
                <label htmlFor="referenceName" className="block text-sm font-medium text-ink">
                  Name it should appear under
                </label>
                <input
                  id="referenceName"
                  className={`${inputClass} mt-2`}
                  value={fields.referenceName}
                  onChange={set('referenceName')}
                  placeholder="Alex Rivera, founder of Rivera Coffee"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 border-t border-line pt-10">
            <h2 className="text-lg font-semibold tracking-tight text-ink">About you</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink">
                Your name
                <span className="ml-1 font-normal text-muted">(optional)</span>
              </label>
              <input
                id="name"
                className={`${inputClass} mt-2`}
                value={fields.name}
                onChange={set('name')}
                placeholder="Leave blank to stay anonymous"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-ink">
                The project
                <span className="ml-1 font-normal text-muted">(optional)</span>
              </label>
              <input
                id="project"
                className={`${inputClass} mt-2`}
                value={fields.project}
                onChange={set('project')}
                placeholder="What we worked on together"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-strong bg-surface p-5 transition-colors hover:bg-surface-2 has-checked:border-accent">
              <input
                type="checkbox"
                checked={shareable}
                onChange={(e) => setShareable(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
              />
              <span>
                <span className="block text-[15px] font-medium text-ink">
                  Thomas may share this feedback with others
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted">
                  {shareable
                    ? 'He may show what you wrote to people thinking of working with him.'
                    : 'Left unticked, it stays private and only Thomas reads it.'}
                </span>
              </span>
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

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send feedback'}
          </button>
          <span className="text-[13px] text-muted">Goes straight to Thomas.</span>
        </div>

        {status === 'invalid' && (
          <p className="text-sm font-semibold text-warm" role="alert">
            {error}
          </p>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-warm/40 bg-warm/[0.06] p-5" role="alert">
            <p className="text-sm font-semibold text-ink">{error}</p>
            <p className="mt-2 text-sm leading-relaxed text-body">
              If it keeps failing, nothing is lost: send it to me by email instead.
            </p>
            <a href={mailtoHref} className="btn-ghost mt-4">
              Send it by email instead
            </a>
          </div>
        )}
      </form>
    </div>
  )
}
