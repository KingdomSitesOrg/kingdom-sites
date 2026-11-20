'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BUSINESS_FEEDBACK_MAX_LENGTH, BUSINESS_FEEDBACK_QUESTIONS } from '@/lib/business-feedback'
import { FEEDBACK_API, FEEDBACK_MIN_ELAPSED_MS } from '@/lib/feedback'

const questions = Object.entries(BUSINESS_FEEDBACK_QUESTIONS)

export default function BusinessFeedbackForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = performance.now()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const fields = Object.fromEntries(new FormData(event.currentTarget))
    if (!questions.some(([name]) => String(fields[name] ?? '').trim())) {
      setError('Please answer at least one question.')
      return
    }

    setStatus('sending')
    setError('')

    try {
      const wait = FEEDBACK_MIN_ELAPSED_MS - (performance.now() - openedAt.current)
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, Math.ceil(wait)))

      const response = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          ...fields,
          kind: 'business',
          elapsedMs: performance.now() - openedAt.current,
        }),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        setError(result?.error || 'Could not send your feedback. Please try again.')
        setStatus('idle')
        return
      }

      setStatus('sent')
    } catch {
      setError('Could not send your feedback. Please try again.')
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return <p className="tile-elevated p-5 text-ink sm:p-8" role="status">Thank you for your feedback.</p>
  }

  const sending = status === 'sending'

  return (
    <form className="tile-elevated grid gap-5 p-5 sm:p-8" onSubmit={submit}>
      <fieldset className="grid min-w-0 gap-5" disabled={sending}>
        {questions.map(([name, question]) => (
          <div key={name}>
            <label className="block text-sm font-medium text-ink" htmlFor={name}>{question}</label>
            <textarea
              className="mt-2 block w-full resize-y rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-ink outline-none transition-colors focus:border-accent disabled:opacity-60"
              id={name}
              name={name}
              rows={3}
              maxLength={BUSINESS_FEEDBACK_MAX_LENGTH}
            />
          </div>
        ))}
        <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="business-feedback-company">Company</label>
          <input id="business-feedback-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
      </fieldset>
      <div>
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-warm" role="alert">{error}</p>}
    </form>
  )
}
