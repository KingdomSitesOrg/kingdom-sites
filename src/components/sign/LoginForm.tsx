'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/sign/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not sign in.')
        return
      }
      router.replace('/sign/dashboard')
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="tile space-y-4 p-5">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      {error ? <p className="text-sm text-warm">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
