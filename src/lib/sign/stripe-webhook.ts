import type Stripe from 'stripe'
import { contractLimitForPlan, type SignPlanId } from '@/lib/billing'
import {
  buildEntitlementFromSubscription,
  getEmailForSubscription,
  planFromPriceId,
  saveEntitlement,
  type SignEntitlement,
} from './entitlements'

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.id
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const itemEnd = sub.items?.data?.[0]?.current_period_end
  if (typeof itemEnd === 'number') return itemEnd
  const legacy = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end
  return typeof legacy === 'number' ? legacy : null
}

function planFromSubscription(sub: Stripe.Subscription): SignPlanId | null {
  const priceId = sub.items?.data?.[0]?.price?.id
  const fromPrice = planFromPriceId(priceId)
  if (fromPrice) return fromPrice
  const meta = sub.metadata?.sign_plan
  if (meta === 'starter' || meta === 'growth') return meta
  return null
}

async function resolveEmail(
  stripe: Stripe,
  sub: Stripe.Subscription,
  fallback?: string | null,
): Promise<string | null> {
  if (fallback?.trim()) return fallback.trim().toLowerCase()
  const indexed = await getEmailForSubscription(sub.id)
  if (indexed) return indexed
  const metaEmail = sub.metadata?.sign_email?.trim()
  if (metaEmail) return metaEmail.toLowerCase()
  const cid = customerId(sub.customer)
  if (!cid) return null
  const customer = await stripe.customers.retrieve(cid)
  if (customer.deleted) return null
  return customer.email?.trim().toLowerCase() || null
}

export async function applyCheckoutSessionCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<SignEntitlement | null> {
  if (session.mode !== 'subscription') return null
  const email =
    session.customer_details?.email?.trim().toLowerCase() ||
    session.customer_email?.trim().toLowerCase() ||
    null
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || null
  const stripeCustomerId = customerId(session.customer)
  if (!email || !subscriptionId || !stripeCustomerId) return null

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const plan =
    planFromSubscription(sub) ||
    (session.metadata?.sign_plan === 'growth' || session.metadata?.sign_plan === 'starter'
      ? (session.metadata.sign_plan as SignPlanId)
      : null)
  if (!plan) return null

  const entitlement = buildEntitlementFromSubscription({
    email,
    plan,
    stripeCustomerId,
    subscriptionId,
    status: sub.status,
    currentPeriodEnd: subscriptionPeriodEnd(sub),
  })
  return saveEntitlement(entitlement)
}

export async function applySubscriptionUpdated(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<SignEntitlement | null> {
  const email = await resolveEmail(stripe, sub)
  if (!email) return null
  const plan = planFromSubscription(sub)
  if (!plan) {
    // Keep prior plan if price id not resolvable (e.g. tests / missing env)
    const priorPlan = (sub.metadata?.sign_plan === 'growth' || sub.metadata?.sign_plan === 'starter'
      ? sub.metadata.sign_plan
      : null) as SignPlanId | null
    if (!priorPlan) return null
    const entitlement = buildEntitlementFromSubscription({
      email,
      plan: priorPlan,
      stripeCustomerId: customerId(sub.customer),
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: subscriptionPeriodEnd(sub),
    })
    entitlement.contractLimit = contractLimitForPlan(priorPlan)
    return saveEntitlement(entitlement)
  }
  const entitlement = buildEntitlementFromSubscription({
    email,
    plan,
    stripeCustomerId: customerId(sub.customer),
    subscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: subscriptionPeriodEnd(sub),
  })
  return saveEntitlement(entitlement)
}

export async function applySubscriptionDeleted(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<SignEntitlement | null> {
  const email = await resolveEmail(stripe, sub)
  if (!email) return null
  const plan =
    planFromSubscription(sub) ||
    (sub.metadata?.sign_plan === 'growth' || sub.metadata?.sign_plan === 'starter'
      ? (sub.metadata.sign_plan as SignPlanId)
      : 'starter')
  const entitlement = buildEntitlementFromSubscription({
    email,
    plan,
    stripeCustomerId: customerId(sub.customer),
    subscriptionId: sub.id,
    status: 'canceled',
    currentPeriodEnd: subscriptionPeriodEnd(sub),
  })
  return saveEntitlement(entitlement)
}

export async function handleStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      await applyCheckoutSessionCompleted(stripe, event.data.object as Stripe.Checkout.Session)
      break
    }
    case 'customer.subscription.updated': {
      await applySubscriptionUpdated(stripe, event.data.object as Stripe.Subscription)
      break
    }
    case 'customer.subscription.deleted': {
      await applySubscriptionDeleted(stripe, event.data.object as Stripe.Subscription)
      break
    }
    default:
      break
  }
}
