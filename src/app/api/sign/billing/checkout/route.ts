import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { signPlan } from '@/lib/billing'
import { activePlan, saveAccount } from '@/lib/sign/accounts'
import { billingError, currentAccount, requestOrigin, signedOut } from '@/lib/sign/billing-server'
import { priceByLookupKey, stripeRequest, type StripeCheckoutSession } from '@/lib/sign/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Start Stripe Checkout for a plan. The plan becomes active only when Stripe's webhook says so. */
export async function POST(request: Request) {
  try {
    let account = await currentAccount()
    if (!account) return signedOut()
    const body = (await request.json().catch(() => null)) as { plan?: string } | null
    const plan = signPlan(body?.plan)
    if (!plan) {
      return NextResponse.json({ ok: false, error: 'Choose Starter or Growth.' }, { status: 400 })
    }
    if (activePlan(account)) {
      return NextResponse.json(
        { ok: false, error: 'You already have a plan. Change it from your account page.' },
        { status: 409 },
      )
    }
    const price = await priceByLookupKey(plan.lookupKey)
    if (!price) {
      return NextResponse.json({ ok: false, error: 'That plan is not available right now.' }, { status: 503 })
    }
    if (!account.stripeCustomerId) {
      const customer = await stripeRequest<{ id: string }>('POST', '/customers', {
        email: account.email,
        name: account.name,
        metadata: { signAccountId: account.id },
      })
      account = await saveAccount({ ...account, stripeCustomerId: customer.id })
    }
    const origin = requestOrigin(request)
    const session = await stripeRequest<StripeCheckoutSession>('POST', '/checkout/sessions', {
      mode: 'subscription',
      customer: account.stripeCustomerId,
      client_reference_id: account.id,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: { metadata: { signAccountId: account.id } },
      success_url: `${origin}/sign/account?checkout=done`,
      cancel_url: `${origin}/sign/account?checkout=cancelled`,
    })
    return NextResponse.json({ ok: true, url: session.url })
  } catch (error) {
    Sentry.captureException(error)
    return billingError(error)
  }
}
