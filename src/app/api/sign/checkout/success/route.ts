import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { SIGN_SESSION_COOKIE, createSessionToken } from '@/lib/sign/auth'
import { getStripe } from '@/lib/sign/stripe'
import { applyCheckoutSessionCompleted } from '@/lib/sign/stripe-webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function appOrigin(request: Request): string {
  const configured = process.env.SIGN_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}

export async function GET(request: Request) {
  const origin = appOrigin(request)
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')?.trim()
  if (!sessionId) {
    return NextResponse.redirect(`${origin}/sign/pricing`)
  }

  try {
    const stripe = getStripe()
    const checkout = await stripe.checkout.sessions.retrieve(sessionId)
    if (checkout.status === 'expired') {
      return NextResponse.redirect(`${origin}/sign/pricing`)
    }

    await applyCheckoutSessionCompleted(stripe, checkout)

    const email =
      checkout.customer_details?.email?.trim().toLowerCase() ||
      checkout.customer_email?.trim().toLowerCase() ||
      ''
    if (!email) {
      return NextResponse.redirect(`${origin}/sign/pricing`)
    }

    const token = createSessionToken(email)
    const response = NextResponse.redirect(`${origin}/sign/dashboard`)
    response.cookies.set(SIGN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 14 * 24 * 60 * 60,
    })
    return response
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.redirect(`${origin}/sign/pricing`)
  }
}
