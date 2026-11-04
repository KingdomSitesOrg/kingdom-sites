import { NextResponse } from 'next/server'
import {
  SIGN_SESSION_COOKIE,
  adminConfigured,
  createSessionToken,
  verifyAdminCredentials,
} from '@/lib/sign/auth'
import { fromThisSite, visitorOf } from '@/lib/intelligence-server'

/* Wrong passwords per address before it has to wait: 10 every 15 minutes, per server. */
const TRIES = 10
const WINDOW_MS = 15 * 60 * 1000
const misses = new Map<string, number[]>()
const recent = (who: string, now: number) => (misses.get(who) ?? []).filter((t) => now - t < WINDOW_MS)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Sign admin is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.',
      },
      { status: 503 },
    )
  }

  if (!fromThisSite(request)) return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 403 })
  const who = visitorOf(request)
  const now = Date.now()
  if (recent(who, now).length >= TRIES) {
    return NextResponse.json({ ok: false, error: 'Too many tries. Wait 15 minutes and try again.' }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string
    password?: string
  } | null
  const email = body?.email?.trim() || ''
  const password = body?.password || ''

  if (!verifyAdminCredentials(email, password)) {
    misses.set(who, [...recent(who, now), now])
    if (misses.size > 10_000) misses.delete(misses.keys().next().value!)
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 })
  }

  misses.delete(who)
  const token = createSessionToken(email)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SIGN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 14 * 24 * 60 * 60,
  })
  return response
}
