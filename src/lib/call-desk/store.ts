import { promises as fs } from 'fs'
import path from 'path'
import { get } from '@vercel/blob'

/**
 * Thomas's call desk (his prospect list). The Mac's daily prospect job builds
 * the page and its screenshots and uploads them to private Vercel Blob under
 * call-desk/, so the list updates without a site deploy. A dev server reads
 * .data/call-desk instead.
 */

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'call-desk')
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

export const IMAGE_ID = /^[A-Za-z0-9_-]{1,80}\.(jpg|png|webp)$/

export async function readCallDesk(file: string): Promise<ReadableStream<Uint8Array> | null> {
  try {
    if (blobEnabled()) {
      const result = await get(`call-desk/${file}`, { access: 'private', useCache: false })
      return result?.stream ?? null
    }
    const data = await fs.readFile(path.join(LOCAL_ROOT, file))
    return new Response(data).body
  } catch {
    return null
  }
}
