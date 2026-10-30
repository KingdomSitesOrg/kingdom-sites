import { createHmac, timingSafeEqual } from 'crypto'

/**
 * The few Stripe calls Sign billing needs, over Stripe's REST API (no SDK).
 * A live key is refused anywhere but Vercel production, so a laptop or a
 * preview build can only ever touch test mode.
 */

const API = 'https://api.stripe.com/v1'

export class StripeConfigError extends Error {}

export function stripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new StripeConfigError('STRIPE_SECRET_KEY is not set.')
  return checkKeyMode(key, process.env.VERCEL_ENV)
}

/** Live keys only in production; anything else must be a test key. */
export function checkKeyMode(key: string, vercelEnv: string | undefined): string {
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) {
    if (vercelEnv !== 'production') {
      throw new StripeConfigError('A live Stripe key is only allowed in production.')
    }
    return key
  }
  if (!key.startsWith('sk_test_') && !key.startsWith('rk_test_')) {
    throw new StripeConfigError('STRIPE_SECRET_KEY is not a Stripe secret key.')
  }
  return key
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

/** Stripe's form encoding, with nested keys: { a: { b: 1 } } → a[b]=1. */
export function formEncode(params: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          parts.push(formEncode(item as Record<string, unknown>, `${key}[${i}]`))
        } else {
          parts.push(`${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else if (typeof v === 'object') {
      parts.push(formEncode(v as Record<string, unknown>, key))
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
    }
  }
  return parts.filter(Boolean).join('&')
}

export async function stripeRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const key = stripeKey()
  const body = formEncode(params)
  const url = method === 'GET' && body ? `${API}${path}?${body}` : `${API}${path}`
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' ? body : undefined,
    signal: AbortSignal.timeout(15_000),
  })
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string; code?: string } })
    | null
  if (!response.ok || !data) {
    const err = new Error(data?.error?.message || `Stripe ${method} ${path} failed (${response.status})`)
    ;(err as Error & { code?: string }).code = data?.error?.code
    throw err
  }
  return data
}

export type StripePrice = { id: string; lookup_key: string | null; unit_amount: number | null; currency: string }

export type StripeSubscription = {
  id: string
  status: string
  customer: string
  metadata?: Record<string, string>
  cancel_at_period_end?: boolean
  current_period_start?: number
  current_period_end?: number
  items: {
    data: {
      id: string
      price: StripePrice
      current_period_start?: number
      current_period_end?: number
    }[]
  }
}

export type StripeCheckoutSession = {
  id: string
  url: string | null
  customer: string | null
  subscription: string | null
  client_reference_id: string | null
  mode: string
}

export async function priceByLookupKey(lookupKey: string): Promise<StripePrice | null> {
  const list = await stripeRequest<{ data: StripePrice[] }>('GET', '/prices', {
    lookup_keys: [lookupKey],
    active: true,
  })
  return list.data[0] ?? null
}

export async function getSubscription(id: string): Promise<StripeSubscription | null> {
  try {
    return await stripeRequest<StripeSubscription>('GET', `/subscriptions/${encodeURIComponent(id)}`)
  } catch (error) {
    if ((error as { code?: string }).code === 'resource_missing') return null
    throw error
  }
}

/** Billing period of a subscription (newer API versions keep it on the item). */
export function subscriptionPeriod(sub: StripeSubscription): { start?: number; end?: number } {
  const item = sub.items?.data?.[0]
  return {
    start: sub.current_period_start ?? item?.current_period_start,
    end: sub.current_period_end ?? item?.current_period_end,
  }
}

/**
 * Check a webhook's Stripe-Signature header (t=…,v1=…) against the raw body:
 * HMAC-SHA256 of "t.body" with the endpoint secret, within 5 minutes.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  now = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false
  const parts = header.split(',').map((p) => p.trim().split('='))
  const timestamp = Number(parts.find(([k]) => k === 't')?.[1])
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v || '')
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false
  if (Math.abs(now - timestamp) > toleranceSeconds) return false
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex'),
  )
  return signatures.some((sig) => {
    const given = Buffer.from(sig)
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
