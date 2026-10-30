'use client'

import { useState } from 'react'

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent'

export default function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/sign/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not create the account. Try again.')
        return
      }
      setSentTo(email.trim())
    } catch {
      setError('No connection. Check your internet and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="tile space-y-2 p-5">
        <h2 className="text-lg font-semibold text-ink">Check your email</h2>
        <p className="text-sm text-body">
          We sent a link to <strong>{sentTo}</strong>. Open it to confirm your email; it brings you
          straight back here to choose your plan.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="tile space-y-4 p-5">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Your name</span>
        <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Password (at least 10 characters)</span>
        <input
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-warm">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}
