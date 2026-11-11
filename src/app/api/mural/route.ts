import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { BIT_COUNT, MAX_PER_TAP, PAINT_COUNT } from '@/app/concepts/mural/_lib/name'
import { freshWall, layTiles, readWall, wallCanSave } from '@/lib/mural-store'

/**
 * The Mural concept's shared wall (see mural-store).
 *
 * GET returns the wall as it stands. POST lays one tap's tiles on it.
 * Nothing a visitor sends is kept except tile numbers and paint numbers, and
 * a tile can only land on the name's own shape, so there is nothing to draw
 * or write that the picture does not already allow.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

const FRESH = { 'Cache-Control': 'no-store' }

/* One visitor tapping fast lays a few tiles a second; far more than that is a script. */
const RECENT = new Map<string, number[]>()
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 90

function overLimit(ip: string): boolean {
  const now = Date.now()
  const seen = (RECENT.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  seen.push(now)
  RECENT.set(ip, seen)
  if (RECENT.size > 2000) RECENT.clear()
  return seen.length > MAX_PER_WINDOW
}

export async function GET() {
  try {
    return NextResponse.json(await readWall(), { headers: FRESH })
  } catch (error) {
    Sentry.captureException(error)
    // The wall still draws: the untouched one.
    return NextResponse.json(freshWall(), { headers: FRESH })
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (overLimit(ip)) return NextResponse.json({ error: 'Slow down a little.' }, { status: 429, headers: FRESH })

  const body = (await request.json().catch(() => null)) as { lay?: unknown; count?: unknown } | null
  const rawLay = Array.isArray(body?.lay) ? body.lay : null
  const count = body?.count
  if (!rawLay || rawLay.length > MAX_PER_TAP || typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_PER_TAP || count < rawLay.length) {
    return NextResponse.json({ error: 'That is not a tile.' }, { status: 400, headers: FRESH })
  }
  const lay: [number, number][] = []
  for (const entry of rawLay) {
    const [id, paint] = Array.isArray(entry) ? entry : []
    if (!Number.isInteger(id) || id < 0 || id >= BIT_COUNT || !Number.isInteger(paint) || paint < 0 || paint >= PAINT_COUNT) {
      return NextResponse.json({ error: 'That is not a tile.' }, { status: 400, headers: FRESH })
    }
    lay.push([id, paint])
  }

  try {
    if (!wallCanSave()) return NextResponse.json({ ...(await readWall()), saved: false }, { headers: FRESH })
    return NextResponse.json({ ...(await layTiles(lay, count)), saved: true }, { headers: FRESH })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'The wall is busy. Try again.' }, { status: 503, headers: FRESH })
  }
}
