import { promises as fs } from 'fs'
import path from 'path'
import { BlobPreconditionFailedError, get, list, put } from '@vercel/blob'
import type { Conversation } from './chat'

/**
 * Conversations, one file each: private Vercel Blob when BLOB_READ_WRITE_TOKEN
 * is set (production), otherwise .data/chat on this machine (a dev server).
 * Every change reads, edits and writes back, and starts again if the other side
 * wrote in between, so a visitor's message and Thomas's reply never overwrite
 * each other.
 */

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'chat')
const PREFIX = 'chat/conversations/'

const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
const safe = (id: string) => /^[A-Za-z0-9_-]{6,40}$/.test(id)
const blobPath = (id: string) => `${PREFIX}${id}.json`
const localPath = (id: string) => path.join(LOCAL_ROOT, `${id}.json`)

async function load(id: string): Promise<{ doc: Conversation | null; etag: string | null }> {
  if (!safe(id)) return { doc: null, etag: null }
  try {
    if (blobEnabled()) {
      const result = await get(blobPath(id), { access: 'private', useCache: false })
      if (!result || !result.stream) return { doc: null, etag: null }
      return { doc: JSON.parse(await new Response(result.stream).text()) as Conversation, etag: result.blob.etag }
    }
    return { doc: JSON.parse(await fs.readFile(localPath(id), 'utf8')) as Conversation, etag: null }
  } catch {
    return { doc: null, etag: null }
  }
}

export async function readConversation(id: string): Promise<Conversation | null> {
  return (await load(id)).doc
}

export async function createConversation(doc: Conversation): Promise<void> {
  const json = JSON.stringify(doc, null, 2)
  if (blobEnabled()) {
    await put(blobPath(doc.id), json, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json' })
    return
  }
  await fs.mkdir(LOCAL_ROOT, { recursive: true })
  await fs.writeFile(localPath(doc.id), json, { encoding: 'utf8', flag: 'wx' })
}

/** Read, change, write; again from the top if someone else wrote in between. Null if it is gone. */
export async function changeConversation<T>(id: string, edit: (doc: Conversation) => T): Promise<{ doc: Conversation; result: T } | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { doc, etag } = await load(id)
    if (!doc) return null
    const result = edit(doc)
    const json = JSON.stringify(doc, null, 2)
    if (!blobEnabled()) {
      await fs.writeFile(localPath(id), json, 'utf8')
      return { doc, result }
    }
    try {
      await put(blobPath(id), json, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        ...(etag ? { ifMatch: etag } : { allowOverwrite: true }),
      })
      return { doc, result }
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError)) throw error
    }
  }
  throw new Error('The conversation is busy. Try again.')
}

/** Every conversation, newest first (Thomas's inbox). */
export async function listConversations(limit = 200): Promise<Conversation[]> {
  let ids: string[] = []
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 })
    ids = blobs.map((b) => b.pathname.slice(PREFIX.length).replace(/\.json$/, ''))
  } else {
    ids = (await fs.readdir(LOCAL_ROOT).catch(() => [] as string[])).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  }
  const docs = await Promise.all(ids.map((id) => readConversation(id)))
  return docs
    .filter((d): d is Conversation => !!d)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, limit)
}
