import { NextResponse } from 'next/server'
import {
  SIGN_SESSION_COOKIE,
  adminConfigured,
  createSessionToken,
  sessionCookieOptions,
  verifyAdminCredentials,
  hashPassword,
  verifyPassword,
} from '@/lib/sign/auth'
import { findAccountByEmail } from '@/lib/sign/accounts'
import {
  clearLoginFailures,
  clientIp,
  lockedMessage,
  loginLimitKeys,
  loginLockedFor,
  recordLoginFailure,
} from '@/lib/sign/login-limit'

const TIMING_DUMMY = hashPassword('timing-dummy-password')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

  // Thomas (admin) first, then a Sign customer's account.
  if (adminConfigured() && verifyAdminCredentials(email, password)) {
    clearLoginFailures(keys)
    return signedIn(createSessionToken(email))
  }
  const account = await findAccountByEmail(email)
  // Hash anyway when there is no such account, so the answer takes as long
  // either way and does not reveal who has an account.
  const passwordOk = verifyPassword(password, account?.passwordHash ?? TIMING_DUMMY)
  if (!account || !passwordOk) {
    recordLoginFailure(keys)
    return NextResponse.json({ ok: false, error: 'Wrong email or password.' }, { status: 401 })
  }
  clearLoginFailures(keys)
  if (!account.emailVerified) {
    return NextResponse.json(
      {
        ok: false,
        error: `Confirm your email first: open the link we sent to ${account.email}. Sign up again with the same email to get a new link.`,
      },
      { status: 403 },
    )
  }
  return signedIn(createSessionToken(account.email, account.id))
}

function signedIn(token: string) {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SIGN_SESSION_COOKIE, token, sessionCookieOptions())
  return response
}
