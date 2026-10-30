'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Envelope, FieldPlacement } from '@/lib/sign/types'
import { isEnvelopeLocked, linesForSigner, mergeSignatureFields, needsCompletedPdf, newLineId, placementAtPointer, signersWithoutLine, snapPlacementXY, type PageRect } from '@/lib/sign/placement'
import PdfScrollViewer from './PdfScrollViewer'
import SignatureLineBox from './SignatureLineBox'
import SignSteps from './SignSteps'

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
  // Start placing for the first signer without a line. A document whose lines are
  // all placed opens out of place mode, so a stray click cannot move a line.
  const [placeSignerId, setPlaceSignerId] = useState<string | null>(
    initial.status === 'draft' ? signersWithoutLine(initial)[0]?.id || null : null,
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
  // Edits not yet saved (placements, signers, title). Leaving asks first.
  const [dirty, setDirty] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Sending was refused for the customer's plan (none, unpaid, or over the month's limit).
  const [needsPlan, setNeedsPlan] = useState(false)

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
  const autoCompleteAttemptedRef = useRef(false)
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

  useEffect(() => {
    autoCompleteAttemptedRef.current = false
  }, [envelope.id])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // If all signed but completed PDF missing (flaky after()), POST /complete once.
  useEffect(() => {
    if (!needsCompletedPdf(envelope)) return
    if (autoCompleteAttemptedRef.current) return
    autoCompleteAttemptedRef.current = true
    const id = envelope.id
    void (async () => {
      try {
        const res = await fetch(`/api/sign/envelopes/${id}/complete`, { method: 'POST' })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok || !data.envelope) return
        const env = data.envelope as Envelope
        setEnvelope((prev) => {
          const mergedSigners = env.signers.map((s) => {
            const loc = prev.signers.find((l) => l.id === s.id)
            if (s.status === 'signed') return s
            if (loc?.status === 'signed') return loc
            return s
          })
          const next = {
            ...env,
            signers: mergedSigners,
            completedPdfKey: env.completedPdfKey || prev.completedPdfKey,
            status:
              env.status === 'completed' || prev.status === 'completed'
                ? ('completed' as const)
                : env.status,
          }
          envelopeRef.current = next
          return next
        })
        setSigners(draftFromEnvelope(env))
        if (env.completedPdfKey) {
          setMessage('The signed PDF is ready.')
        }
      } catch {
        /* manual Generate remains as backup */
      }
    })()
  }, [envelope])

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
    setDirty(true)
  }

  function removeLine(fieldId: string) {
    if (isEnvelopeLocked(envelopeRef.current.status)) return
    const next = fieldsRef.current.filter((f) => f.id !== fieldId)
    fieldsEpochRef.current += 1
    fieldsRef.current = next
    setFields(next)
    setDirty(true)
    if (activeFieldId === fieldId) setActiveFieldId(null)
  }

  function removeSignerRow(idx: number) {
    if (isEnvelopeLocked(envelopeRef.current.status)) return
    const target = signers[idx]
    setSigners((prev) => prev.filter((_, i) => i !== idx))
    setDirty(true)
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
        setError('Every signer needs a name and an email.')
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
            pageCount: envelopeRef.current.pageCount,
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
          // Keep the coords we just sent — server merge/snap must not walk boxes around.
          setFields(queuedFields.filter((f) => f.type === 'signature'))
          fieldsRef.current = queuedFields.filter((f) => f.type === 'signature')
        }
        signersRef.current = draftFromEnvelope(env)
        // Keep placing for the same signer; otherwise move on to whoever (a newly
        // saved signer, say) still has no line.
        const keepPlace =
          placeSignerIdRef.current &&
          env.signers.some((s) => s.id === placeSignerIdRef.current)
            ? placeSignerIdRef.current
            : signersWithoutLine({ signers: env.signers, fields: fieldsRef.current })[0]?.id ||
              null
        setPlaceSignerId(keepPlace)
        if (!fieldsStale) setDirty(false)
        setMessage('Draft saved.')
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
        setNeedsPlan(Boolean(data?.needsPlan))
        return
      }
      setNeedsPlan(false)
      const sentEnv = data.envelope as Envelope
      // Never let a stale send snapshot wipe admin-signed parties.
      const local = envelopeRef.current
      const mergedSigners = sentEnv.signers.map((s) => {
        const loc = local.signers.find((l) => l.id === s.id)
        if (s.status === 'signed') return s
        if (loc?.status === 'signed') return loc
        return s
      })
      const protectedEnv: Envelope = {
        ...sentEnv,
        signers: mergedSigners,
        status:
          local.status === 'completed' || sentEnv.status === 'completed'
            ? 'completed'
            : sentEnv.status === 'sent' || local.status === 'sent'
              ? 'sent'
              : sentEnv.status,
        completedPdfKey: sentEnv.completedPdfKey || local.completedPdfKey,
      }
      setEnvelope(protectedEnv)
      envelopeRef.current = protectedEnv
      setSigners(draftFromEnvelope(protectedEnv))
      // Drop any in-flight draft autosaves so they cannot unlock the editor.
      saveGenRef.current += 1
      setDirty(false)
      setPlaceSignerId(null)
      setMessage(
        data.emailed
          ? 'Sent. Everyone who still has to sign has an email with their own link.'
          : data.notice || 'Open for signing. Copy each signing link below and send it.',
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
    if (!placeSignerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const width = PLACE_WIDTH
    const height = PLACE_HEIGHT
    const peers = fieldsRef.current
      .filter((f) => f.type === 'signature' && f.signerId !== placeSignerId)
      .map((f) => ({ x: f.x, y: f.y }))
    const snapped = snapPlacementXY(x - width / 2, y - height / 2, width, height, peers)
    // Each click adds a line: a signer can sign in several places.
    const nextField: FieldPlacement = {
      id: newLineId(placeSignerId),
      type: 'signature',
      signerId: placeSignerId,
      page: pageNum,
      x: snapped.x,
      y: snapped.y,
      width,
      height,
    }
    const nextFields = [...fieldsRef.current, nextField]
    fieldsEpochRef.current += 1
    fieldsRef.current = nextFields
    setFields(nextFields)
    setPage(pageNum)
    setDirty(true)
    setError('')
    // Move straight on to the next signer still without a line.
    const nextMissing = signersRef.current.find(
      (s) => s.id && s.id !== placeSignerId && !nextFields.some((f) => f.signerId === s.id),
    )
    setPlaceSignerId(nextMissing?.id || null)
    setMessage(
      nextMissing
        ? `${signerLabel(placeSignerId)}’s line is on page ${pageNum}. Now click where ${nextMissing.name} signs.`
        : `${signerLabel(placeSignerId)}’s line is on page ${pageNum}. Everyone has a line. Use Add a line if someone signs in more than one place.`,
    )
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
    setMessage('')
    window.setTimeout(() => {
      document.getElementById('sign-in-person')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
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
      // Follow the pointer live — snap only on drop so the box isn't glued to an edge.
      const mapped = prev.map((f) =>
        f.id === drag.id
          ? { ...f, page: next.page, x: next.x, y: next.y }
          : f,
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
      const movedIdx = current.findIndex((f) => f.id === field.id)
      if (movedIdx >= 0) {
        const moved = current[movedIdx]!
        const peers = current
          .filter((f) => f.id !== moved.id && f.type === 'signature')
          .map((f) => ({ x: f.x, y: f.y }))
        const snapped = snapPlacementXY(moved.x, moved.y, moved.width, moved.height, peers)
        current[movedIdx] = { ...moved, x: snapped.x, y: snapped.y }
        fieldsEpochRef.current += 1
        fieldsRef.current = current
        setFields(current)
        setPage(current[movedIdx]!.page)
        setDirty(true)
      }
      setMessage('')
      return
    }
    // A click (no drag) on a draft's line only selects it; signing in person is
    // the signer row's "Sign now", so a stray click cannot open the document for signing.
    if (isEnvelopeLocked(envelopeRef.current.status)) openSignBox(field)
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
    // Local bump only — do not setEnvelope(full PATCH) (that remounted/raced signed state).
    setEnvelope((prev) => ({ ...prev, pageCount: total }))
    envelopeRef.current = { ...envelopeRef.current, pageCount: total }
  }

  async function saveSignature() {
    if (!activeFieldId) return
    const field = fieldsRef.current.find((f) => f.id === activeFieldId) || fields.find((f) => f.id === activeFieldId)
    if (!field) return
    const signer = envelopeRef.current.signers.find((s) => s.id === field.signerId)
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
    let env = envelopeRef.current
    if (env.status === 'draft') {
      const saved = await save()
      if (!saved) return
      setBusy(true)
      const sendRes = await fetch(`/api/sign/envelopes/${envelopeRef.current.id}/send`, {
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
      envelopeRef.current = env
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
        // In person, the one signature goes on every one of this signer's lines.
        body: JSON.stringify({
          typedName: name,
          signaturePng,
          signedFieldIds: linesForSigner(env, live.id).map((f) => f.id),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        // Keep Save signature panel + fields on failure.
        setError(data?.error || 'Could not save signature.')
        return
      }

      const signedAt = new Date().toISOString()
      const signedDateText = new Date(signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      // Optimistic: mark this signer signed so admin shows Signed even if refresh/poll lags
      // (Provider-as-2nd returns completing:true before status flips to completed).
      const optimistic: Envelope = {
        ...envelopeRef.current,
        updatedAt: signedAt,
        status:
          data.completed || data.completing
            ? 'completed'
            : envelopeRef.current.status === 'draft'
              ? 'sent'
              : envelopeRef.current.status,
        signers: envelopeRef.current.signers.map((s) =>
          s.id === live.id
            ? {
                ...s,
                status: 'signed' as const,
                signedAt,
                signedDateText,
                name: name || s.name,
                signaturePng,
              }
            : s,
        ),
      }
      if (
        (data.completed || data.completing) &&
        optimistic.signers.every((s) => s.status === 'signed')
      ) {
        optimistic.status = 'completed'
      }
      setEnvelope(optimistic)
      envelopeRef.current = optimistic
      setSigners(draftFromEnvelope(optimistic))

      // Refresh full envelope for admin view — never blank fields from a partial snapshot.
      const refresh = await fetch(`/api/sign/envelopes/${envelopeRef.current.id}`, {
        cache: 'no-store',
      })
      const refreshed = await refresh.json().catch(() => null)
      if (refreshed?.ok && refreshed.envelope) {
        const remote = refreshed.envelope as Envelope
        const mergedSigners = remote.signers.map((s) => {
          const loc = optimistic.signers.find((l) => l.id === s.id)
          if (s.status === 'signed') return s
          if (loc?.status === 'signed') return loc
          return s
        })
        const pageCount = Math.max(
          optimistic.pageCount || 0,
          remote.pageCount || 0,
          1,
        )
        const preferredFields = mergeSignatureFields(
          fieldsRef.current.length ? fieldsRef.current : optimistic.fields,
          remote.fields,
          mergedSigners,
          pageCount,
        )
        const merged: Envelope = {
          ...remote,
          signers: mergedSigners,
          status:
            remote.status === 'completed' || optimistic.status === 'completed'
              ? 'completed'
              : remote.status,
          completedPdfKey: remote.completedPdfKey || optimistic.completedPdfKey,
          fields: preferredFields.length > 0 ? preferredFields : optimistic.fields,
        }
        setEnvelope(merged)
        envelopeRef.current = merged
        setSigners(draftFromEnvelope(merged))
        if (preferredFields.length > 0) {
          setFields(preferredFields)
          fieldsRef.current = preferredFields
        }
      }

      // Clear panel only on success.
      setActiveFieldId(null)
      setTypedName('')
      setMessage(
        data.completed || data.completing
          ? 'Everyone has signed. The signed PDF is ready.'
          : `${name} has signed.`,
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
      setMessage('The signed PDF is ready.')
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


  function signingLink(token: string): string {
    return `${window.location.origin}/sign/s/${token}`
  }

  async function copyLink(signerId: string, token: string) {
    try {
      await navigator.clipboard.writeText(signingLink(token))
      setCopiedId(signerId)
      window.setTimeout(() => setCopiedId((id) => (id === signerId ? null : id)), 2000)
    } catch {
      setError('Could not copy. Select the link and copy it by hand.')
    }
  }

  function updateSigner(idx: number, patch: Partial<SignerDraft>) {
    const next = [...signers]
    next[idx] = { ...next[idx], ...patch }
    setSigners(next)
    setDirty(true)
  }

  const completed = envelope.status === 'completed'
  // Signers still without a line: unsaved new rows count, as they cannot be placed yet.
  const missingLine = signers.filter(
    (s) => !s.id || !fields.some((f) => f.type === 'signature' && f.signerId === s.id),
  )
  const unsavedSigner = signers.find((s) => !s.id)
  const waiting = envelope.signers.filter((s) => s.status !== 'signed')
  const emailedBefore = envelope.audit.some(
    (a) => a.action === 'sent' && /:emailed/.test(a.detail || ''),
  )
  const step = completed ? 3 : locked ? 3 : missingLine.length ? 1 : 2
  const placingName = placeSignerId ? signerLabel(placeSignerId) : ''
  const signedPdfHref = `/api/sign/envelopes/${envelope.id}/pdf?which=completed`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/sign/dashboard" className="btn-ghost-sm">
            ← Documents
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{envelope.title}</h1>
          <div className="mt-3">
            <SignSteps current={step} allDone={completed} />
          </div>
        </div>
        {!locked ? (
          <div className="flex items-center gap-3">
            {dirty ? <span className="text-xs font-medium text-warm">Unsaved changes</span> : null}
            <button
              type="button"
              disabled={busy || !dirty}
              onClick={() => save()}
              className="btn-ghost !min-h-10 !px-4 !py-2 !text-sm"
            >
              {dirty ? 'Save draft' : 'Draft saved'}
            </button>
          </div>
        ) : null}
      </div>

      {message ? (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-warm">
          {error}{' '}
          {needsPlan ? (
            <Link href="/sign/account" className="font-medium text-accent hover:underline">
              Choose a plan
            </Link>
          ) : null}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          {/* The one next step, with the one button that takes it. */}
          <div className="tile space-y-3 border-2 border-accent/30 p-4">
            {completed ? (
              <>
                <h2 className="text-base font-semibold text-ink">Signed by everyone</h2>
                <p className="text-sm text-body">
                  The signed PDF has every signature and date stamped on it.
                </p>
                {envelope.completedPdfKey ? (
                  <a
                    href={signedPdfHref}
                    className="btn-primary w-full"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download signed PDF
                  </a>
                ) : null}
              </>
            ) : needsCompletedPdf(envelope) ? (
              <>
                <h2 className="text-base font-semibold text-ink">Everyone has signed</h2>
                <p className="text-sm text-body">The signed PDF has not been made yet.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void generateCompletedPdf()}
                  className="btn-primary w-full"
                >
                  {busy ? 'Making it…' : 'Make the signed PDF'}
                </button>
              </>
            ) : locked ? (
              <>
                <h2 className="text-base font-semibold text-ink">
                  Waiting for {waiting.map((s) => s.name).join(' and ')}
                </h2>
                <p className="text-sm text-body">
                  The document is locked so everyone signs the same version. Each person signs with
                  their own link.
                </p>
                <button
                  type="button"
                  disabled={busy || waiting.length === 0}
                  onClick={send}
                  className={emailedBefore ? 'btn-ghost w-full !min-h-11 !text-sm' : 'btn-primary w-full'}
                >
                  {busy ? 'Sending…' : emailedBefore ? 'Email the links again' : 'Email the links'}
                </button>
              </>
            ) : unsavedSigner ? (
              <>
                <h2 className="text-base font-semibold text-ink">Save the new signer</h2>
                <p className="text-sm text-body">
                  Give {unsavedSigner.name || 'the new signer'} a name and email, then save the draft to
                  place their line.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => save()}
                  className="btn-primary w-full"
                >
                  Save draft
                </button>
              </>
            ) : placeSignerId ? (
              <>
                <h2 className="text-base font-semibold text-ink">
                  Place {placingName}’s signature line
                </h2>
                <p className="text-sm text-body">
                  Click on the document where {placingName} signs. Drag the line to adjust it.
                </p>
                <p className="text-xs text-muted">
                  The line is see-through: anything showing under it is printed under the signature.
                </p>
              </>
            ) : missingLine.length ? (
              <>
                <h2 className="text-base font-semibold text-ink">Place the signature lines</h2>
                <p className="text-sm text-body">
                  {missingLine.map((s) => s.name).join(' and ')} still{' '}
                  {missingLine.length === 1 ? 'needs' : 'need'} a line.
                </p>
                <button
                  type="button"
                  onClick={() => setPlaceSignerId(missingLine[0]?.id || null)}
                  className="btn-primary w-full"
                >
                  Place {missingLine[0]?.name}’s line
                </button>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-ink">Ready to send</h2>
                <p className="text-sm text-body">
                  Each signer gets an email with their own link. Once it is sent the document is
                  locked, so check the lines first.
                </p>
                <button type="button" disabled={busy} onClick={send} className="btn-primary w-full">
                  {busy ? 'Sending…' : 'Send for signing'}
                </button>
              </>
            )}
          </div>

          {activeFieldId ? (
            <div id="sign-in-person" className="tile space-y-3 border-2 border-accent p-4">
              <h2 className="text-sm font-semibold text-ink">
                Sign now as {signerLabel(fields.find((f) => f.id === activeFieldId)?.signerId || '')}
              </h2>
              <p className="text-xs text-muted">
                For signing in person on this computer. Type the full name.
              </p>
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
                {busy ? 'Signing…' : 'Sign'}
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

          <div className="tile space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Signers</h2>
              {!locked ? (
                <button type="button" onClick={addSignerRow} className="btn-ghost-sm">
                  + Add signer
                </button>
              ) : null}
            </div>
            {signers.map((s, idx) => {
              const live = s.id ? envelope.signers.find((x) => x.id === s.id) : undefined
              const lines = s.id ? linesForSigner({ fields }, s.id) : []
              const line = lines[0]
              const signed = live?.status === 'signed'
              return (
                <div key={s.id || `new-${idx}`} className="space-y-2 rounded-xl border border-line p-3">
                  {locked ? (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{s.name}</div>
                      <div className="truncate text-xs text-muted">
                        {s.role} · {s.email}
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        aria-label="Name"
                        placeholder="Full name"
                        value={s.name}
                        onChange={(e) => updateSigner(idx, { name: e.target.value })}
                        className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                      />
                      <input
                        aria-label="Role"
                        placeholder="Role (e.g. Client)"
                        value={s.role}
                        onChange={(e) => updateSigner(idx, { role: e.target.value })}
                        className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                      />
                      <input
                        aria-label="Email"
                        placeholder="Email"
                        type="email"
                        value={s.email}
                        onChange={(e) => updateSigner(idx, { email: e.target.value })}
                        className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                      />
                    </>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {signed ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                        Signed
                      </span>
                    ) : locked ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-accent">
                        Waiting
                      </span>
                    ) : line ? (
                      <span className="text-xs text-muted">
                        {lines.length === 1
                          ? `Line on page ${line.page}`
                          : `${lines.length} lines: page ${lines.map((f) => f.page).join(', ')}`}
                      </span>
                    ) : s.id ? (
                      <span className="text-xs font-medium text-warm">No line yet</span>
                    ) : (
                      <span className="text-xs text-muted">Save the draft to place their line</span>
                    )}
                    {!locked && s.id ? (
                      <button
                        type="button"
                        className={`btn-ghost-sm ${placeSignerId === s.id ? 'is-active' : ''}`}
                        onClick={() => setPlaceSignerId(placeSignerId === s.id ? null : s.id!)}
                      >
                        {placeSignerId === s.id ? 'Placing…' : line ? 'Add a line' : 'Place line'}
                      </button>
                    ) : null}
                    {!signed && !completed && line && live ? (
                      <button type="button" className="btn-ghost-sm" onClick={() => openSignBox(line)}>
                        Sign now
                      </button>
                    ) : null}
                    {signers.length > 1 && !locked ? (
                      <button
                        type="button"
                        className="btn-danger-sm ml-auto"
                        onClick={() => removeSignerRow(idx)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  {locked && live && !signed ? (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        aria-label={`Signing link for ${live.name}`}
                        value={signingLink(live.token)}
                        onFocus={(e) => e.currentTarget.select()}
                        className="min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs text-body"
                      />
                      <button
                        type="button"
                        className="btn-ghost-sm shrink-0"
                        onClick={() => void copyLink(live.id, live.token)}
                      >
                        {copiedId === live.id ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="tile p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Document title</span>
              {locked ? (
                <span className="block text-ink">{title}</span>
              ) : (
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setDirty(true)
                  }}
                  className="w-full rounded-xl border border-line px-3 py-2 text-ink outline-none focus:border-accent"
                />
              )}
            </label>
          </div>

          <details className="tile p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">History</summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-muted">
              {envelope.audit.map((a, i) => (
                <li key={`${a.at}-${i}`}>
                  {new Date(a.at).toLocaleString()} — {a.action} — {a.actor}
                  {a.detail ? ` — ${a.detail}` : ''}
                </li>
              ))}
            </ul>
          </details>

          <button
            type="button"
            disabled={busy}
            onClick={removeDoc}
            className="btn-danger-sm"
          >
            Delete document
          </button>
        </div>

        <div className="tile max-h-[78vh] overflow-auto p-3">
          <div className="sticky top-0 z-20 -mx-3 -mt-3 mb-3 flex min-h-11 flex-wrap items-center gap-2 border-b border-line bg-surface/95 px-3 py-2 text-sm backdrop-blur">
            {placeSignerId && !locked ? (
              <>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white">
                  Click where {placingName} signs
                </span>
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={() => setPlaceSignerId(null)}
                >
                  Stop placing
                </button>
              </>
            ) : (
              <span className="text-xs text-muted">
                {completed
                  ? 'Signed by everyone.'
                  : locked
                    ? 'Locked for signing. Click a line to sign it in person.'
                    : 'Drag a line to move it.'}
              </span>
            )}
          </div>
          <PdfScrollViewer
            key={pdfUrl}
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
                    <Fragment key={f.id}>
                    <button
                      type="button"
                      data-field-id={f.id}
                      aria-label={`${signerRole(f.signerId)} signature line for ${live?.name || signerLabel(f.signerId)}`}
                      onPointerDown={(e) => onFieldPointerDown(e, f)}
                      onPointerUp={(e) => onFieldPointerUp(e, f)}
                      className={`pointer-events-auto absolute z-[5] touch-none overflow-hidden rounded-md border-2 text-left ${
                        draggingId === f.id
                          ? 'border-accent cursor-grabbing z-10'
                          : activeFieldId === f.id
                            ? 'border-accent cursor-pointer ring-2 ring-accent/30'
                            : signed
                              ? 'border-emerald-600 cursor-default'
                              : completed
                                ? 'border-line cursor-default'
                                : locked
                                  ? 'border-accent cursor-pointer hover:ring-2 hover:ring-accent/20'
                                  : 'border-accent cursor-grab hover:ring-2 hover:ring-accent/20'
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
                        hint={
                          locked
                            ? `${live?.name || 'Signer'} signs here`
                            : `${live?.name || signerLabel(f.signerId)} · drag to move`
                        }
                      />
                    </button>
                    {!locked ? (
                      <button
                        type="button"
                        data-field-id={f.id}
                        aria-label={`Remove this line for ${live?.name || signerLabel(f.signerId)}`}
                        title="Remove this line"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => removeLine(f.id)}
                        className="absolute z-[11] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-sm leading-none text-body shadow-sm hover:text-warm"
                        style={{ left: `${(f.x + f.width) * 100}%`, top: `${f.y * 100}%` }}
                      >
                        ×
                      </button>
                    ) : null}
                    </Fragment>
                  )
                })
            }
          />
        </div>
      </div>
    </div>
  )
}
