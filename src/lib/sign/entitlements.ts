import { promises as fs } from 'fs'
import path from 'path'
import { put, get, del } from '@vercel/blob'
import type { SignPlanId } from '@/lib/billing'
import { contractLimitForPlan } from '@/lib/billing'

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'sign')

export type SignEntitlementStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | string

export type SignEntitlement = {
  email: string
  plan: SignPlanId
  stripeCustomerId: string
  subscriptionId: string
  status: SignEntitlementStatus
  contractLimit: number
  currentPeriodEnd: string | null
  updatedAt: string
}

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Safe filename segment from email (keeps @ for readability; encodes unsafe chars). */
export function entitlementKey(email: string): string {
  const normalized = normalizeEmail(email)
  return encodeURIComponent(normalized).replace(/%/g, '_')
}

function localPath(email: string): string {
  return path.join(LOCAL_ROOT, 'entitlements', `${entitlementKey(email)}.json`)
}

function blobPath(email: string): string {
  return `sign/entitlements/${entitlementKey(email)}.json`
}

function subIndexLocalPath(subscriptionId: string): string {
  return path.join(LOCAL_ROOT, 'entitlements-by-sub', `${subscriptionId}.json`)
}

function subIndexBlobPath(subscriptionId: string): string {
  return `sign/entitlements-by-sub/${subscriptionId}.json`
}

async function writeSubIndex(subscriptionId: string, email: string): Promise<void> {
  if (!subscriptionId) return
  const payload = JSON.stringify({ email: normalizeEmail(email), subscriptionId })
  if (blobEnabled()) {
    await put(subIndexBlobPath(subscriptionId), payload, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return
  }
  await ensureLocal()
  await fs.mkdir(path.join(LOCAL_ROOT, 'entitlements-by-sub'), { recursive: true })
  await fs.writeFile(subIndexLocalPath(subscriptionId), payload, 'utf8')
}

export async function getEmailForSubscription(subscriptionId: string): Promise<string | null> {
  if (!subscriptionId) return null
  try {
    if (blobEnabled()) {
      const result = await get(subIndexBlobPath(subscriptionId), { access: 'private' })
      if (!result || !('stream' in result) || !result.stream) return null
      const text = await new Response(result.stream).text()
      const parsed = JSON.parse(text) as { email?: string }
      return parsed.email?.trim().toLowerCase() || null
    }
    const raw = await fs.readFile(subIndexLocalPath(subscriptionId), 'utf8')
    const parsed = JSON.parse(raw) as { email?: string }
    return parsed.email?.trim().toLowerCase() || null
  } catch {
    return null
  }
}

async function ensureLocal(): Promise<void> {
  await fs.mkdir(path.join(LOCAL_ROOT, 'entitlements'), { recursive: true })
}

export function isEntitlementActive(entitlement: SignEntitlement | null | undefined): boolean {
  if (!entitlement) return false
  const status = String(entitlement.status || '').toLowerCase()
  if (status !== 'active' && status !== 'trialing') return false
  if (entitlement.currentPeriodEnd) {
    const end = Date.parse(entitlement.currentPeriodEnd)
    if (Number.isFinite(end) && end < Date.now()) return false
  }
  return true
}

export async function getEntitlement(email: string): Promise<SignEntitlement | null> {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  try {
    if (blobEnabled()) {
      const result = await get(blobPath(normalized), { access: 'private' })
      if (!result || !('stream' in result) || !result.stream) return null
      const text = await new Response(result.stream).text()
      return JSON.parse(text) as SignEntitlement
    }
    const raw = await fs.readFile(localPath(normalized), 'utf8')
    return JSON.parse(raw) as SignEntitlement
  } catch {
    return null
  }
}

export async function saveEntitlement(entitlement: SignEntitlement): Promise<SignEntitlement> {
  const normalized = normalizeEmail(entitlement.email)
  const payload: SignEntitlement = {
    ...entitlement,
    email: normalized,
    contractLimit:
      entitlement.contractLimit || contractLimitForPlan(entitlement.plan) || entitlement.contractLimit,
    updatedAt: new Date().toISOString(),
  }
  const json = JSON.stringify(payload, null, 2)
  if (blobEnabled()) {
    await put(blobPath(normalized), json, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
  } else {
    await ensureLocal()
    await fs.writeFile(localPath(normalized), json, 'utf8')
  }
  if (payload.subscriptionId) {
    await writeSubIndex(payload.subscriptionId, payload.email)
  }
  return payload
}

export async function deleteEntitlement(email: string): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return
  try {
    if (blobEnabled()) {
      await del(blobPath(normalized))
      return
    }
    await fs.unlink(localPath(normalized))
  } catch {
    /* ignore */
  }
}

export function planFromPriceId(priceId: string | null | undefined): SignPlanId | null {
  if (!priceId) return null
  const starter = process.env.STRIPE_PRICE_STARTER?.trim()
  const growth = process.env.STRIPE_PRICE_GROWTH?.trim()
  if (starter && priceId === starter) return 'starter'
  if (growth && priceId === growth) return 'growth'
  return null
}

export function buildEntitlementFromSubscription(input: {
  email: string
  plan: SignPlanId
  stripeCustomerId: string
  subscriptionId: string
  status: string
  currentPeriodEnd: number | null | undefined
}): SignEntitlement {
  return {
    email: normalizeEmail(input.email),
    plan: input.plan,
    stripeCustomerId: input.stripeCustomerId,
    subscriptionId: input.subscriptionId,
    status: input.status,
    contractLimit: contractLimitForPlan(input.plan),
    currentPeriodEnd: input.currentPeriodEnd
      ? new Date(input.currentPeriodEnd * 1000).toISOString()
      : null,
    updatedAt: new Date().toISOString(),
  }
}
