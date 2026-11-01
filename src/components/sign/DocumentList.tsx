'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { EnvelopeSummary } from '@/lib/sign/types'

export default function DocumentList({ initial }: { initial: EnvelopeSummary[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

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
      <div className="tile space-y-3 p-6">
        <p className="text-sm text-body">
          No documents yet. Upload a PDF, click where each person signs, and send it.
        </p>
        <Link href="/sign/new" className="btn-primary !min-h-10 !px-4 !py-2 !text-sm">
          New document
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-warm">{error}</p> : null}
      {items.map((env) => (
        <div key={env.id} className="tile flex flex-wrap items-center gap-3 p-4">
          <Link href={`/sign/envelopes/${env.id}`} className="min-w-0 w-full sm:w-auto sm:flex-1">
            <div className="font-medium text-ink hover:underline">{env.title}</div>
            <div className="mt-1 text-sm text-body">{nextStep(env)}</div>
            <div className="mt-1 text-xs text-muted">
              {env.signedCount}/{env.signerCount} signed · {env.pageCount} page
              {env.pageCount === 1 ? '' : 's'} · updated{' '}
              {new Date(env.updatedAt).toLocaleString()}
            </div>
          </Link>
          <StatusPill status={env.status} />
          {env.hasSignedPdf ? (
            <a
              href={`/api/sign/envelopes/${env.id}/pdf?which=completed&download=1`}
              className="btn-ghost-sm"
            >
              Download signed PDF
            </a>
          ) : null}
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

/** What this document is waiting for, in a few words. */
function nextStep(env: EnvelopeSummary): string {
  if (env.status === 'completed') return 'Signed by everyone.'
  if (env.status === 'sent') {
    const names = env.waitingOn ?? []
    return names.length ? `Waiting for ${names.join(' and ')}.` : 'Making the signed PDF.'
  }
  if (env.missingLines > 0) return 'Draft: place the signature lines, then send.'
  return 'Draft: ready to send.'
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Out for signing',
  completed: 'Signed',
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-surface-2 text-body',
    sent: 'bg-blue-50 text-accent',
    completed: 'bg-emerald-50 text-emerald-800',
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || styles.draft}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  )
}
