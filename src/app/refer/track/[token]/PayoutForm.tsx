'use client'

import { useEffect, useRef, useState } from 'react'
import { PAYOUT_METHODS, REFER_API, payoutLabel, type PayoutMethod } from '@/lib/referrals'

/**
 * How a referrer wants their gifts sent: PayPal, Venmo or Apple Cash, and
 * where. Saved through /api/refer with the tracker's own token; Thomas sends
 * each gift by hand. Shown filled in once chosen, with a way to change it.
 */

const SUBMIT_TIMEOUT_MS = 12_000
/** The route turns away anything sent faster than a person could; wait it out. */
const FASTEST_HUMAN_MS = 1600

type Saved = { method: PayoutMethod; handle: string } | null

export default function PayoutForm({ token, saved: initial }: { token: string; saved: Saved }) {
  const [saved, setSaved] = useState<Saved>(initial)
  const [editing, setEditing] = useState(!initial)
  const [method, setMethod] = useState<PayoutMethod | ''>(initial?.method ?? '')
  const [handle, setHandle] = useState(initial?.handle ?? '')
  const [company, setCompany] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const openedAt = useRef(0)

  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const picked = PAYOUT_METHODS.find((m) => m.value === method)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    if (!method) {
      setError('Please pick PayPal, Venmo or Apple Cash.')
      return
    }
    setSending(true)
    setError('')
    const wait = FASTEST_HUMAN_MS - (Date.now() - openedAt.current)
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    try {
      const response = await fetch(REFER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
        body: JSON.stringify({
          kind: 'payout',
          token,
          method,
          handle,
          company,
          elapsedMs: Date.now() - openedAt.current,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        handle?: string
        error?: string
      }
      if (!response.ok || !data.ok || !data.handle) {
        setError(data.error || 'That did not save just now. Please try again.')
      } else {
        setSaved({ method, handle: data.handle })
        setHandle(data.handle)
        setEditing(false)
      }
    } catch {
      setError('Could not reach the server. Your connection may have dropped.')
    } finally {
      setSending(false)
    }
  }

  if (saved && !editing) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <p className="text-ink [overflow-wrap:anywhere]">
          Your gifts go to {payoutLabel(saved.method)}:{' '}
          <span className="font-semibold">{saved.handle}</span>
        </p>
        <button type="button" className="btn-ghost-sm" onClick={() => setEditing(true)}>
          Change how you are paid
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="relative flex flex-col gap-5">
      <fieldset disabled={sending} className="grid gap-5 border-0 p-0">
        <legend className="sr-only">How you want to be paid</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PAYOUT_METHODS.map((m) => (
            <label
              key={m.value}
              htmlFor={`payout-${m.value}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line-strong px-4 py-3 font-medium text-ink hover:border-ink"
            >
              <input
                id={`payout-${m.value}`}
                type="radio"
                name="payout-method"
                value={m.value}
                checked={method === m.value}
                onChange={() => {
                  setMethod(m.value)
                  if (m.value !== saved?.method) setHandle('')
                  setError('')
                }}
                className="size-5 accent-[var(--color-accent)]"
              />
              {m.label}
            </label>
          ))}
        </div>
        {picked ? (
          <div>
            <label htmlFor="payout-handle" className="block text-sm font-medium text-ink">
              {picked.field}
            </label>
            <input
              id="payout-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete={picked.value === 'venmo' ? 'off' : 'email'}
              inputMode={picked.value === 'paypal' ? 'email' : 'text'}
              autoCapitalize="none"
              spellCheck={false}
              required
              className="mt-2 w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <p className="mt-2 text-sm text-muted">{picked.hint}</p>
          </div>
        ) : null}
        {/* For bots only: hidden from people and from screen readers. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label htmlFor="payout-company">Company</label>
          <input
            id="payout-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </fieldset>
      {error ? (
        <p className="text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={sending || !method}>
          {sending ? 'Saving…' : 'Save'}
        </button>
        {saved ? (
          <button
            type="button"
            className="btn-ghost"
            disabled={sending}
            onClick={() => {
              setMethod(saved.method)
              setHandle(saved.handle)
              setError('')
              setEditing(false)
            }}
          >
            Keep {payoutLabel(saved.method)}
          </button>
        ) : null}
      </div>
    </form>
  )
}
