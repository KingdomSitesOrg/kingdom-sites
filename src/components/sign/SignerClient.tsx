'use client'

import { useEffect, useMemo, useState } from 'react'
import SignaturePad from './SignaturePad'

type View = {
  envelopeId: string
  title: string
  status: string
  pageCount: number
  signer: {
    id: string
    name: string
    email: string
    status: string
    signedAt?: string
  }
  fields: {
    id: string
    type: 'signature' | 'date'
    page: number
    x: number
    y: number
    width: number
    height: number
  }[]
  allSigned: boolean
}

export default function SignerClient({ token }: { token: string }) {
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState('')
  const [signaturePng, setSignaturePng] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/sign/s/${token}`)
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
          if (!cancelled) setError(data?.error || 'This signing link is not valid.')
          return
        }
        if (!cancelled) {
          setView(data.view)
          setTypedName(data.view.signer.name || '')
          if (data.view.signer.status === 'signed') setDone(true)
        }
      } catch {
        if (!cancelled) setError('Could not load this document.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const pdfUrl = useMemo(() => {
    if (!view) return ''
    return `/api/sign/envelopes/${view.envelopeId}/pdf?token=${encodeURIComponent(token)}&which=original#page=${page}`
  }, [view, token, page])

  async function submit() {
    if (!view) return
    setBusy(true)
    setError('')
    try {
      const payload: Record<string, string> = {
        typedName: typedName.trim() || view.signer.name,
      }
      if (mode === 'draw' && signaturePng) payload.signaturePng = signaturePng
      const res = await fetch(`/api/sign/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not submit signature.')
        return
      }
      setView(data.view)
      setDone(true)
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-body">Loading document…</p>
  }
  if (error && !view) {
    return (
      <div className="tile p-6">
        <h1 className="text-xl font-semibold text-ink">Link unavailable</h1>
        <p className="mt-2 text-sm text-body">{error}</p>
      </div>
    )
  }
  if (!view) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{view.title}</h1>
        <p className="mt-1 text-sm text-body">
          Signing as {view.signer.name} ({view.signer.email})
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="tile overflow-hidden p-2">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="text-muted">Page</span>
            <select
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className="rounded-lg border border-line px-2 py-1"
            >
              {Array.from({ length: view.pageCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="relative aspect-[8.5/11] w-full bg-surface-2">
            <iframe title="Document" src={pdfUrl} className="absolute inset-0 h-full w-full" />
            {view.fields
              .filter((f) => f.page === page)
              .map((f) => (
                <div
                  key={f.id}
                  className={`pointer-events-none absolute rounded border-2 ${
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
                />
              ))}
          </div>
        </div>

        <div className="tile space-y-4 p-4">
          {done ? (
            <div>
              <h2 className="text-lg font-semibold text-emerald-800">Signed</h2>
              <p className="mt-2 text-sm text-body">
                Thank you. {view.allSigned
                  ? 'All parties have signed — a completed PDF will be emailed shortly.'
                  : 'We will email the completed PDF once everyone has signed.'}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-ink">Your signature</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    mode === 'draw' ? 'bg-accent text-white' : 'border border-line'
                  }`}
                >
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() => setMode('type')}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    mode === 'type' ? 'bg-accent text-white' : 'border border-line'
                  }`}
                >
                  Type
                </button>
              </div>
              {mode === 'draw' ? (
                <SignaturePad onChange={setSignaturePng} />
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Type your full name</span>
                  <input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-accent"
                  />
                </label>
              )}
              {mode === 'draw' ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Printed name</span>
                  <input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-accent"
                  />
                </label>
              ) : null}
              {error ? <p className="text-sm text-warm">{error}</p> : null}
              <button
                type="button"
                disabled={busy || (mode === 'draw' ? !signaturePng : !typedName.trim())}
                onClick={submit}
                className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {busy ? 'Submitting…' : 'Agree & sign'}
              </button>
              <p className="text-xs text-muted">
                By signing you confirm you are authorized to sign this document.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
