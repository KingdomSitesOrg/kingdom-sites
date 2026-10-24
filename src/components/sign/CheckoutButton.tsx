'use client'

import { useState } from 'react'
import type { SignPlanId } from '@/lib/billing'

export default function CheckoutButton({
  planId,
  label,
}: {
  planId: SignPlanId
  label: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function startCheckout() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/sign/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        url?: string
        error?: string
      } | null
      if (!res.ok || !data?.ok || !data.url) {
        setError(data?.error || 'Could not start checkout.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy}
        onClick={startCheckout}
        className="btn-primary w-full"
      >
        {busy ? 'Starting checkout…' : label}
      </button>
      {error ? <p className="mt-2 text-xs text-warm">{error}</p> : null}
    </div>
  )
}
