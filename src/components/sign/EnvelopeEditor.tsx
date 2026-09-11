'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Envelope, FieldPlacement } from '@/lib/sign/types'
import { isEnvelopeLocked, placementAtPointer, type PageRect } from '@/lib/sign/placement'
import PdfScrollViewer from './PdfScrollViewer'
import { needsCompletedPdf } from '@/lib/sign/complete'
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
    grabOffsetX: number
    grabOffsetY: number
    width: number
    height: number
    moved: boolean
  } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Keep latest drafts in refs so queued saves never send stale Provider/Client boxes.
  const fieldsRef = useRef(fields)
  const signersRef = useRef(signers)
  const titleRef = useRef(title)
  const placeSignerIdRef = useRef(placeSignerId)
  const envelopeRef = useRef(envelope)

  useEffect(() => {
    fieldsRef.current = fields
    signersRef.current = signers
    titleRef.current = title
    placeSignerIdRef.current = placeSignerId
    envelopeRef.current = envelope
  })

  const saveChainRef = useRef(Promise.resolve<void>(undefined))
  const saveGenRef = useRef(0)
  // Bumped on every local fields edit so a slow PATCH response cannot clobber a newer drag.
  const fieldsEpochRef = useRef(0)
  const draggingIdRef = useRef<string | null>(null)

  const dragListenersRef = useRef<{
    move: (e: PointerEvent) => void
    up: () => void
  } | null>(null)

  useEffect(() => {
    return () => {
      const listeners = dragListenersRef.current
      if (!listeners) return
      window.removeEventListener('pointermove', listeners.move)
      window.removeEventListener('pointerup', listeners.up)
      dragListenersRef.current = null
    }
  }, [])

  // Poll so admin status catches magic-link signatures without a full reload.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(`/api/sign/envelopes/${envelopeRef.current.id}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => null)
        if (cancelled || !res.ok || !data?.ok || !data.envelope) return
        const env = data.envelope as Envelope
        const local = envelopeRef.current
        const remoteSigned = env.signers.filter((s) => s.status === 'signed').length
        const localSigned = local.signers.filter((s) => s.status === 'signed').length
        const localMissingRemoteSigned = env.signers.some(
          (s) =>
            s.status === 'signed' &&
            local.signers.find((l) => l.id === s.id)?.status !== 'signed',
        )
        if (
          env.updatedAt <= local.updatedAt &&
          env.status === local.status &&
          remoteSigned <= localSigned &&
          !localMissingRemoteSigned
        ) {
          return
        }
        // Don't clobber in-flight placement edits with an older field set unless status advanced.
        // Never regress sent/completed → draft (stale Blob poll was unlocking the editor ~2s after send).
        const statusRank = { draft: 0, sent: 1, completed: 2 } as const
        const statusAdvanced = statusRank[env.status] > statusRank[local.status]
        const statusRegressed = statusRank[env.status] < statusRank[local.status]
        const signedAdvanced = remoteSigned > localSigned || localMissingRemoteSigned
        if (statusRegressed && !signedAdvanced && !statusAdvanced) {
          // Stale draft snapshot — ignore entirely.
          return
        }
        const nextEnv = statusRegressed
          ? {
              ...env,
              status: local.status,
              // Keep local lock; still take newer signer signatures from remote.
              signers: env.signers.map((s) => {
                const loc = local.signers.find((l) => l.id === s.id)
                if (s.status === 'signed') return s
                if (loc?.status === 'signed') return loc
                return s
              }),
            }
          : env
        setEnvelope(nextEnv)
        envelopeRef.current = nextEnv
        setSigners(draftFromEnvelope(nextEnv))
        if (statusAdvanced || signedAdvanced || nextEnv.status === 'completed') {
          setFields(nextEnv.fields.filter((f) => f.type === 'signature'))
        }
      } catch {
        /* ignore transient poll errors */
      }
    }
    const id = window.setInterval(tick, 2000)
    const onFocus = () => void tick()
    window.addEventListener('focus', onFocus)
    void tick()
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [envelope.id])

  const locked = isEnvelopeLocked(envelope.status)

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
    if (isEnvelopeLocked(envelopeRef.current.status)) return
    setSigners((prev) => [...prev, { name: '', email: '', role: 'Signer' }])
  }

  function removeSignerRow(idx: number) {
    if (isEnvelopeLocked(envelopeRef.current.status)) return
    const target = signers[idx]
    setSigners((prev) => prev.filter((_, i) => i !== idx))
    if (target?.id) {
      setFields((prev) => {
        const next = prev.filter((f) => f.signerId !== target.id)
        fieldsEpochRef.current += 1
        fieldsRef.current = next
        return next
      })
      if (placeSignerId === target.id) setPlaceSignerId(null)
    }
  }

  async function save(next?: {
    title?: string
    signers?: SignerDraft[]
    fields?: FieldPlacement[]
  }) {
    // Never autosave/structural-save once sent — would 400 and race magic-link signatures.
    if (isEnvelopeLocked(envelopeRef.current.status)) {
      return envelopeRef.current
    }
    // Capture gen + snapshots at queue time (not when the chain runs). Otherwise a slow
    // Client PATCH can finish while Provider is queued, apply stale fields, and the
    // Provider autosave then persists the default top box again.
    const myGen = ++saveGenRef.current
    const queuedFields = (next?.fields ?? fieldsRef.current).map((f) => ({ ...f }))
    const queuedSigners = (next?.signers ?? signersRef.current).map((s) => ({ ...s }))
    const queuedTitle = next?.title ?? titleRef.current
    const fieldsEpochAtQueue = fieldsEpochRef.current
    if (next?.fields) {
      fieldsRef.current = queuedFields
    }
    if (next?.signers) {
      signersRef.current = queuedSigners
    }
    if (next?.title != null) {
      titleRef.current = queuedTitle
    }

    const run = async (): Promise<Envelope | null> => {
      const draft = queuedSigners
      const incomplete = draft.filter((s) => !s.name.trim() || !s.email.trim())
      if (incomplete.length) {
        setError('Every signer needs a name and email before Save can unlock Place box.')
        return null
      }

      setBusy(true)
      setError('')
      try {
        const res = await fetch(`/api/sign/envelopes/${envelopeRef.current.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: queuedTitle,
            signers: draft.map((s) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              role: (s.role || 'Signer').trim().slice(0, 60) || 'Signer',
            })),
            fields: queuedFields.filter((f) => f.type === 'signature'),
          }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
          setError(data?.error || 'Save failed.')
          return null
        }
        const env = data.envelope as Envelope
        // Ignore outdated responses so a slow Client save cannot snap Provider back.
        if (myGen !== saveGenRef.current) return env
        const rank = { draft: 0, sent: 1, completed: 2 } as const
        // Queued autosave can return/echo draft after send unlocked the UI — never regress.
        if (rank[env.status] < rank[envelopeRef.current.status]) {
          return envelopeRef.current
        }
        setEnvelope(env)
        envelopeRef.current = env
        setSigners(draftFromEnvelope(env))
        // Never clobber a newer local drag/place, or an in-progress pointer drag.
        const fieldsStale =
          fieldsEpochAtQueue !== fieldsEpochRef.current || Boolean(draggingIdRef.current)
        if (!fieldsStale) {
          const savedFields = env.fields.filter((f) => f.type === 'signature')
          setFields(savedFields)
          fieldsRef.current = savedFields
        }
        signersRef.current = draftFromEnvelope(env)
        const keepPlace =
          placeSignerIdRef.current &&
          env.signers.some((s) => s.id === placeSignerIdRef.current)
            ? placeSignerIdRef.current
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
        if (myGen === saveGenRef.current) setBusy(false)
      }
    }

    // Serialize saves — overlapping PATCHes were why Provider snapped to the bottom.
    const queued = saveChainRef.current.then(run, run)
    saveChainRef.current = queued.then(
      () => undefined,
      () => undefined,
    )
    return queued
  }

  async function send() {
    // Resend magic links on an already-sent envelope must not PATCH fields/signers.
    let saved = envelopeRef.current
    if (!isEnvelopeLocked(saved.status)) {
      const result = await save()
      if (!result) return
      saved = result
    }
    if (saved.signers.some((s) => !s.email)) {
      setError('Every signer needs a name and email before sending.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/sign/envelopes/${saved.id}/send`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Send failed.')
        return
      }
      const sentEnv = data.envelope as Envelope
      setEnvelope(sentEnv)
      envelopeRef.current = sentEnv
      // Drop any in-flight draft autosaves so they cannot unlock the editor.
      saveGenRef.current += 1
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
    if (isEnvelopeLocked(envelope.status)) return
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
      ...fieldsRef.current.filter(
        (f) => !(f.signerId === placeSignerId && f.type === 'signature'),
      ),
      nextField,
    ]
    fieldsEpochRef.current += 1
    fieldsRef.current = nextFields
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

  function collectPageRects(): PageRect[] {
    const nodes = document.querySelectorAll<HTMLElement>('[data-page]')
    const out: PageRect[] = []
    nodes.forEach((el) => {
      const page = Number(el.dataset.page)
      if (!Number.isFinite(page) || page < 1) return
      const r = el.getBoundingClientRect()
      out.push({ page, left: r.left, top: r.top, width: r.width, height: r.height })
    })
    return out
  }

  function applyDragPointer(clientX: number, clientY: number) {
    const drag = dragRef.current
    if (!drag) return
    const pages = collectPageRects()
    const next = placementAtPointer(
      clientX,
      clientY,
      pages,
      drag.width,
      drag.height,
      drag.grabOffsetX,
      drag.grabOffsetY,
    )
    if (!next) return
    if (Math.abs(clientX - drag.startX) > 3 || Math.abs(clientY - drag.startY) > 3) {
      drag.moved = true
    }
    if (!drag.moved) return
    setFields((prev) => {
      const mapped = prev.map((f) =>
        f.id === drag.id ? { ...f, page: next.page, x: next.x, y: next.y } : f,
      )
      fieldsEpochRef.current += 1
      fieldsRef.current = mapped
      return mapped
    })
    // Do not setPage here — focusPage scrollIntoView would yank mid-drag.
  }

  function detachDragListeners() {
    const listeners = dragListenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.move)
    window.removeEventListener('pointerup', listeners.up)
    dragListenersRef.current = null
  }

  function endFieldDrag(field: FieldPlacement) {
    const drag = dragRef.current
    const wasDrag = Boolean(drag?.moved)
    dragRef.current = null
    draggingIdRef.current = null
    setDraggingId(null)
    detachDragListeners()
    if (wasDrag) {
      const current = fieldsRef.current.map((f) => ({ ...f }))
      const moved = current.find((f) => f.id === field.id)
      if (moved) setPage(moved.page)
      void save({ fields: current }).then((env) => {
        if (env) setMessage('Signature line moved and saved.')
      })
      return
    }
    openSignBox(field)
  }

  function onFieldPointerDown(e: React.PointerEvent<HTMLButtonElement>, field: FieldPlacement) {
    if (envelope.status === 'completed') return
    e.stopPropagation()
    e.preventDefault()
    // Locked for signing: click still opens the sign box; drag/place are disabled.
    if (isEnvelopeLocked(envelope.status)) {
      openSignBox(field)
      return
    }
    const board = e.currentTarget.parentElement
    if (!board) return
    const rect = board.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const grabOffsetX = (e.clientX - rect.left) / rect.width - field.x
    const grabOffsetY = (e.clientY - rect.top) / rect.height - field.y
    detachDragListeners()
    dragRef.current = {
      id: field.id,
      startX: e.clientX,
      startY: e.clientY,
      grabOffsetX,
      grabOffsetY,
      width: field.width,
      height: field.height,
      moved: false,
    }
    draggingIdRef.current = field.id
    setDraggingId(field.id)
    // Window listeners keep tracking when the box remounts onto another page overlay.
    // Do not listen for pointercancel — React remounting the box on a new page can
    // synthesize cancel and would abort a cross-page drag.
    const move = (ev: PointerEvent) => {
      if (!dragRef.current) return
      ev.preventDefault()
      applyDragPointer(ev.clientX, ev.clientY)
    }
    const up = () => {
      const drag = dragRef.current
      if (!drag) {
        detachDragListeners()
        return
      }
      const live = fieldsRef.current.find((f) => f.id === drag.id)
      if (!live) {
        dragRef.current = null
        draggingIdRef.current = null
        setDraggingId(null)
        detachDragListeners()
        return
      }
      endFieldDrag(live)
    }
    dragListenersRef.current = { move, up }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
  }

  function onFieldPointerUp(e: React.PointerEvent<HTMLButtonElement>, field: FieldPlacement) {
    // Prefer window pointerup; this is a fallback if the button still receives up.
    if (!dragRef.current || dragRef.current.id !== field.id) return
    e.stopPropagation()
    endFieldDrag(field)
  }

  function onDocumentPages(total: number) {
    if (!Number.isFinite(total) || total < 1) return
    const current = envelopeRef.current.pageCount
    if (total <= current) return
    setEnvelope((prev) => ({ ...prev, pageCount: total }))
    envelopeRef.current = { ...envelopeRef.current, pageCount: total }
    // Skip PATCH when locked — API allows pageCount-only, but local display bump is enough.
    if (isEnvelopeLocked(envelopeRef.current.status)) return
    // Persist so later sanitize/magic-link views agree with pdf.js page count.
    void fetch(`/api/sign/envelopes/${envelopeRef.current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageCount: total }),
    }).then(async (res) => {
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok && data.envelope) {
        const env = data.envelope as Envelope
        setEnvelope(env)
        envelopeRef.current = env
      }
    })
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
      const sendRes = await fetch(`/api/sign/envelopes/${envelope.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Open for signing only — do NOT email until "Email magic links" is clicked.
        body: JSON.stringify({ email: false }),
      })
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


  async function generateCompletedPdf() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/sign/envelopes/${envelope.id}/complete`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok || !data.envelope) {
        setError(data?.error || 'Could not generate completed PDF.')
        return
      }
      const env = data.envelope as Envelope
      setEnvelope(env)
      envelopeRef.current = env
      setSigners(draftFromEnvelope(env))
      setMessage(
        data.alreadyCompleted
          ? 'Completed PDF already available.'
          : 'Completed PDF generated. Download link is ready — check email shortly.',
      )
    } catch {
      setError('Network error generating completed PDF.')
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
            disabled={busy || locked}
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
      {locked ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          Locked for signing — placements and signers can’t be edited.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <div className="tile space-y-3 p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Title</span>
              <input
                value={title}
                disabled={locked}
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
                disabled={locked}
                onClick={addSignerRow}
                className="btn-ghost-sm"
              >
                + Add signer
              </button>
            </div>
            <p className="text-xs text-body">
              {locked
                ? 'Document is locked while signing is in progress. Viewing and signing boxes still work.'
                : 'Edit name, role, and email. Placements auto-save when you place or drag a signature line on the PDF.'}
            </p>
            {signers.map((s, idx) => {
              const live = s.id ? envelope.signers.find((x) => x.id === s.id) : undefined
              return (
                <div key={s.id || `new-${idx}`} className="space-y-2 rounded-xl border border-line p-3">
                  <input
                    placeholder="Name"
                    value={s.name}
                    disabled={locked}
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
                    disabled={locked}
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
                    disabled={locked}
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
                        disabled={locked}
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
                    {signers.length > 1 && !locked ? (
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
          ) : needsCompletedPdf(envelope) ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void generateCompletedPdf()}
              className="btn-primary w-full !bg-amber-700 hover:!bg-amber-800"
            >
              {busy ? 'Generating…' : 'Generate completed PDF'}
            </button>
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
            {placeSignerId && !locked ? (
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
            placeMode={Boolean(placeSignerId) && !locked}
            onFocusPageChange={setPage}
            onDocumentPages={onDocumentPages}
            onPageClick={onPlace}
            renderPageOverlay={(pageNum) =>
              fields
                .filter((f) => f.page === pageNum)
                .map((f) => {
                  const live = envelope.signers.find((s) => s.id === f.signerId)
                  const signed = live?.status === 'signed'
                  const signedDate =
                    signed
                      ? live?.signedDateText ||
                        (live?.signedAt
                          ? new Date(live.signedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : undefined)
                      : undefined
                  return (
                    <button
                      key={f.id}
                      type="button"
                      data-field-id={f.id}
                      onPointerDown={(e) => onFieldPointerDown(e, f)}
                      onPointerUp={(e) => onFieldPointerUp(e, f)}
                      className={`pointer-events-auto absolute touch-none overflow-hidden rounded-md border-2 text-left shadow-sm ${
                        draggingId === f.id
                          ? 'border-accent bg-white/95 cursor-grabbing z-10'
                          : activeFieldId === f.id
                            ? 'border-accent bg-white/95 cursor-pointer'
                            : signed
                              ? 'border-emerald-600 bg-white/90 cursor-default'
                              : locked
                                ? 'border-accent bg-accent/15 hover:bg-accent/25 cursor-pointer'
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
                        signedDate={signedDate}
                        hint={locked ? 'Click to sign' : 'Drag to move · click to sign'}
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
