import { NextResponse, type NextRequest } from 'next/server'
import { REFERRAL_CODE, REFERRAL_COOKIE, REFERRAL_DAYS } from '@/lib/referrals'

/**
 * A personal referral link (/r/<code>, T-293) leaves the referral cookie, so
 * a conversation asked for from this site in the next 90 days counts as that
 * referrer's (`src/lib/refer/credit.ts`). Runs on /r/ only.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const code = request.nextUrl.pathname.split('/')[2]?.toLowerCase() ?? ''
  if (REFERRAL_CODE.test(code)) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      maxAge: REFERRAL_DAYS * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
    })
  }
  return response
}

export const config = {
  matcher: '/r/:code',
}
