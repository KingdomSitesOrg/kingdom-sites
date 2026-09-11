'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { EnvelopeSummary } from '@/lib/sign/types'

export default function DocumentList({ initial }: { initial: EnvelopeSummary[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch('/api/sign/envelopes', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (cancelled || !res.ok || !data?.ok || !Array.isArray(data.envelopes)) return
        setItems(data.envelopes as EnvelopeSummary[])
      } catch {
        /* ignore */
      }
    }
    const id = window.setInterval(tick, 5000)
    const onFocus = () => void tick()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return
    setBusyId(id)
    setError('')
    try {
      const res = await fetch(`/api/sign/envelopes/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not delete.')
        return
      }
      setItems((prev) => prev.filter((e) => e.id !== id))
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setBusyId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="tile p-6 text-sm text-body">
        No documents yet. Upload a PDF to create your first signing request.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-warm">{error}</p> : null}
      {items.map((env) => (
        <div key={env.id} className="tile flex flex-wrap items-center gap-3 p-4">
          <Link href={`/sign/envelopes/${env.id}`} className="min-w-0 flex-1">
            <div className="font-medium text-ink hover:underline">{env.title}</div>
            <div className="mt-1 text-xs text-muted">
              {env.signedCount}/{env.signerCount} signed · {env.pageCount} page
              {env.pageCount === 1 ? '' : 's'} · updated{' '}
              {new Date(env.updatedAt).toLocaleString()}
            </div>
          </Link>
          <StatusPill status={env.status} />
          <button
            type="button"
            disabled={busyId === env.id}
            onClick={() => remove(env.id, env.title)}
            className="btn-danger-sm"
          >
            {busyId === env.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-surface-2 text-body',
    sent: 'bg-blue-50 text-accent',
    completed: 'bg-emerald-50 text-emerald-800',
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] || styles.draft
      }`}
    >
      {status}
    </span>
  )
}
