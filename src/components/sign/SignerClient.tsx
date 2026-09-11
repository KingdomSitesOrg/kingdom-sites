'use client'

import { useEffect, useMemo, useState } from 'react'
import PdfScrollViewer from './PdfScrollViewer'

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

function renderCursivePng(name: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 220
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#15181d'
  ctx.font = 'italic 96px "Segoe Script", "Brush Script MT", "Apple Chancery", cursive'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.trim(), 36, canvas.height / 2)
  return canvas.toDataURL('image/png')
}

export default function SignerClient({ token }: { token: string }) {
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [typedName, setTypedName] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [focusPage, setFocusPage] = useState(1)

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
          setFocusPage(1)
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
    return `/api/sign/envelopes/${view.envelopeId}/pdf?token=${encodeURIComponent(token)}&which=original`
  }, [view, token])

  async function submit() {
    if (!view) return
    const name = typedName.trim()
    if (!name) {
      setError('Type your name to sign.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const signaturePng = renderCursivePng(name)
      const res = await fetch(`/api/sign/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: name, signaturePng }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not submit signature.')
        return
      }
      setView(data.view)
      setDone(true)
      setEditing(false)
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

  const myFields = view.fields.filter((f) => f.type === 'signature')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{view.title}</h1>
        <p className="mt-1 text-sm text-body">
          Signing as {view.signer.name} ({view.signer.email})
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="tile max-h-[75vh] overflow-auto p-3">
          <PdfScrollViewer
            url={pdfUrl}
            pageCount={view.pageCount}
            focusPage={focusPage}
            renderPageOverlay={(page) =>
              myFields
                .filter((f) => f.page === page)
                .map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    data-field-id={f.id}
                    disabled={done}
                    onClick={() => {
                      setFocusPage(page)
                      setEditing(true)
                    }}
                    className={`absolute rounded-md border-2 text-left ${
                      done
                        ? 'border-emerald-600 bg-emerald-50'
                        : editing
                          ? 'border-accent bg-white'
                          : 'border-accent bg-accent/20 hover:bg-accent/30'
                    }`}
                    style={{
                      left: `${f.x * 100}%`,
                      top: `${f.y * 100}%`,
                      width: `${f.width * 100}%`,
                      height: `${f.height * 100}%`,
                    }}
                  >
                    <span className="block truncate px-2 pt-1 text-[11px] font-semibold text-ink">
                      Signature: {view.signer.name}
                    </span>
                    {done ? (
                      <span
                        className="block truncate px-2 text-lg italic"
                        style={{
                          fontFamily:
                            '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
                        }}
                      >
                        {view.signer.name}
                      </span>
                    ) : (
                      <span className="block px-2 text-[10px] text-muted">Click to sign</span>
                    )}
                  </button>
                ))
            }
          />
        </div>

        <div className="tile h-fit space-y-4 p-4 lg:sticky lg:top-4">
          {done ? (
            <div>
              <h2 className="text-lg font-semibold text-emerald-800">Signed</h2>
              <p className="mt-2 text-sm text-body">
                Thank you.{' '}
                {view.allSigned
                  ? 'All parties have signed — a completed PDF will be emailed shortly.'
                  : 'We will email the completed PDF once everyone has signed.'}
              </p>
            </div>
          ) : editing ? (
            <>
              <h2 className="text-sm font-semibold text-ink">Type your name</h2>
              <input
                autoFocus
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-3 text-2xl italic outline-none focus:border-accent"
                style={{
                  fontFamily: '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
                }}
              />
              {error ? <p className="text-sm text-warm">{error}</p> : null}
              <button
                type="button"
                disabled={busy || !typedName.trim()}
                onClick={submit}
                className="btn-primary w-full"
              >
                {busy ? 'Saving…' : 'Save signature'}
              </button>
              <p className="text-xs text-muted">
                By saving you confirm you are authorized to sign this document.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-ink">Your turn</h2>
              <p className="text-sm text-body">
                Scroll the document, then click your signature box, type your name, and hit Save.
              </p>
              <button
                type="button"
                onClick={() => {
                  const first = myFields[0]
                  if (first) setFocusPage(first.page)
                  setEditing(true)
                }}
                className="btn-primary w-full"
              >
                Sign now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
