import { promises as fs } from 'fs'
import path from 'path'
import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
import { BIT_COUNT, BIT_FAMILY, PAINT_BLUE, PAINT_COUNT, PAINT_ORANGE, PAINT_WHITE, SITES_FAMILY, STOP_FAMILY, type MuralState } from '@/app/concepts/mural/_lib/name'
import { hash } from '@/app/concepts/mural/_lib/tiles'

/**
 * The Mural concept's shared wall: which tiles of the name KINGDOM SITES
 * visitors have laid, in which paint, and how many tiles have been laid in
 * all. One small private JSON document, kept the way the referral records
 * are: private Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise
 * .data/ on a local machine. A write only lands on the version it read
 * (ETag), so two visitors laying at once cannot undo each other.
 */

const BLOB_PATH = 'mural/wall.json'
const LOCAL_FILE = path.join(process.cwd(), '.data', 'mural', 'wall.json')

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

/** A wall nobody has touched yet starts about two fifths laid, so the name already reads:
    KINGDOM in white, SITES in blue, a few tiles in orange. The same start every time. */
export function freshWall(): MuralState {
  const cells = BIT_FAMILY.map((family, id) => {
    if (family === STOP_FAMILY) return PAINT_ORANGE
    if (hash(id, 7, 61) > 0.42) return -1
    if (hash(id, 7, 62) < 0.07) return PAINT_ORANGE
    return family === SITES_FAMILY ? PAINT_BLUE : PAINT_WHITE
  })
  return { cells, total: cells.filter((c) => c >= 0).length }
}

/** Whatever was stored, made safe to use: the right length, known paints only. */
function tidy(raw: unknown): MuralState {
  const fresh = freshWall()
  const doc = raw as Partial<MuralState> | null
  if (!doc || !Array.isArray(doc.cells)) return fresh
  const cells = fresh.cells.map((start, id) => {
    const v = doc.cells![id]
    return Number.isInteger(v) && v >= -1 && v < PAINT_COUNT ? v : start
  })
  const total = Number.isFinite(doc.total) ? Math.max(0, Math.floor(doc.total as number)) : fresh.total
  return { cells, total }
}

async function load(): Promise<{ state: MuralState; etag: string | null }> {
  if (blobEnabled()) {
    const result = await get(BLOB_PATH, { access: 'private', useCache: false })
    if (!result || !result.stream) return { state: freshWall(), etag: null }
    return { state: tidy(JSON.parse(await new Response(result.stream).text())), etag: result.blob.etag }
  }
  // Vercel's filesystem is read-only: there it is Blob or the untouched wall.
  if (process.env.VERCEL) return { state: freshWall(), etag: null }
  try {
    return { state: tidy(JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8'))), etag: null }
  } catch {
    return { state: freshWall(), etag: null }
  }
}

/* The wall is read far more often than it changes, so a read is kept for a few seconds. */
const KEEP_MS = 4000
let kept: { state: MuralState; at: number } | null = null

export async function readWall(): Promise<MuralState> {
  if (kept && Date.now() - kept.at < KEEP_MS) return kept.state
  const { state } = await load()
  kept = { state, at: Date.now() }
  return state
}

/** Whether a laid tile can be saved here at all. */
export function wallCanSave(): boolean {
  return blobEnabled() || !process.env.VERCEL
}

/**
 * Lays tiles: `lay` is the name's tiles a visitor painted (tile number, paint
 * number), `count` every tile that tap laid on the wall. Read, change, write;
 * again from the top if someone else wrote in between.
 */
export async function layTiles(lay: [number, number][], count: number): Promise<MuralState> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { state, etag } = await load()
    for (const [id, paint] of lay) if (id >= 0 && id < BIT_COUNT) state.cells[id] = paint
    state.total += count
    const json = JSON.stringify(state)
    if (!blobEnabled()) {
      if (process.env.VERCEL) return state
      await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
      await fs.writeFile(LOCAL_FILE, json, 'utf8')
      kept = { state, at: Date.now() }
      return state
    }
    try {
      await put(BLOB_PATH, json, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
      })
      kept = { state, at: Date.now() }
      return state
    } catch (error) {
      const raced = error instanceof BlobPreconditionFailedError || (!etag && error instanceof Error && /already exists/i.test(error.message))
      if (!raced) throw error
    }
  }
  throw new Error('The wall is busy. Try again.')
}
