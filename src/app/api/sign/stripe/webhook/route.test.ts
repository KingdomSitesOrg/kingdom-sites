import { createHmac } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SignAccount } from '@/lib/sign/accounts'

const saved: SignAccount[] = []
let stored: SignAccount | null = null

vi.mock('@/lib/sign/accounts', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/sign/accounts')>()
  return {
    ...real,
    getAccount: vi.fn(async () => stored),
    saveAccount: vi.fn(async (a: SignAccount) => {
      saved.push(a)
      return a
    }),
  }
})

vi.mock('@/lib/sign/stripe', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/sign/stripe')>()
  return {
    ...real,
    getSubscription: vi.fn(async (id: string) => ({
      id,
      status: 'active',
      customer: 'cus_real',
      items: { data: [{ id: 'si', price: { id: 'p', lookup_key: 'sign_growth_monthly', unit_amount: 1000, currency: 'usd' } }] },
    })),
  }
})

const SECRET = 'whsec_sign_test'

function request(event: object, secret = SECRET) {
  const body = JSON.stringify(event)
  const t = Math.floor(Date.now() / 1000)
  const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
  return new Request('http://localhost/api/sign/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': `t=${t},v1=${sig}` },
    body,
  })
}

const account = (partial: Partial<SignAccount> = {}): SignAccount => ({
  id: 'acc_0123456789abcdef01234567',
  email: 'pat@example.com',
  name: 'Pat',
  passwordHash: 'x:y',
  createdAt: '2026-10-01T00:00:00.000Z',
  emailVerified: true,
  stripeCustomerId: 'cus_real',
  ...partial,
})

const subscriptionUpdated = (customer: string) => ({
  id: 'evt_1',
  type: 'customer.subscription.updated',
  data: { object: { id: 'sub_1', customer, metadata: { signAccountId: 'acc_0123456789abcdef01234567' } } },
})

describe('Sign Stripe webhook', () => {
  beforeEach(() => {
    vi.stubEnv('SIGN_STRIPE_WEBHOOK_SECRET', SECRET)
    saved.length = 0
    stored = account()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('refuses a request not signed with the endpoint secret, and saves nothing', async () => {
    const { POST } = await import('./route')
    const res = await POST(request(subscriptionUpdated('cus_real'), 'whsec_forged'))
    expect(res.status).toBe(400)
    expect(saved).toHaveLength(0)
  })

  it('sets the plan from Stripe’s own record of the subscription', async () => {
    const { POST } = await import('./route')
    const res = await POST(request(subscriptionUpdated('cus_real')))
    expect(res.status).toBe(200)
    expect(saved.at(-1)).toMatchObject({ plan: 'growth', subscriptionStatus: 'active', stripeSubscriptionId: 'sub_1' })
  })

  it('ignores a claim for an account whose Stripe customer does not match', async () => {
    const { POST } = await import('./route')
    const res = await POST(request(subscriptionUpdated('cus_someone_else')))
    expect(res.status).toBe(200)
    expect(saved).toHaveLength(0)
  })

  it('answers 500 (so Stripe retries) when the secret is missing', async () => {
    vi.stubEnv('SIGN_STRIPE_WEBHOOK_SECRET', '')
    const { POST } = await import('./route')
    expect((await POST(request(subscriptionUpdated('cus_real')))).status).toBe(500)
  })
})
