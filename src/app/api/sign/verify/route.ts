import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { confirmEmail } from '@/lib/sign/accounts'
import { SIGN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/sign/auth'
import { appBaseUrl } from '@/lib/sign/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** The link in the confirmation email: confirm, sign in, and go choose a plan. */
export async function GET(request: Request) {
  const base = appBaseUrl()
  try {
    const token = new URL(request.url).searchParams.get('token') || ''
    const account = await confirmEmail(token)
    if (!account) {
      return NextResponse.redirect(`${base}/sign/login?confirm=invalid`, 303)
    }
    const response = NextResponse.redirect(`${base}/sign/account?welcome=1`, 303)
    response.cookies.set(
      SIGN_SESSION_COOKIE,
      createSessionToken(account.email, account.id),
      sessionCookieOptions(),
    )
    return response
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.redirect(`${base}/sign/login?confirm=invalid`, 303)
  }
}
