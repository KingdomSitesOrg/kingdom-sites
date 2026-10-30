import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { signPlan } from '@/lib/billing'
import { activePlan, applySubscription, saveAccount } from '@/lib/sign/accounts'
import { billingError, currentAccount, signedOut } from '@/lib/sign/billing-server'
import { getSubscription, priceByLookupKey, stripeRequest, type StripeSubscription } from '@/lib/sign/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Starter → Growth on the same subscription, charged pro rata for the rest of the month. */
export async function POST() {
  try {
    const account = await currentAccount()
    if (!account) return signedOut()
    const current = activePlan(account)
    const growth = signPlan('growth')!
    if (current?.id !== 'starter' || !account.stripeSubscriptionId) {
      return NextResponse.json({ ok: false, error: 'Only Starter can be upgraded here.' }, { status: 400 })
    }
    const [sub, price] = await Promise.all([
      getSubscription(account.stripeSubscriptionId),
      priceByLookupKey(growth.lookupKey),
    ])
    const item = sub?.items.data[0]
    if (!sub || !item || !price) {
      return NextResponse.json({ ok: false, error: 'Could not find your plan. Try again.' }, { status: 409 })
    }
    const updated = await stripeRequest<StripeSubscription>('POST', `/subscriptions/${sub.id}`, {
      items: [{ id: item.id, price: price.id }],
      proration_behavior: 'create_prorations',
    })
    // Stripe's own answer, read on the server: safe to apply now (the webhook repeats it).
    const saved = await saveAccount(applySubscription(account, updated))
    return NextResponse.json({ ok: true, plan: saved.plan })
  } catch (error) {
    Sentry.captureException(error)
    return billingError(error)
  }
}
