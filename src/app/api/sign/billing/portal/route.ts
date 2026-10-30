import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { billingError, currentAccount, requestOrigin, signedOut } from '@/lib/sign/billing-server'
import { stripeRequest } from '@/lib/sign/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Stripe's billing page: card, invoices, cancel. */
export async function POST(request: Request) {
  try {
    const account = await currentAccount()
    if (!account) return signedOut()
    if (!account.stripeCustomerId) {
      return NextResponse.json({ ok: false, error: 'Choose a plan first.' }, { status: 400 })
    }
    const session = await stripeRequest<{ url: string }>('POST', '/billing_portal/sessions', {
      customer: account.stripeCustomerId,
      return_url: `${requestOrigin(request)}/sign/account`,
    })
    return NextResponse.json({ ok: true, url: session.url })
  } catch (error) {
    Sentry.captureException(error)
    return billingError(error)
  }
}
