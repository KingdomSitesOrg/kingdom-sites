import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { put } from '@vercel/blob'
import * as Sentry from '@sentry/nextjs'
import type { Feedback } from './feedback'

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'feedback')

/**
 * Keeps a copy of every response, so one is never lost to a failed email.
 * Private Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise .data/ on a
 * local machine. Vercel's filesystem is read-only, so there it is blob or nothing.
 */
export async function saveFeedback(feedback: Feedback, receivedAt: string): Promise<boolean> {
  const id = `${receivedAt.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`
  const payload = JSON.stringify({ id, receivedAt, ...feedback }, null, 2)

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
      await put(`feedback/${id}.json`, payload, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
      })
      return true
    }
    if (process.env.VERCEL) return false
    await fs.mkdir(LOCAL_ROOT, { recursive: true })
    await fs.writeFile(path.join(LOCAL_ROOT, `${id}.json`), payload, 'utf8')
    return true
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}
