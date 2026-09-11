'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Envelope, FieldPlacement, FieldType } from '@/lib/sign/types'

type Props = { initial: Envelope }

export default function EnvelopeEditor({ initial }: Props) {
  const [envelope, setEnvelope] = useState(initial)
  const [title, setTitle] = useState(initial.title)
  const [signers, setSigners] = useState<{ id?: string; name: string; email: string }[]>(
    initial.signers.map((s) => ({ id: s.id, name: s.name, email: s.email })),
  )
  const [fields, setFields] = useState<FieldPlacement[]>(initial.fields)
  const [page, setPage] = useState(1)
  const [activeSignerId, setActiveSignerId] = useState(signers[0]?.id || '')
  const [placeType, setPlaceType] = useState<FieldType>('signature')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pdfUrl = useMemo(
    () => `/api/sign/envelopes/${envelope.id}/pdf?which=original#page=${page}`,
    [envelope.id, page],
  )

  const pageFields = fields.filter((f) => f.page === page)

  function addSignerRow() {
    setSigners((prev) => [...prev, { name: '', email: '' }])
  }

  async function save(next?: {
    title?: string
    signers?: { id?: string; name: string; email: string }[]
    fields?: FieldPlacement[]
  }) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/sign/envelopes/${envelope.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: next?.title ?? title,
          signers: next?.signers ?? signers,
          fields: next?.fields ?? fields,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Save failed.')
        return null
      }
      setEnvelope(data.envelope)
      setSigners(data.envelope.signers.map((s: { id: string; name: string; email: string }) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      })))
      setFields(data.envelope.fields)
      if (!activeSignerId && data.envelope.signers[0]) {
        setActiveSignerId(data.envelope.signers[0].id)
      }
      setMessage('Saved.')
      return data.envelope as Envelope
    } catch {
      setError('Network error.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function send() {
    const saved = await save()
    if (!saved) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/sign/envelopes/${envelope.id}/send`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Send failed.')
        return
      }
      setEnvelope(data.envelope)
      setMessage('Magic links sent.')
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  function onPlace(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeSignerId || envelope.status === 'completed') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const width = placeType === 'signature' ? 0.32 : 0.18
    const height = placeType === 'signature' ? 0.07 : 0.035
    const field: FieldPlacement = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: placeType,
      signerId: activeSignerId,
      page,
      x: Math.min(Math.max(x - width / 2, 0), 1 - width),
      y: Math.min(Math.max(y - height / 2, 0), 1 - height),
      width,
      height,
    }
    setFields((prev) => [...prev, field])
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  const signerLabel = (id: string) => signers.find((s) => s.id === id)?.name || id.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/sign/dashboard" className="text-xs text-muted hover:text-ink">
            ← Documents
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{envelope.title}</h1>
          <p className="text-xs text-muted capitalize">Status: {envelope.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || envelope.status === 'completed'}
            onClick={() => save()}
            className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy || envelope.status === 'completed'}
            onClick={send}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Send magic links
          </button>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-warm">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="tile space-y-3 p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Title</span>
              <input
                value={title}
                disabled={envelope.status === 'completed'}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-ink outline-none focus:border-accent"
              />
            </label>
          </div>

          <div className="tile space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Signers</h2>
              <button
                type="button"
                disabled={envelope.status === 'completed'}
                onClick={addSignerRow}
                className="text-xs text-accent"
              >
                Add
              </button>
            </div>
            {signers.map((s, idx) => (
              <div key={s.id || `new-${idx}`} className="space-y-2 rounded-xl border border-line p-3">
                <input
                  placeholder="Name"
                  value={s.name}
                  disabled={envelope.status === 'completed'}
                  onChange={(e) => {
                    const next = [...signers]
                    next[idx] = { ...next[idx], name: e.target.value }
                    setSigners(next)
                  }}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={s.email}
                  disabled={envelope.status === 'completed'}
                  onChange={(e) => {
                    const next = [...signers]
                    next[idx] = { ...next[idx], email: e.target.value }
                    setSigners(next)
                  }}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                />
                {s.id ? (
                  <button
                    type="button"
                    className={`text-xs ${activeSignerId === s.id ? 'text-accent font-semibold' : 'text-muted'}`}
                    onClick={() => setActiveSignerId(s.id!)}
                  >
                    {activeSignerId === s.id ? 'Placing fields for this signer' : 'Place fields for this signer'}
                  </button>
                ) : (
                  <p className="text-xs text-muted">Save to enable field placement.</p>
                )}
              </div>
            ))}
          </div>

          <div className="tile space-y-3 p-4">
            <h2 className="text-sm font-semibold text-ink">Field placement</h2>
            <p className="text-xs text-body">
              Choose signature or date, then click the PDF preview to place. Drag is not supported in
              this MVP — click again to add another, or remove from the list below.
            </p>
            <div className="flex gap-2">
              {(['signature', 'date'] as FieldType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPlaceType(t)}
                  className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                    placeType === t ? 'bg-accent text-white' : 'border border-line text-body'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Page</span>
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="rounded-lg border border-line px-2 py-1"
              >
                {Array.from({ length: envelope.pageCount }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <ul className="space-y-1 text-xs">
              {fields.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <span>
                    p{f.page} · {f.type} · {signerLabel(f.signerId)}
                  </span>
                  {envelope.status !== 'completed' ? (
                    <button type="button" className="text-warm" onClick={() => removeField(f.id)}>
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {envelope.status === 'completed' && envelope.completedPdfKey ? (
            <a
              href={`/api/sign/envelopes/${envelope.id}/pdf?which=completed`}
              className="block rounded-full bg-emerald-700 px-4 py-2 text-center text-sm font-medium text-white"
              target="_blank"
              rel="noreferrer"
            >
              Download completed PDF
            </a>
          ) : null}

          <div className="tile p-4">
            <h2 className="text-sm font-semibold text-ink">Audit log</h2>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-muted">
              {envelope.audit.map((a, i) => (
                <li key={`${a.at}-${i}`}>
                  {new Date(a.at).toLocaleString()} — {a.action} — {a.actor}
                  {a.detail ? ` — ${a.detail}` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="tile overflow-hidden p-2">
          <div className="relative mx-auto aspect-[8.5/11] w-full max-w-3xl bg-surface-2">
            <iframe title="PDF preview" src={pdfUrl} className="absolute inset-0 h-full w-full" />
            <div
              className="absolute inset-0 cursor-crosshair"
              onClick={onPlace}
              role="presentation"
            >
              {pageFields.map((f) => (
                <div
                  key={f.id}
                  className={`absolute rounded border-2 ${
                    f.type === 'signature'
                      ? 'border-accent bg-accent/10'
                      : 'border-warm bg-warm/10'
                  }`}
                  style={{
                    left: `${f.x * 100}%`,
                    top: `${f.y * 100}%`,
                    width: `${f.width * 100}%`,
                    height: `${f.height * 100}%`,
                  }}
                >
                  <span className="block truncate px-1 text-[10px] font-medium text-ink">
                    {f.type} · {signerLabel(f.signerId)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
