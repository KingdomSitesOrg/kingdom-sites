import { promises as fs } from 'fs'
import path from 'path'
import { put, list, del, get } from '@vercel/blob'
import type { Envelope, EnvelopeStatus, EnvelopeSummary, FieldPlacement, Signer } from './types'
import { defaultSignatureField } from './pdf'

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'sign')

const STATUS_RANK: Record<EnvelopeStatus, number> = {
  draft: 0,
  sent: 1,
  completed: 2,
}


/**
 * Merge a write with whatever is already stored so concurrent auto-saves cannot:
 * - regress status (draft ← sent ← completed)
 * - wipe signatures / completed PDF
 * - replace newer placements with a stale fields array after signing progressed
 */
function mergeAudit(
  a: Envelope['audit'],
  b: Envelope['audit'],
): Envelope['audit'] {
  const key = (e: (typeof a)[number]) => `${e.at}|${e.action}|${e.actor}|${e.detail || ''}`
  const map = new Map<string, (typeof a)[number]>()
  for (const e of [...a, ...b]) map.set(key(e), e)
  return Array.from(map.values()).sort((x, y) => x.at.localeCompare(y.at))
}

function mergeSigner(incoming: Signer, previous: Signer | undefined): Signer {
  if (!previous) return incoming
  // First successful signature wins — never allow a second sign to replace it.
  if (previous.status === 'signed') {
    return {
      ...incoming,
      token: previous.token,
      status: 'signed',
      signedAt: previous.signedAt,
      signaturePng: previous.signaturePng,
      signedDateText: previous.signedDateText,
      // Allow admin name/role/email edits on top of a locked signature
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

function mergeEnvelope(incoming: Envelope, previous: Envelope | null): Envelope {
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

  // Fields: keep previous placements; overlay incoming unless incoming looks like a
  // bottom default replacing a custom placement (stale Client save vs Provider place).
  const signerIndex = new Map(incoming.signers.map((s, i) => [s.id, i]))
  for (const [i, s] of previous.signers.entries()) {
    if (!signerIndex.has(s.id)) signerIndex.set(s.id, i)
  }
  const isDefaultish = (f: FieldPlacement) => {
    const slot = signerIndex.get(f.signerId) ?? 0
    const d = defaultSignatureField(f.signerId, previous.pageCount || incoming.pageCount, slot)
    return (
      f.page === d.page &&
      Math.abs(f.x - d.x) < 0.03 &&
      Math.abs(f.y - d.y) < 0.03
    )
  }

  const fieldMap = new Map<string, FieldPlacement>()
  for (const f of previous.fields) {
    if (f.type === 'signature') fieldMap.set(f.signerId, f)
    else fieldMap.set(`${f.type}:${f.signerId}:${f.id}`, f)
  }
  if (STATUS_RANK[previous.status] <= STATUS_RANK[incoming.status]) {
    for (const f of incoming.fields) {
      if (f.type === 'signature') {
        const prev = fieldMap.get(f.signerId)
        if (prev && isDefaultish(f) && !isDefaultish(prev)) {
          continue // do not snap a custom box back to the bottom default
        }
        fieldMap.set(f.signerId, f)
      } else {
        fieldMap.set(`${f.type}:${f.signerId}:${f.id}`, f)
      }
    }
  }
  const fields: FieldPlacement[] = Array.from(fieldMap.values())

  const audit = mergeAudit(previous.audit || [], incoming.audit || [])
  const updatedAt =
    incoming.updatedAt > previous.updatedAt ? incoming.updatedAt : previous.updatedAt

  return {
    ...incoming,
    status,
    completedPdfKey,
    signers,
    fields,
    audit,
    updatedAt,
  }
}

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

async function ensureLocal(): Promise<void> {
  await fs.mkdir(path.join(LOCAL_ROOT, 'envelopes'), { recursive: true })
  await fs.mkdir(path.join(LOCAL_ROOT, 'pdfs'), { recursive: true })
}

function envelopePath(id: string): string {
  return path.join(LOCAL_ROOT, 'envelopes', `${id}.json`)
}

function pdfLocalPath(key: string): string {
  const cleaned = key.replace(/^sign\//, '').replace(/^pdfs\//, '')
  return path.join(LOCAL_ROOT, 'pdfs', cleaned)
}

function blobPdfPath(key: string): string {
  if (key.startsWith('sign/')) return key
  if (key.startsWith('pdfs/')) return `sign/${key}`
  return `sign/pdfs/${key}`
}

export async function savePdf(key: string, bytes: Uint8Array | Buffer): Promise<string> {
  const relative = key.startsWith('pdfs/') ? key : `pdfs/${key}`
  if (blobEnabled()) {
    const pathname = `sign/${relative}`
    await put(pathname, Buffer.from(bytes), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/pdf',
    })
    return relative
  }
  await ensureLocal()
  await fs.writeFile(pdfLocalPath(relative), Buffer.from(bytes))
  return relative
}

export async function readPdf(key: string): Promise<Buffer> {
  if (blobEnabled()) {
    const pathname = blobPdfPath(key)
    const result = await get(pathname, { access: 'private' })
    if (!result || !('stream' in result) || !result.stream) {
      throw new Error(`PDF not found: ${key}`)
    }
    const reader = result.stream.getReader()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)))
  }
  return fs.readFile(pdfLocalPath(key))
}

export async function saveEnvelope(envelope: Envelope): Promise<void> {
  // Re-read so a concurrent PATCH cannot clobber status back to draft after send.
  const previous = await getEnvelope(envelope.id)
  envelope = mergeEnvelope(envelope, previous)
  const json = JSON.stringify(envelope, null, 2)
  if (blobEnabled()) {
    await put(`sign/envelopes/${envelope.id}.json`, json, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return
  }
  await ensureLocal()
  await fs.writeFile(envelopePath(envelope.id), json, 'utf8')
}

export async function getEnvelope(id: string): Promise<Envelope | null> {
  try {
    if (blobEnabled()) {
      const pathname = `sign/envelopes/${id}.json`
      const result = await get(pathname, { access: 'private' })
      if (!result || !('stream' in result) || !result.stream) return null
      const text = await new Response(result.stream).text()
      return JSON.parse(text) as Envelope
    }
    const raw = await fs.readFile(envelopePath(id), 'utf8')
    return JSON.parse(raw) as Envelope
  } catch {
    return null
  }
}

export async function listEnvelopes(): Promise<EnvelopeSummary[]> {
  const envelopes: Envelope[] = []
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: 'sign/envelopes/', limit: 200 })
    for (const blob of blobs) {
      if (!blob.pathname.endsWith('.json')) continue
      const id = blob.pathname.split('/').pop()?.replace(/\.json$/, '')
      if (!id) continue
      const envelope = await getEnvelope(id)
      if (envelope) envelopes.push(envelope)
    }
  } else {
    await ensureLocal()
    const dir = path.join(LOCAL_ROOT, 'envelopes')
    let names: string[] = []
    try {
      names = await fs.readdir(dir)
    } catch {
      names = []
    }
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      try {
        const raw = await fs.readFile(path.join(dir, name), 'utf8')
        envelopes.push(JSON.parse(raw) as Envelope)
      } catch {
        /* skip */
      }
    }
  }

  return envelopes
    .map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      pageCount: e.pageCount,
      signerCount: e.signers.length,
      signedCount: e.signers.filter((s) => s.status === 'signed').length,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function findEnvelopeBySignerToken(
  token: string,
): Promise<{ envelope: Envelope; signerId: string } | null> {
  const summaries = await listEnvelopes()
  for (const summary of summaries) {
    const envelope = await getEnvelope(summary.id)
    if (!envelope) continue
    const signer = envelope.signers.find((s) => s.token === token)
    if (signer) return { envelope, signerId: signer.id }
  }
  return null
}

export async function deleteEnvelope(id: string): Promise<void> {
  const envelope = await getEnvelope(id)
  if (!envelope) return
  if (blobEnabled()) {
    const paths = [
      `sign/envelopes/${id}.json`,
      blobPdfPath(envelope.originalPdfKey),
      envelope.completedPdfKey ? blobPdfPath(envelope.completedPdfKey) : null,
    ].filter(Boolean) as string[]
    for (const p of paths) {
      try {
        await del(p)
      } catch {
        /* ignore */
      }
    }
    return
  }
  try {
    await fs.unlink(envelopePath(id))
  } catch {
    /* ignore */
  }
}
