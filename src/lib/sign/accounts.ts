import { createHash, randomBytes } from 'crypto'
import { signPlan, signPlanByLookupKey, type SignPlan, type SignPlanId } from '@/lib/billing'
import { newId } from './auth'
import { readRecord, writeRecord } from './store'
import { subscriptionPeriod, type StripeSubscription } from './stripe'
import type { EnvelopeSummary } from './types'

/**
 * A Sign customer's account. Kept in Sign's own store as
 * accounts/<id>.json, with accounts-by-email/<sha256(email)>.json pointing at it.
 * Billing fields are written only from Stripe's own record of the subscription
 * (webhook or a server-side re-read), never from what a browser sends.
 */
export type SignAccount = {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
  emailVerified: boolean
  /** Hash of the one-time email confirmation token (the token itself is only in the email). */
  verifyTokenHash?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  plan?: SignPlanId
  /** Stripe subscription status: active, trialing, past_due, canceled, … */
  subscriptionStatus?: string
  periodStart?: string
  periodEnd?: string
  cancelAtPeriodEnd?: boolean
}

const accountKey = (id: string) => `accounts/${id}.json`
const emailKey = (email: string) =>
  `accounts-by-email/${createHash('sha256').update(normalizeEmail(email)).digest('hex')}.json`

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

export async function getAccount(id: string): Promise<SignAccount | null> {
  if (!/^acc_[a-f0-9]{24}$/.test(id)) return null
  return readRecord<SignAccount>(accountKey(id))
}

export async function findAccountByEmail(email: string): Promise<SignAccount | null> {
  const index = await readRecord<{ accountId: string }>(emailKey(email))
  if (!index) return null
  const account = await getAccount(index.accountId)
  return account && normalizeEmail(account.email) === normalizeEmail(email) ? account : null
}

export async function saveAccount(account: SignAccount): Promise<SignAccount> {
  await writeRecord(accountKey(account.id), account)
  return account
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Create an unconfirmed account; returns it with the confirmation token for the email. */
export async function createAccount(input: {
  email: string
  name: string
  passwordHash: string
}): Promise<{ account: SignAccount; verifyToken: string }> {
  const verifyToken = randomBytes(24).toString('base64url')
  const account: SignAccount = {
    id: newId('acc'),
    email: normalizeEmail(input.email),
    name: input.name.trim().slice(0, 120),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
    emailVerified: false,
    verifyTokenHash: hashToken(verifyToken),
  }
  await saveAccount(account)
  await writeRecord(emailKey(account.email), { accountId: account.id })
  await writeRecord(verifyKey(account.verifyTokenHash!), { accountId: account.id })
  return { account, verifyToken }
}

const verifyKey = (tokenHash: string) => `account-verify/${tokenHash}.json`

/** A fresh confirmation token for an account that has not confirmed yet. */
export async function renewVerifyToken(account: SignAccount): Promise<string> {
  const verifyToken = randomBytes(24).toString('base64url')
  const tokenHash = hashToken(verifyToken)
  await saveAccount({ ...account, verifyTokenHash: tokenHash })
  await writeRecord(verifyKey(tokenHash), { accountId: account.id })
  return verifyToken
}

/** Confirm the email behind a token; the token works once. */
export async function confirmEmail(token: string): Promise<SignAccount | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null
  const tokenHash = hashToken(token)
  const index = await readRecord<{ accountId?: string }>(verifyKey(tokenHash))
  if (!index?.accountId) return null
  const account = await getAccount(index.accountId)
  if (!account || account.verifyTokenHash !== tokenHash) return null
  const confirmed = await saveAccount({ ...account, emailVerified: true, verifyTokenHash: undefined })
  await writeRecord(verifyKey(tokenHash), { used: true })
  return confirmed
}

const ACTIVE = new Set(['active', 'trialing'])

/** The plan that is paid and current, if any. */
export function activePlan(account: SignAccount): SignPlan | undefined {
  if (!account.subscriptionStatus || !ACTIVE.has(account.subscriptionStatus)) return undefined
  return signPlan(account.plan)
}

/**
 * Copy Stripe's subscription onto the account. Gone (null) or ended
 * subscriptions clear the plan, so a late event cannot bring one back.
 */
export function applySubscription(
  account: SignAccount,
  sub: StripeSubscription | null,
): SignAccount {
  if (!sub) {
    return { ...account, subscriptionStatus: 'canceled', plan: undefined, cancelAtPeriodEnd: false }
  }
  const plan = signPlanByLookupKey(sub.items?.data?.[0]?.price?.lookup_key)
  const { start, end } = subscriptionPeriod(sub)
  return {
    ...account,
    stripeCustomerId: sub.customer || account.stripeCustomerId,
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    plan: plan?.id,
    periodStart: start ? new Date(start * 1000).toISOString() : account.periodStart,
    periodEnd: end ? new Date(end * 1000).toISOString() : account.periodEnd,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  }
}

export type SendingAllowance = {
  allowed: boolean
  used: number
  limit: number
  plan?: SignPlan
  reason?: 'no-plan' | 'past-due' | 'limit'
  message?: string
}

/**
 * Documents sent this billing period, against the plan's limit. A document
 * counts once, when it is first sent; sending its links again is free.
 */
export function sendingAllowance(
  account: SignAccount,
  envelopes: Pick<EnvelopeSummary, 'firstSentAt'>[],
  now = new Date(),
): SendingAllowance {
  const plan = activePlan(account)
  const since = account.periodStart
    ? new Date(account.periodStart)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const used = envelopes.filter((e) => e.firstSentAt && new Date(e.firstSentAt) >= since).length
  if (!plan) {
    const pastDue = account.subscriptionStatus === 'past_due' || account.subscriptionStatus === 'unpaid'
    return {
      allowed: false,
      used,
      limit: 0,
      reason: pastDue ? 'past-due' : 'no-plan',
      message: pastDue
        ? 'Your last payment did not go through. Update your card to keep sending.'
        : 'Choose a plan to send documents for signing.',
    }
  }
  if (used >= plan.contractLimit) {
    return {
      allowed: false,
      used,
      limit: plan.contractLimit,
      plan,
      reason: 'limit',
      message: `You have sent ${used} of ${plan.contractLimit} documents this month on ${plan.name}.${
        plan.id === 'starter' ? ' Upgrade to Growth to send more.' : ' More can be sent when your next month starts.'
      }`,
    }
  }
  return { allowed: true, used, limit: plan.contractLimit, plan }
}
