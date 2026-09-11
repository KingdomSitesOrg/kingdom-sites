'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Envelope, FieldPlacement } from '@/lib/sign/types'
import PdfScrollViewer from './PdfScrollViewer'
import SignatureLineBox from './SignatureLineBox'

type SignerDraft = { id?: string; name: string; email: string; role: string }

type Props = { initial: Envelope }

const PLACE_WIDTH = 0.42
const PLACE_HEIGHT = 0.11

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

function draftFromEnvelope(env: Envelope): SignerDraft[] {
  return env.signers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role || 'Signer',
  }))
}

export default function EnvelopeEditor({ initial }: Props) {
  const router = useRouter()
  const [envelope, setEnvelope] = useState(initial)
  const [title, setTitle] = useState(initial.title)
  const [signers, setSigners] = useState<SignerDraft[]>(
    initial.signers.length
      ? draftFromEnvelope(initial)
      : [
          { name: 'Client', email: '', role: 'Client' },
          { name: 'Provider', email: '', role: 'Provider' },
        ],
  )
  const [fields, setFields] = useState<FieldPlacement[]>(
    initial.fields.filter((f) => f.type === 'signature'),
  )
  const [page, setPage] = useState(1)
  const [placeSignerId, setPlaceSignerId] = useState<string | null>(
    initial.signers[0]?.id || null,
  )
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
    moved: boolean
  } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pdfUrl = useMemo(
    () => `/api/sign/envelopes/${envelope.id}/pdf?which=original`,
    [envelope.id],
  )

  const signerLabel = (id: string) =>
    signers.find((s) => s.id === id)?.name || id.slice(0, 6)

  const signerRole = (id: string) =>
    signers.find((s) => s.id === id)?.role ||
    envelope.signers.find((s) => s.id === id)?.role ||
    'Signer'

  function addSignerRow() {
    setSigners((prev) => [...prev, { name: '', email: '', role: 'Signer' }])
  }

  function removeSignerRow(idx: number) {
    const target = signers[idx]
    setSigners((prev) => prev.filter((_, i) => i !== idx))
    if (target?.id) {
      setFields((prev) => prev.filter((f) => f.signerId !== target.id))
      if (placeSignerId === target.id) setPlaceSignerId(null)
    }
  }

  async function save(next?: {
    title?: string
    signers?: SignerDraft[]
    fields?: FieldPlacement[]
  }) {
    const draft = next?.signers ?? signers
    const incomplete = draft.filter((s) => !s.name.trim() || !s.email.trim())
    if (incomplete.length) {
      setError('Every signer needs a name and email before Save can unlock Place box.')
      return null
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/sign/envelopes/${envelope.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: next?.title ?? title,
          signers: draft.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: (s.role || 'Signer').trim().slice(0, 60) || 'Signer',
          })),
          fields: (next?.fields ?? fields).filter((f) => f.type === 'signature'),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Save failed.')
        return null
      }
      const env = data.envelope as Envelope
      setEnvelope(env)
      setSigners(draftFromEnvelope(env))
      setFields(env.fields.filter((f) => f.type === 'signature'))
      const keepPlace =
        placeSignerId && env.signers.some((s) => s.id === placeSignerId)
          ? placeSignerId
          : env.signers[0]?.id || null
      setPlaceSignerId(keepPlace)
      setMessage(
        env.signers.length
          ? `Saved. Place box is ready — pick a signer and click/drag on the PDF.`
          : 'Saved.',
      )
      return env
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
    if (saved.signers.some((s) => !s.email)) {
      setError('Every signer needs a name and email before sending.')
      return
    }
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
      const links = (data.results || [])
        .map((r: { email: string; link: string; sent: boolean }) =>
          `${r.email}: ${r.link}${r.sent ? '' : ' (email not sent — use link)'}`,
        )
        .join(' | ')
      setMessage(
        data.emailed
          ? 'Magic links emailed. You can also sign boxes here.'
          : `Opened for signing. ${links || data.notice || 'Use Sign boxes here or copy links from the audit log.'}`,
      )
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  function onPlace(pageNum: number, e: React.MouseEvent<HTMLDivElement>) {
    if (envelope.status === 'completed') return
    if (dragRef.current?.moved) return
    if ((e.target as HTMLElement).closest('[data-field-id]')) return
    if (!placeSignerId) {
      setError('Choose Place signature line for a signer first.')
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const width = PLACE_WIDTH
    const height = PLACE_HEIGHT
    const nextField: FieldPlacement = {
      id: `fld_${placeSignerId}_sig`,
      type: 'signature',
      signerId: placeSignerId,
      page: pageNum,
      x: Math.min(Math.max(x - width / 2, 0), 1 - width),
      y: Math.min(Math.max(y - height / 2, 0), 1 - height),
      width,
      height,
    }
    const nextFields = [
      ...fields.filter((f) => !(f.signerId === placeSignerId && f.type === 'signature')),
      nextField,
    ]
    setFields(nextFields)
    setPage(pageNum)
    setError('')
    setMessage(
      `Placed signature line for ${signerLabel(placeSignerId)} on page ${pageNum}. Saving…`,
    )
    // Pass next fields so React state lag cannot send stale boxes
    void save({ fields: nextFields }).then((env) => {
      if (env) {
        setMessage(
          `Placed and saved signature line for ${signerLabel(placeSignerId)} on page ${pageNum}.`,
        )
      }
    })
  }

  function openSignBox(field: FieldPlacement) {
    if (envelope.status === 'completed') return
    if (dragRef.current?.moved) return
    const signer = envelope.signers.find((s) => s.id === field.signerId)
    if (!signer) {
      setError('Save signers first so this box is linked to a person.')
      return
    }
    if (signer.status === 'signed') {
      setMessage(`${signer.name} already signed.`)
      return
    }
    setActiveFieldId(field.id)
    setTypedName(signer.name || '')
    setError('')
    setMessage(`Signing as ${signer.name}. Type the name, then Save.`)
  }

  function onFieldPointerDown(e: React.PointerEvent<HTMLButtonElement>, field: FieldPlacement) {
    if (envelope.status === 'completed') return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: field.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: field.x,
      origY: field.y,
      moved: false,
    }
    setDraggingId(field.id)
  }

  function onFieldPointerMove(e: React.PointerEvent<HTMLButtonElement>, field: FieldPlacement) {
    const drag = dragRef.current
    if (!drag || drag.id !== field.id) return
    const board = e.currentTarget.parentElement
    if (!board) return
    const rect = board.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const dx = (e.clientX - drag.startX) / rect.width
    const dy = (e.clientY - drag.startY) / rect.height
    if (Math.abs(dx) > 0.004 || Math.abs(dy) > 0.004) drag.moved = true
    if (!drag.moved) return
    const nextX = Math.min(Math.max(drag.origX + dx, 0), 1 - field.width)
    const nextY = Math.min(Math.max(drag.origY + dy, 0), 1 - field.height)
    setFields((prev) =>
      prev.map((f) => (f.id === field.id ? { ...f, x: nextX, y: nextY } : f)),
    )
  }

  function onFieldPointerUp(e: React.PointerEvent<HTMLButtonElement>, field: FieldPlacement) {
    const drag = dragRef.current
    const wasDrag = Boolean(drag?.moved)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
    setDraggingId(null)
    if (wasDrag) {
      // Read latest placements from state updater so we don't save stale coords
      setFields((current) => {
        void save({ fields: current }).then((env) => {
          if (env) setMessage('Signature line moved and saved.')
        })
        return current
      })
      return
    }
    openSignBox(field)
  }

  async function saveSignature() {
    if (!activeFieldId) return
    const field = fields.find((f) => f.id === activeFieldId)
    if (!field) return
    const signer = envelope.signers.find((s) => s.id === field.signerId)
    if (!signer) {
      setError('Unknown signer — save the document first.')
      return
    }
    const name = typedName.trim()
    if (!name) {
      setError('Type a name to sign.')
      return
    }

    // Ensure envelope is sent so signing API accepts it
    let env = envelope
    if (env.status === 'draft') {
      const saved = await save()
      if (!saved) return
      setBusy(true)
      const sendRes = await fetch(`/api/sign/envelopes/${envelope.id}/send`, { method: 'POST' })
      const sendData = await sendRes.json().catch(() => null)
      setBusy(false)
      if (!sendRes.ok || !sendData?.ok) {
        setError(sendData?.error || 'Could not open for signing.')
        return
      }
      env = sendData.envelope as Envelope
      setEnvelope(env)
    }

    const live = env.signers.find((s) => s.id === field.signerId)
    if (!live) {
      setError('Signer missing after save.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const signaturePng = renderCursivePng(name)
      const res = await fetch(`/api/sign/s/${live.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: name, signaturePng }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not save signature.')
        return
      }
      // Refresh full envelope for admin view
      const refresh = await fetch(`/api/sign/envelopes/${envelope.id}`)
      const refreshed = await refresh.json().catch(() => null)
      if (refreshed?.ok && refreshed.envelope) {
        setEnvelope(refreshed.envelope)
        setSigners(draftFromEnvelope(refreshed.envelope))
        setFields(refreshed.envelope.fields.filter((f: FieldPlacement) => f.type === 'signature'))
      }
      setActiveFieldId(null)
      setTypedName('')
      setMessage(
        data.completed
          ? 'All parties signed — document complete.'
          : `Saved signature for ${name}.`,
      )
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  async function removeDoc() {
    if (!window.confirm(`Delete “${envelope.title}”? This cannot be undone.`)) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/sign/envelopes/${envelope.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Could not delete.')
        return
      }
      router.replace('/sign/dashboard')
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/sign/dashboard" className="btn-ghost-sm">
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
            className="btn-ghost !min-h-10 !px-4 !py-2 !text-sm"
          >
            Save document
          </button>
          <button
            type="button"
            disabled={busy || envelope.status === 'completed'}
            onClick={send}
            className="btn-primary !min-h-10 !px-4 !py-2 !text-sm"
          >
            Email magic links
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={removeDoc}
            className="btn-danger !min-h-10 !px-4 !py-2 !text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-warm">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
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
                className="btn-ghost-sm"
              >
                + Add signer
              </button>
            </div>
            <p className="text-xs text-body">
              Edit name, role, and email. Placements auto-save when you place or drag a signature
              line on the PDF.
            </p>
            {signers.map((s, idx) => {
              const live = s.id ? envelope.signers.find((x) => x.id === s.id) : undefined
              return (
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
                    placeholder="Role (e.g. Client / Provider)"
                    value={s.role}
                    disabled={envelope.status === 'completed'}
                    onChange={(e) => {
                      const next = [...signers]
                      next[idx] = { ...next[idx], role: e.target.value }
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
                  <div className="flex flex-wrap items-center gap-2">
                    {s.id ? (
                      <button
                        type="button"
                        disabled={envelope.status === 'completed'}
                        className={`btn-ghost-sm ${placeSignerId === s.id ? 'is-active' : ''}`}
                        onClick={() => setPlaceSignerId(s.id!)}
                      >
                        {placeSignerId === s.id ? 'Placing line…' : 'Place signature line'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted">Fill name + email, then Save document</span>
                    )}
                    {live?.status === 'signed' ? (
                      <span className="text-xs font-medium text-emerald-700">Signed</span>
                    ) : null}
                    {signers.length > 1 && envelope.status !== 'completed' ? (
                      <button
                        type="button"
                        className="btn-danger-sm ml-auto"
                        onClick={() => removeSignerRow(idx)}
                      >
                        Remove signer
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="tile space-y-3 p-4">
            <h2 className="text-sm font-semibold text-ink">How to sign</h2>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-body">
              <li>Add/edit signers (name, role, email) and Save document.</li>
              <li>
                Click Place signature line, click the PDF to drop it (auto-saves). Drag anytime to
                fine-tune (also auto-saves).
              </li>
              <li>Click a line to sign: type the name (cursive), hit Save.</li>
            </ol>
          </div>

          {activeFieldId ? (
            <div className="tile space-y-3 border-2 border-accent p-4">
              <h2 className="text-sm font-semibold text-ink">Type signature</h2>
              <input
                autoFocus
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-line px-3 py-3 text-2xl italic text-ink outline-none focus:border-accent"
                style={{ fontFamily: '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive' }}
              />
              <button
                type="button"
                disabled={busy || !typedName.trim()}
                onClick={saveSignature}
                className="btn-primary w-full"
              >
                {busy ? 'Saving…' : 'Save signature'}
              </button>
              <button
                type="button"
                className="btn-ghost w-full !min-h-10 !text-sm"
                onClick={() => {
                  setActiveFieldId(null)
                  setTypedName('')
                }}
              >
                Cancel
              </button>
            </div>
          ) : null}

          {envelope.status === 'completed' && envelope.completedPdfKey ? (
            <a
              href={`/api/sign/envelopes/${envelope.id}/pdf?which=completed`}
              className="btn-primary block w-full !bg-emerald-700 hover:!bg-emerald-800"
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

        <div className="tile max-h-[78vh] overflow-auto p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            {placeSignerId && envelope.status !== 'completed' ? (
              <>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  Place mode: click a page for {signerLabel(placeSignerId)}
                </span>
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={() => setPlaceSignerId(null)}
                >
                  Done placing
                </button>
              </>
            ) : (
              <span className="text-xs text-muted">
                Scroll normally — signature lines stay on their page. Use Place signature line to
                drop a new one.
              </span>
            )}
          </div>
          <PdfScrollViewer
            url={pdfUrl}
            pageCount={envelope.pageCount}
            focusPage={page}
            placeMode={Boolean(placeSignerId) && envelope.status !== 'completed'}
            onPageClick={onPlace}
            renderPageOverlay={(pageNum) =>
              fields
                .filter((f) => f.page === pageNum)
                .map((f) => {
                  const live = envelope.signers.find((s) => s.id === f.signerId)
                  const signed = live?.status === 'signed'
                  return (
                    <button
                      key={f.id}
                      type="button"
                      data-field-id={f.id}
                      onPointerDown={(e) => onFieldPointerDown(e, f)}
                      onPointerMove={(e) => onFieldPointerMove(e, f)}
                      onPointerUp={(e) => onFieldPointerUp(e, f)}
                      onPointerCancel={(e) => onFieldPointerUp(e, f)}
                      className={`pointer-events-auto absolute touch-none overflow-hidden rounded-md border-2 text-left shadow-sm ${
                        draggingId === f.id
                          ? 'border-accent bg-white/95 cursor-grabbing z-10'
                          : activeFieldId === f.id
                            ? 'border-accent bg-white/95 cursor-grab'
                            : signed
                              ? 'border-emerald-600 bg-white/90 cursor-default'
                              : 'border-accent bg-accent/15 hover:bg-accent/25 cursor-grab'
                      }`}
                      style={{
                        left: `${f.x * 100}%`,
                        top: `${f.y * 100}%`,
                        width: `${f.width * 100}%`,
                        height: `${f.height * 100}%`,
                      }}
                    >
                      <SignatureLineBox
                        role={signerRole(f.signerId)}
                        name={live?.name || signerLabel(f.signerId)}
                        signed={signed}
                        hint="Drag to move · click to sign"
                      />
                    </button>
                  )
                })
            }
          />
        </div>
      </div>
    </div>
  )
}
