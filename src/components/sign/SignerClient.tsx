'use client'

import { useEffect, useMemo, useState } from 'react'
import PdfScrollViewer from './PdfScrollViewer'
import SignatureLineBox from './SignatureLineBox'

type Party = {
  id: string
  name: string
  email: string
  role?: string
  status: string
  signedAt?: string
  signedDateText?: string
}

type View = {
  envelopeId: string
  title: string
  status: string
  pageCount: number
  signer: {
    id: string
    name: string
    email: string
    role?: string
    status: string
    signedAt?: string
    signedDateText?: string
  }
  parties: Party[]
  fields: {
    id: string
    type: 'signature' | 'date'
    signerId: string
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
  // Transparent background so stamped ink sits cleanly on the signature line
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#15181d'
  ctx.font = 'italic 96px "Segoe Script", "Brush Script MT", "Apple Chancery", cursive'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.trim(), 36, canvas.height / 2)
  return canvas.toDataURL('image/png')
}

function partySignedDate(party: Party | undefined, fallbackDone = false): string | undefined {
  if (!party) return undefined
  if (party.status === 'signed' || fallbackDone) {
    if (party.signedDateText) return party.signedDateText
    if (party.signedAt) {
      return new Date(party.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }
  return undefined
}

function boxWidthFrac(fieldWidth: number): number {
  return fieldWidth
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
          const next = data.view as View
          setView(next)
          setTypedName(next.signer.name || '')
          if (next.signer.status === 'signed') setDone(true)
          const myFirst = (next.fields || []).find(
            (f) => f.type === 'signature' && f.signerId === next.signer.id,
          )
          setFocusPage(myFirst?.page || 1)
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

  const pdfDownloadUrl = useMemo(() => {
    if (!pdfUrl) return ''
    return `${pdfUrl}&download=1`
  }, [pdfUrl])

  async function submit() {
    if (!view) return
    const name = typedName.trim()
    if (!name) {
      setError('Type your name to sign.')
      return
    }
    setBusy(true)
    setError('')
    // Optimistic: show Signed immediately so a slow stamp/email on the last signer
    // cannot leave the magic-link spinner up after the durable write already landed.
    setDone(true)
    setEditing(false)
    try {
      const signaturePng = renderCursivePng(name)
      const res = await fetch(`/api/sign/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: name, signaturePng }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setDone(false)
        setEditing(true)
        setError(data?.error || 'Could not submit signature.')
        return
      }
      setView(data.view)
      setDone(true)
      setEditing(false)
    } catch {
      setDone(false)
      setEditing(true)
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

  const parties = view.parties?.length
    ? view.parties
    : [
        {
          id: view.signer.id,
          name: view.signer.name,
          email: view.signer.email,
          role: view.signer.role,
          status: view.signer.status,
          signedAt: view.signer.signedAt,
        },
      ]
  const partyById = new Map(parties.map((p) => [p.id, p]))
  const sigFields = view.fields.filter((f) => f.type === 'signature')
  const myFields = sigFields.filter((f) => f.signerId === view.signer.id)
  const role = (view.signer.role || 'Signer').trim() || 'Signer'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{view.title}</h1>
        <p className="mt-1 text-sm text-body">
          Signing as {view.signer.name}
          {role ? ` · ${role}` : ''} ({view.signer.email})
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="tile max-h-[75vh] overflow-auto p-3">
          <PdfScrollViewer
            key={pdfUrl}
            url={pdfUrl}
            pageCount={view.pageCount}
            focusPage={focusPage}
            onFocusPageChange={setFocusPage}
            renderPageOverlay={(page) =>
              sigFields
                .filter((f) => f.page === page)
                .map((f) => {
                  const party = partyById.get(f.signerId)
                  const isMine = f.signerId === view.signer.id
                  const partyRole = (party?.role || 'Signer').trim() || 'Signer'
                  const partyName = party?.name || ''
                  const partySigned = party?.status === 'signed' || (isMine && done)
                  const dateText = partySignedDate(party, isMine && done)
                  const widthFrac = boxWidthFrac(f.width)
                  if (isMine) {
                    return (
                      <button
                        key={f.id}
                        type="button"
                        data-field-id={f.id}
                        disabled={done}
                        onClick={() => {
                          setFocusPage(page)
                          setEditing(true)
                        }}
                        className={`absolute z-[5] overflow-hidden rounded-md border-2 bg-white text-left shadow-sm ${
                          done
                            ? 'border-emerald-600'
                            : editing
                              ? 'border-accent ring-2 ring-accent/30'
                              : 'border-accent hover:ring-2 hover:ring-accent/20'
                        }`}
                        style={{
                          left: `${f.x * 100}%`,
                          top: `${f.y * 100}%`,
                          width: `${widthFrac * 100}%`,
                          height: `${f.height * 100}%`,
                        }}
                      >
                        <SignatureLineBox
                          role={partyRole}
                          name={partyName || view.signer.name}
                          signed={done}
                          signedDate={dateText}
                          hint="Click to sign"
                        />
                      </button>
                    )
                  }
                  return (
                    <div
                      key={f.id}
                      data-field-id={f.id}
                      className={`absolute z-[5] overflow-hidden rounded-md border-2 bg-white shadow-sm ${
                        partySigned
                          ? 'border-emerald-600'
                          : 'border-line'
                      }`}
                      style={{
                        left: `${f.x * 100}%`,
                        top: `${f.y * 100}%`,
                        width: `${widthFrac * 100}%`,
                        height: `${f.height * 100}%`,
                      }}
                    >
                      <SignatureLineBox
                        role={partyRole}
                        name={partyName}
                        signed={partySigned}
                        signedDate={dateText}
                        hint="Waiting for signature"
                      />
                    </div>
                  )
                })
            }
          />
        </div>

        <div className="tile h-fit space-y-4 p-4 lg:sticky lg:top-4">
          <a
            href={pdfDownloadUrl}
            download
            className="btn-ghost flex w-full items-center justify-center gap-2 !min-h-11 border border-line text-sm font-medium text-ink hover:bg-surface"
          >
            Download PDF
          </a>
          <p className="-mt-2 text-xs text-muted">
            Original unsigned document — download to review or annotate offline.
          </p>
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
              <p className="text-xs text-muted">Signing as {role}</p>
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
                Scroll the document, then click your signature line, type your name, and hit Save.
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
