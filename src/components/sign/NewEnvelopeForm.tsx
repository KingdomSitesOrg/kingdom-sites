'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_BYTES = 12 * 1024 * 1024

export default function NewEnvelopeForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  // Empty, not "Client": the name is printed under the signature on the PDF.
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [providerName, setProviderName] = useState('')
  const [providerEmail, setProviderEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function onFilePicked(list: FileList | null) {
    const next = list?.[0] || null
    if (!next) {
      setFile(null)
      return
    }
    const looksPdf =
      next.type === 'application/pdf' ||
      next.type === 'application/x-pdf' ||
      /\.pdf$/i.test(next.name) ||
      // iOS sometimes reports empty type for Files app PDFs
      next.type === ''
    if (!looksPdf) {
      setError('Please choose a PDF file.')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (next.size > MAX_BYTES) {
      setError('That PDF is over 12 MB. Compress it or split it, then try again.')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setError('')
    setFile(next)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Choose a PDF.')
      return
    }
    if (!clientName.trim() || !providerName.trim()) {
      setError('Add the full name of each person signing. It is printed under their signature.')
      return
    }
    if (!clientEmail.trim() || !providerEmail.trim()) {
      setError('Add an email for each person signing.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.set('title', title || file.name.replace(/\.pdf$/i, ''))
      form.set('pdf', file)
      form.set('clientName', clientName.trim())
      form.set('clientEmail', clientEmail.trim())
      form.set('providerName', providerName.trim())
      form.set('providerEmail', providerEmail.trim())
      const res = await fetch('/api/sign/envelopes', { method: 'POST', body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Upload failed. Try again.')
        setBusy(false)
        return
      }
      router.replace(`/sign/envelopes/${data.envelope.id}`)
      router.refresh()
      // Keep "Uploading…" until the next screen opens.
      return
    } catch {
      setError('No connection. Check your internet and try again.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="tile space-y-4 p-5">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Title (optional)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={file ? file.name.replace(/\.pdf$/i, '') : 'e.g. Services agreement, Jane Doe'}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </label>

      <div className="block text-sm">
        <span className="mb-1 block text-muted">PDF</span>
        <div className="flex flex-wrap items-center gap-3">
          {/*
            iOS Safari: do NOT use display:none / sr-only / clip on file inputs.
            Overlay a real opacity-0 input on the button; keep accept loose so the picker opens.
          */}
          <div className="relative inline-flex">
            <span className="btn-primary pointer-events-none !min-h-11 !px-4 !py-2 !text-sm">
              {file ? 'Change PDF' : 'Attach PDF'}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf,image/*"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              style={{ fontSize: 16 }}
              onChange={(e) => onFilePicked(e.target.files)}
            />
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-body">
            {file ? file.name : 'No file selected'}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          PDF only, up to 12 MB. On an iPhone, choose Browse or Files if Photos opens first.
        </p>
      </div>

      <div className="rounded-xl border border-line p-3 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Client signs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Full name</span>
            <input
              required
              autoComplete="off"
              placeholder="Jane Doe"
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
              placeholder="client@example.com"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-line p-3 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Provider signs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Full name</span>
            <input
              required
              autoComplete="off"
              placeholder="Thomas Klein"
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
      <button type="submit" disabled={busy || !file} className="btn-primary w-full">
        {busy ? 'Uploading…' : 'Next: place signature lines'}
      </button>
    </form>
  )
}
