import { promises as fs } from 'fs'
import path from 'path'
import { put, list, del, get } from '@vercel/blob'
import type { Envelope, EnvelopeSummary } from './types'
import { mergeEnvelope } from './placement'

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'sign')

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

async function ensureLocal(): Promise<void> {
  await fs.mkdir(path.join(LOCAL_ROOT, 'envelopes'), { recursive: true })
  await fs.mkdir(path.join(LOCAL_ROOT, 'pdfs'), { recursive: true })
  await fs.mkdir(path.join(LOCAL_ROOT, 'tokens'), { recursive: true })
}

function envelopePath(id: string): string {
  return path.join(LOCAL_ROOT, 'envelopes', `${id}.json`)
}

function tokenLocalPath(token: string): string {
  return path.join(LOCAL_ROOT, 'tokens', `${token}.json`)
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

type TokenIndex = { envelopeId: string; signerId: string }

async function writeTokenIndex(token: string, envelopeId: string, signerId: string): Promise<void> {
  if (!token) return
  const payload = JSON.stringify({ envelopeId, signerId } satisfies TokenIndex)
  if (blobEnabled()) {
    await put(`sign/tokens/${token}.json`, payload, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return
  }
  await ensureLocal()
  await fs.writeFile(tokenLocalPath(token), payload, 'utf8')
}

async function readTokenIndex(token: string): Promise<TokenIndex | null> {
  try {
    if (blobEnabled()) {
      const result = await get(`sign/tokens/${token}.json`, { access: 'private' })
      if (!result || !('stream' in result) || !result.stream) return null
      const text = await new Response(result.stream).text()
      return JSON.parse(text) as TokenIndex
    }
    const raw = await fs.readFile(tokenLocalPath(token), 'utf8')
    return JSON.parse(raw) as TokenIndex
  } catch {
    return null
  }
}

async function deleteTokenIndex(token: string): Promise<void> {
  if (!token) return
  try {
    if (blobEnabled()) {
      await del(`sign/tokens/${token}.json`)
      return
    }
    await fs.unlink(tokenLocalPath(token))
  } catch {
    /* ignore */
  }
}

async function syncTokenIndexes(envelope: Envelope, previous: Envelope | null): Promise<void> {
  const nextTokens = new Set(envelope.signers.map((s) => s.token).filter(Boolean))
  if (previous) {
    for (const s of previous.signers) {
      if (s.token && !nextTokens.has(s.token)) {
        await deleteTokenIndex(s.token)
      }
    }
  }
  for (const s of envelope.signers) {
    if (s.token) await writeTokenIndex(s.token, envelope.id, s.id)
  }
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

function signedPreserved(expected: Envelope, actual: Envelope): boolean {
  for (const s of expected.signers) {
    if (s.status !== 'signed') continue
    const live = actual.signers.find((x) => x.id === s.id)
    if (!live || live.status !== 'signed') return false
  }
  return true
}

export async function saveEnvelope(envelope: Envelope): Promise<Envelope> {
  // Read-merge-write so concurrent admin autosave cannot wipe a magic-link signature
  // or snap placements. Keep this fast: Blob get-after-put is often stale, and the
  // old 4-round updatedAt verify burned maxDuration so Client sign never stuck.
  const incoming = envelope
  let previous: Envelope | null = null
  let merged = incoming
  for (let attempt = 0; attempt < 2; attempt++) {
    previous = await getEnvelope(incoming.id)
    merged = mergeEnvelope(incoming, previous)
    // Second read: if Send just flipped draft→sent, don't put a stale draft over it.
    const latest = await getEnvelope(incoming.id)
    if (latest) {
      previous = latest
      merged = mergeEnvelope(merged, latest)
    }
    const json = JSON.stringify(merged, null, 2)
    if (blobEnabled()) {
      await put(`sign/envelopes/${merged.id}.json`, json, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      })
    } else {
      await ensureLocal()
      await fs.writeFile(envelopePath(merged.id), json, 'utf8')
    }
    const verify = await getEnvelope(incoming.id)
    if (!verify) {
      await syncTokenIndexes(merged, previous)
      return merged
    }
    const fieldsMatch =
      JSON.stringify(verify.fields) === JSON.stringify(merged.fields)
    const statusMatch = verify.status === merged.status
    const signedOk = signedPreserved(merged, verify)
    // Do NOT require updatedAt equality — stale Blob reads fail that check even when
    // our write landed, which used to force 4 full RMW cycles and timeout Client POST.
    if (statusMatch && (fieldsMatch || signedOk)) {
      const best = mergeEnvelope(merged, verify)
      await syncTokenIndexes(best, previous)
      return best
    }
    // Concurrent writer diverged (lost our signed state or fields) — merge once more.
  }
  await syncTokenIndexes(merged, previous)
  return merged
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
  // Fast path: token index written on saveEnvelope
  const indexed = await readTokenIndex(token)
  if (indexed) {
    const envelope = await getEnvelope(indexed.envelopeId)
    if (envelope) {
      const signer = envelope.signers.find((s) => s.id === indexed.signerId && s.token === token)
      if (signer) return { envelope, signerId: signer.id }
      const byToken = envelope.signers.find((s) => s.token === token)
      if (byToken) return { envelope, signerId: byToken.id }
    }
  }

  // Fallback for envelopes saved before the token index existed
  const summaries = await listEnvelopes()
  for (const summary of summaries) {
    const envelope = await getEnvelope(summary.id)
    if (!envelope) continue
    const signer = envelope.signers.find((s) => s.token === token)
    if (signer) {
      await writeTokenIndex(token, envelope.id, signer.id)
      return { envelope, signerId: signer.id }
    }
  }
  return null
}

export async function deleteEnvelope(id: string): Promise<void> {
  const envelope = await getEnvelope(id)
  if (!envelope) return
  for (const s of envelope.signers) {
    if (s.token) await deleteTokenIndex(s.token)
  }
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
