import type { Envelope, EnvelopeStatus, FieldPlacement, Signer } from './types'

const STATUS_RANK: Record<EnvelopeStatus, number> = {
  draft: 0,
  sent: 1,
  completed: 2,
}

/** True once magic links / open-for-signing — placements, signers, and title must not change. */
export function isEnvelopeLocked(status: EnvelopeStatus): boolean {
  return status === 'sent' || status === 'completed'
}

export type EnvelopePatchBody = {
  title?: unknown
  signers?: unknown
  fields?: unknown
  pageCount?: unknown
}

/**
 * If the envelope is locked and the PATCH tries to change title/signers/fields,
 * return a clear 400 message. pageCount-only bumps are allowed.
 */
export function lockedEnvelopeStructuralError(
  status: EnvelopeStatus,
  body: EnvelopePatchBody,
): string | null {
  if (!isEnvelopeLocked(status)) return null
  const wantsTitle = typeof body.title === 'string'
  const wantsSigners = Array.isArray(body.signers)
  const wantsFields = Array.isArray(body.fields)
  if (wantsTitle || wantsSigners || wantsFields) {
    return 'Locked for signing — placements, signers, and title can’t be edited.'
  }
  return null
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

/**
 * Default signature box: page 1 near the top, stacked by slot
 * (0 = Client upper, 1 = Provider below, …). Avoids last-page bottom defaults.
 */
export function defaultSignatureField(signerId: string, slot = 0): FieldPlacement {
  const height = 0.12
  const width = 0.38
  // Alternate left/right columns so Client + Provider never share one mashed stack.
  const col = slot % 2
  const row = Math.floor(slot / 2)
  const x = col === 0 ? 0.08 : 0.54
  const y = Math.min(0.1 + row * 0.16, 0.72)
  return {
    id: `fld_${signerId}_sig`,
    type: 'signature',
    signerId,
    page: 1,
    x,
    y,
    width,
    height,
  }
}

/**
 * Highest page index mentioned in raw field payloads (ignores invalid pages).
 * Used to expand a stale/wrong envelope.pageCount before sanitize.
 */
export function maxPageInRawFields(rawFields: unknown[]): number {
  let max = 0
  for (const raw of rawFields) {
    if (!raw || typeof raw !== 'object') continue
    const page = Math.round(Number((raw as Record<string, unknown>).page))
    if (Number.isFinite(page) && page >= 1) max = Math.max(max, page)
  }
  return max
}

export type PageRect = {
  page: number
  left: number
  top: number
  width: number
  height: number
}

/**
 * Map a pointer to page-local fractional coords (origin top-left).
 * Prefers the page whose rect contains the point; otherwise nearest by vertical center.
 */
export function placementAtPointer(
  clientX: number,
  clientY: number,
  pages: PageRect[],
  boxWidth: number,
  boxHeight: number,
  grabOffsetX = boxWidth / 2,
  grabOffsetY = boxHeight / 2,
): { page: number; x: number; y: number } | null {
  if (!pages.length) return null
  const containing = pages.filter(
    (p) =>
      p.width > 0 &&
      p.height > 0 &&
      clientX >= p.left &&
      clientX <= p.left + p.width &&
      clientY >= p.top &&
      clientY <= p.top + p.height,
  )
  let target: PageRect
  if (containing.length) {
    // Prefer the topmost match if overlays overlap.
    target = containing.reduce((a, b) => (a.page <= b.page ? a : b))
  } else {
    target = pages.reduce((best, p) => {
      const bestMid = best.top + best.height / 2
      const mid = p.top + p.height / 2
      return Math.abs(clientY - mid) < Math.abs(clientY - bestMid) ? p : best
    })
  }
  if (target.width <= 0 || target.height <= 0) return null
  const x = clamp((clientX - target.left) / target.width - grabOffsetX, 0, Math.max(0, 1 - boxWidth))
  const y = clamp((clientY - target.top) / target.height - grabOffsetY, 0, Math.max(0, 1 - boxHeight))
  return { page: target.page, x, y }
}

/** Coerce coords so custom placements survive JSON quirks; never drop valid boxes. */
export function sanitizeField(
  raw: unknown,
  signerIds: Set<string>,
  pageCount: number,
): FieldPlacement | null {
  if (!raw || typeof raw !== 'object') return null
  const f = raw as Record<string, unknown>
  const id = typeof f.id === 'string' ? f.id : ''
  const type = f.type === 'signature' || f.type === 'date' ? f.type : null
  const signerId = typeof f.signerId === 'string' ? f.signerId : ''
  if (!id || !type || !signerId || !signerIds.has(signerId)) return null

  const page = Math.round(Number(f.page))
  // Reject only page < 1 (and absurd pages). Do NOT drop page > stored pageCount —
  // a stale/wrong envelope.pageCount (e.g. 1 while the PDF has 3 pages) must not
  // erase last-page placements. Callers should bump pageCount with maxPageInRawFields.
  if (!Number.isFinite(page) || page < 1) return null
  const softMax = Math.max(pageCount || 0, 1) + 100
  if (page > softMax) return null

  const width = clamp(Number(f.width), 0.05, 1)
  const height = clamp(Number(f.height), 0.03, 1)
  const x = clamp(Number(f.x), 0, Math.max(0, 1 - width))
  const y = clamp(Number(f.y), 0, Math.max(0, 1 - height))
  if (![width, height, x, y].every(Number.isFinite)) return null

  return { id, type, signerId, page, x, y, width, height }
}

/** Place-mode boxes use 0.42×0.11; factory defaults use 0.38×0.12. */
export function hasDefaultSignatureSize(f: Pick<FieldPlacement, 'width' | 'height'>): boolean {
  return Math.abs(f.width - 0.38) < 0.02 && Math.abs(f.height - 0.12) < 0.02
}

export function hasPlacedSignatureSize(f: Pick<FieldPlacement, 'width' | 'height'>): boolean {
  return Math.abs(f.width - 0.42) < 0.02 && Math.abs(f.height - 0.11) < 0.02
}

/** True when field matches current defaults or older default layouts. */
export function isDefaultishPlacement(
  f: FieldPlacement,
  slot: number,
  pageCount: number,
): boolean {
  const d = defaultSignatureField(f.signerId, slot)
  if (
    f.page === d.page &&
    Math.abs(f.x - d.x) < 0.03 &&
    Math.abs(f.y - d.y) < 0.03
  ) {
    return true
  }
  // Prior stacked page-1 defaults (same column, y = 0.08 + slot*0.13) before side-by-side columns.
  if (f.page === 1) {
    const stackedY = Math.min(0.08 + slot * 0.13, 0.7)
    if (Math.abs(f.x - 0.12) < 0.03 && Math.abs(f.y - stackedY) < 0.03) {
      return true
    }
  }
  // Legacy defaults (pre-fix): last page, y near 0.68 + slot*0.13
  if (pageCount > 0) {
    const legacyY = Math.min(0.68 + slot * 0.13, 0.86)
    if (
      f.page === pageCount &&
      Math.abs(f.x - 0.12) < 0.03 &&
      Math.abs(f.y - legacyY) < 0.03
    ) {
      return true
    }
  }
  // Dragged factory default still on page 1 (default w/h) — treat as defaultish so a
  // stale autosave cannot overwrite a real Place-box on page 2+.
  if (f.page === 1 && hasDefaultSignatureSize(f)) {
    return true
  }
  return false
}

/**
 * Prefer a clearly custom placement over a stale/defaultish one during merge.
 * Live bug: Client Place (0.42×0.11 page 3) survived while Provider was replaced by a
 * dragged page-1 default (0.38×0.12) because mid-page coords were not "defaultish".
 */
export function shouldKeepPreviousField(
  previous: FieldPlacement,
  incoming: FieldPlacement,
  slot: number,
  pageCount: number,
): boolean {
  if (
    isDefaultishPlacement(incoming, slot, pageCount) &&
    !isDefaultishPlacement(previous, slot, pageCount)
  ) {
    return true
  }
  // Placed size on a later page beats default-sized page-1 leftovers.
  if (
    previous.page > 1 &&
    incoming.page === 1 &&
    hasPlacedSignatureSize(previous) &&
    hasDefaultSignatureSize(incoming)
  ) {
    return true
  }
  // Any non-page-1 placement beats a page-1 default-sized box.
  if (
    previous.page > 1 &&
    incoming.page === 1 &&
    hasDefaultSignatureSize(incoming) &&
    !hasDefaultSignatureSize(previous)
  ) {
    return true
  }
  return false
}

export function mergeSigner(incoming: Signer, previous: Signer | undefined): Signer {
  if (!previous) return incoming
  // First successful signature wins — never allow a second sign / stale write to replace it.
  if (previous.status === 'signed') {
    return {
      ...incoming,
      token: previous.token,
      status: 'signed',
      signedAt: previous.signedAt,
      signaturePng: previous.signaturePng,
      signedDateText: previous.signedDateText,
      name: incoming.name || previous.name,
      email: incoming.email || previous.email,
      role: incoming.role || previous.role,
    }
  }
  if (incoming.status === 'signed') {
    return { ...incoming, token: incoming.token || previous.token }
  }
  return {
    ...incoming,
    token: incoming.token || previous.token,
  }
}

function mergeAudit(
  a: Envelope['audit'],
  b: Envelope['audit'],
): Envelope['audit'] {
  const key = (e: (typeof a)[number]) => `${e.at}|${e.action}|${e.actor}|${e.detail || ''}`
  const map = new Map<string, (typeof a)[number]>()
  for (const e of [...a, ...b]) map.set(key(e), e)
  return Array.from(map.values()).sort((x, y) => x.at.localeCompare(y.at))
}

/**
 * Merge field arrays so a stale save that reintroduces a defaultish Provider/Client
 * box cannot snap a custom placement back.
 */
export function mergeFields(
  previous: FieldPlacement[],
  incoming: FieldPlacement[],
  signerIndex: Map<string, number>,
  pageCount: number,
  allowIncoming: boolean,
): FieldPlacement[] {
  const fieldMap = new Map<string, FieldPlacement>()
  for (const f of previous) {
    if (f.type === 'signature') fieldMap.set(f.signerId, f)
    else fieldMap.set(`${f.type}:${f.signerId}:${f.id}`, f)
  }
  if (allowIncoming) {
    for (const f of incoming) {
      if (f.type === 'signature') {
        const prev = fieldMap.get(f.signerId)
        const slot = signerIndex.get(f.signerId) ?? 0
        if (prev && shouldKeepPreviousField(prev, f, slot, pageCount)) {
          continue
        }
        fieldMap.set(f.signerId, f)
      } else {
        fieldMap.set(`${f.type}:${f.signerId}:${f.id}`, f)
      }
    }
  }
  return Array.from(fieldMap.values())
}

/**
 * Merge a write with whatever is already stored so concurrent auto-saves cannot:
 * - regress status (draft ← sent ← completed)
 * - wipe signatures / completed PDF
 * - replace newer placements with a stale fields array after signing progressed
 */
export function mergeEnvelope(incoming: Envelope, previous: Envelope | null): Envelope {
  if (!previous) return incoming

  const status =
    STATUS_RANK[previous.status] > STATUS_RANK[incoming.status]
      ? previous.status
      : incoming.status

  const completedPdfKey =
    incoming.completedPdfKey || previous.completedPdfKey || undefined

  const prevById = new Map(previous.signers.map((s) => [s.id, s]))
  const signers: Signer[] = incoming.signers.map((s) => mergeSigner(s, prevById.get(s.id)))
  for (const prev of previous.signers) {
    if (!signers.some((s) => s.id === prev.id)) signers.push(prev)
  }

  const signerIndex = new Map(incoming.signers.map((s, i) => [s.id, i]))
  for (const [i, s] of previous.signers.entries()) {
    if (!signerIndex.has(s.id)) signerIndex.set(s.id, i)
  }

  const basePageCount = Math.max(previous.pageCount || 0, incoming.pageCount || 0)
  const allowIncoming = STATUS_RANK[previous.status] <= STATUS_RANK[incoming.status]
  const fields = mergeFields(
    previous.fields,
    incoming.fields,
    signerIndex,
    basePageCount || 1,
    allowIncoming,
  )
  const maxFieldPage = fields.reduce((m, f) => Math.max(m, f.page || 0), 0)
  const pageCount = Math.max(basePageCount, maxFieldPage)

  const audit = mergeAudit(previous.audit || [], incoming.audit || [])
  const updatedAt =
    incoming.updatedAt > previous.updatedAt ? incoming.updatedAt : previous.updatedAt

  return {
    ...incoming,
    status,
    completedPdfKey,
    signers,
    fields,
    pageCount,
    audit,
    updatedAt,
  }
}


/** Real signed day for overlays/stamps; null when the party has not signed. */
export function formatSignedDateText(
  signer: Pick<Signer, 'status' | 'signedAt' | 'signedDateText'>,
): string | null {
  if (signer.status !== 'signed') return null
  const explicit = signer.signedDateText?.trim()
  if (explicit) return explicit
  if (signer.signedAt) {
    return new Date(signer.signedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  return null
}

/**
 * Auto-layout: date sits to the right of the signature box on the same row.
 * Fractions of page width/height (origin top-left), matching FieldPlacement.
 */
export function dateOverlayBesideSignature(field: FieldPlacement): {
  x: number
  y: number
  width: number
  height: number
} {
  const gap = 0.02
  const width = 0.2
  const x = Math.min(field.x + field.width + gap, Math.max(0, 1 - width))
  return { x, y: field.y, width, height: field.height }
}

/** Public view for a magic-link signer: all signature boxes + parties (no PNGs). */
export function signerPublicView(envelope: Envelope, signerId: string) {
  const signer = envelope.signers.find((s) => s.id === signerId)
  if (!signer) return null
  return {
    envelopeId: envelope.id,
    title: envelope.title,
    status: envelope.status,
    pageCount: envelope.pageCount,
    signer: {
      id: signer.id,
      name: signer.name,
      email: signer.email,
      role: signer.role || 'Signer',
      status: signer.status,
      signedAt: signer.signedAt,
      signedDateText: formatSignedDateText(signer) || undefined,
    },
    parties: envelope.signers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role || 'Signer',
      status: s.status,
      signedAt: s.signedAt,
      signedDateText: formatSignedDateText(s) || undefined,
    })),
    fields: envelope.fields.filter((f) => f.type === 'signature'),
    allSigned: envelope.signers.every((s) => s.status === 'signed'),
  }
}
