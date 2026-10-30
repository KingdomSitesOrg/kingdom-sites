import { NextResponse } from 'next/server'
import {
  SIGN_SESSION_COOKIE,
  adminConfigured,
  createSessionToken,
  verifyAdminCredentials,
} from '@/lib/sign/auth'
import {
  clearLoginFailures,
  clientIp,
  lockedMessage,
  loginLimitKeys,
  loginLockedFor,
  recordLoginFailure,
} from '@/lib/sign/login-limit'

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

  const body = (await request.json().catch(() => null)) as {
    email?: string
    password?: string
  } | null
  const email = body?.email?.trim() || ''
  const password = body?.password || ''

  // Checked before the password, so a paused email stays paused even for a right guess.
  const keys = loginLimitKeys(email, clientIp(request.headers))
  const wait = loginLockedFor(keys)
  if (wait > 0) {
    return NextResponse.json(
      { ok: false, error: lockedMessage(wait) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(wait / 1000)) } },
    )
  }

  if (!verifyAdminCredentials(email, password)) {
    recordLoginFailure(keys)
    return NextResponse.json({ ok: false, error: 'Wrong email or password.' }, { status: 401 })
  }
  clearLoginFailures(keys)

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
