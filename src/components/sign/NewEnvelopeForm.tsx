'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEnvelopeForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('Client')
  const [clientEmail, setClientEmail] = useState('')
  const [providerName, setProviderName] = useState('Provider')
  const [providerEmail, setProviderEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a PDF.')
      return
    }
    if (!clientEmail.trim() || !providerEmail.trim()) {
      setError('Client and Provider both need an email.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.set('title', title || file.name.replace(/\.pdf$/i, ''))
      form.set('pdf', file)
      form.set('clientName', clientName.trim() || 'Client')
      form.set('clientEmail', clientEmail.trim())
      form.set('providerName', providerName.trim() || 'Provider')
      form.set('providerEmail', providerEmail.trim())
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

      <div className="rounded-xl border border-line p-3 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Signature: Client</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Name</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="jamwithlatin@gmail.com"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-line p-3 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Signature: Provider</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Name</span>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input
              type="email"
              required
              value={providerEmail}
              onChange={(e) => setProviderEmail(e.target.value)}
              placeholder="thomas@kingdom-sites.com"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-warm">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full"
      >
        {busy ? 'Uploading…' : 'Continue'}
      </button>
    </form>
  )
}
