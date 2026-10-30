import { promises as fs } from 'fs'
import path from 'path'
import { get, put } from '@vercel/blob'
import * as Sentry from '@sentry/nextjs'
import { costUsd, type Usage } from './intelligence'

/**
 * Intelligence's running total for the day (UTC): questions answered, tokens
 * and dollars. It is what the daily spend cap reads, and the record of what the
 * chat cost. Never the questions or the answers themselves.
 *
 * Kept like feedback-store: a private Vercel Blob file per day when
 * BLOB_READ_WRITE_TOKEN is set, otherwise .data/intelligence/ on a local
 * machine. Each server instance keeps its own copy and folds in the stored
 * one every half minute, so the total holds across instances to within a few
 * questions.
 */

export type DayTotal = {
  date: string
  answers: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  usd: number
}

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'intelligence')
const SYNC_MS = 30_000

let current: DayTotal | null = null
let syncedAt = 0

const today = () => new Date().toISOString().slice(0, 10)
const blobPath = (date: string) => `intelligence/usage-${date}.json`
const inBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

function empty(date: string): DayTotal {
  return { date, answers: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, usd: 0 }
}

/** Whichever copy has seen more, field by field. */
function merge(a: DayTotal, b: DayTotal | null): DayTotal {
  if (!b || b.date !== a.date) return a
  return {
    date: a.date,
    answers: Math.max(a.answers, b.answers),
    inputTokens: Math.max(a.inputTokens, b.inputTokens),
    outputTokens: Math.max(a.outputTokens, b.outputTokens),
    cacheReadTokens: Math.max(a.cacheReadTokens, b.cacheReadTokens),
    cacheWriteTokens: Math.max(a.cacheWriteTokens, b.cacheWriteTokens),
    usd: Math.max(a.usd, b.usd),
  }
}

async function readStored(date: string): Promise<DayTotal | null> {
  try {
    if (inBlob()) {
      const found = await get(blobPath(date), { access: 'private', useCache: false })
      if (!found || found.statusCode !== 200) return null
      return JSON.parse(await new Response(found.stream).text()) as DayTotal
    }
    if (process.env.VERCEL) return null
    return JSON.parse(await fs.readFile(path.join(LOCAL_ROOT, `usage-${date}.json`), 'utf8')) as DayTotal
  } catch {
    // Not written yet today, or unreadable: this instance's own count stands.
    return null
  }
}

async function writeStored(total: DayTotal): Promise<void> {
  const body = JSON.stringify(total, null, 2)
  try {
    if (inBlob()) {
      await put(blobPath(total.date), body, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      })
      return
    }
    if (process.env.VERCEL) return
    await fs.mkdir(LOCAL_ROOT, { recursive: true })
    await fs.writeFile(path.join(LOCAL_ROOT, `usage-${total.date}.json`), body, 'utf8')
  } catch (error) {
    Sentry.captureException(error)
  }
}

/** Today's total so far, as far as this instance knows. */
export async function spentToday(): Promise<DayTotal> {
  const date = today()
  if (!current || current.date !== date) {
    current = empty(date)
    syncedAt = 0
  }
  if (Date.now() - syncedAt > SYNC_MS) {
    current = merge(current, await readStored(date))
    syncedAt = Date.now()
  }
  return current
}

/** Adds one answer's tokens to today's total, stores it, and logs the numbers (no text). */
export async function recordAnswer(usage: Usage): Promise<DayTotal> {
  const before = await spentToday()
  const usd = costUsd(usage)
  current = {
    ...before,
    answers: before.answers + 1,
    inputTokens: before.inputTokens + usage.input_tokens,
    outputTokens: before.outputTokens + usage.output_tokens,
    cacheReadTokens: before.cacheReadTokens + (usage.cache_read_input_tokens ?? 0),
    cacheWriteTokens: before.cacheWriteTokens + (usage.cache_creation_input_tokens ?? 0),
    usd: before.usd + usd,
  }
  console.info(
    JSON.stringify({
      intelligence: 'answer',
      in: usage.input_tokens,
      out: usage.output_tokens,
      cacheRead: usage.cache_read_input_tokens ?? 0,
      cacheWrite: usage.cache_creation_input_tokens ?? 0,
      usd: Number(usd.toFixed(6)),
      todayUsd: Number(current.usd.toFixed(4)),
      todayAnswers: current.answers,
    }),
  )
  await writeStored(current)
  return current
}
