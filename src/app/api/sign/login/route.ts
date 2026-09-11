import { NextResponse } from 'next/server'
import {
  SIGN_SESSION_COOKIE,
  adminConfigured,
  createSessionToken,
  verifyAdminCredentials,
} from '@/lib/sign/auth'

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

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 })
  }

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
