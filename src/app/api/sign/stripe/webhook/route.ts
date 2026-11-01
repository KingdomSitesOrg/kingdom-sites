import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { applySubscription, getAccount, saveAccount } from '@/lib/sign/accounts'
import { getSubscription, verifyStripeSignature } from '@/lib/sign/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StripeEvent = {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}

const HANDLED = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

/**
 * Stripe → Sign. The signature is checked against the raw body before anything
 * is read. Every handled event re-reads the subscription from Stripe and sets
 * the account from its current state, so events arriving twice or out of order
 * change nothing. The account named in metadata must already own that Stripe
 * customer (set by our own checkout), so a forged claim cannot grant a plan.
 */
export async function POST(request: Request) {
  const secret = process.env.SIGN_STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'SIGN_STRIPE_WEBHOOK_SECRET is not set.' }, { status: 500 })
  }
  const payload = await request.text()
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload.' }, { status: 400 })
  }
  if (!HANDLED.has(event.type)) return NextResponse.json({ ok: true, ignored: event.type })

  try {
    const object = event.data.object
    const isCheckout = event.type === 'checkout.session.completed'
    if (isCheckout && object.mode !== 'subscription') return NextResponse.json({ ok: true, ignored: 'mode' })

    const accountId = isCheckout
      ? (object.client_reference_id as string | null)
      : ((object.metadata as Record<string, string> | undefined)?.signAccountId ?? null)
    const subscriptionId = isCheckout ? (object.subscription as string | null) : (object.id as string)
    const customerId = object.customer as string | null
    if (!accountId || !subscriptionId) return NextResponse.json({ ok: true, ignored: 'not Sign' })

    const account = await getAccount(accountId)
    if (!account || !account.stripeCustomerId || account.stripeCustomerId !== customerId) {
      // Not ours, or a claim that does not match our record: record nothing.
      return NextResponse.json({ ok: true, ignored: 'unknown account' })
    }
    const sub = await getSubscription(subscriptionId)
    if (sub && sub.customer !== account.stripeCustomerId) {
      return NextResponse.json({ ok: true, ignored: 'customer mismatch' })
    }
    // An old subscription's late event must not override a newer one.
    if (account.stripeSubscriptionId && account.stripeSubscriptionId !== subscriptionId && sub?.status !== 'active') {
      return NextResponse.json({ ok: true, ignored: 'older subscription' })
    }
    await saveAccount(applySubscription(account, sub))
    return NextResponse.json({ ok: true })
  } catch (error) {
    // 500 so Stripe retries.
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not process the event.' }, { status: 500 })
  }
}
