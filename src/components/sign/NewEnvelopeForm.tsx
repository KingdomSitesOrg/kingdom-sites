'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEnvelopeForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a PDF.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.set('title', title || file.name.replace(/\.pdf$/i, ''))
      form.set('pdf', file)
      if (signerName && signerEmail) {
        form.set('signerName', signerName)
        form.set('signerEmail', signerEmail)
      }
      const res = await fetch('/api/sign/envelopes', { method: 'POST', body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Upload failed.')
        return
      }
      router.replace(`/sign/envelopes/${data.envelope.id}`)
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
        <span className="mb-1 block text-muted">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="MSA — Jam with Latin"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">PDF</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          required
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">First signer name</span>
          <input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">First signer email</span>
          <input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-warm">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? 'Uploading…' : 'Continue'}
      </button>
    </form>
  )
}
