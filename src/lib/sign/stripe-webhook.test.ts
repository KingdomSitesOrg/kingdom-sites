import { beforeEach, describe, expect, it, vi } from 'vitest'

const { saveEntitlement, getEmailForSubscription, planFromPriceId } = vi.hoisted(() => ({
  saveEntitlement: vi.fn(async (e: unknown) => e),
  getEmailForSubscription: vi.fn(async () => null as string | null),
  planFromPriceId: vi.fn((priceId: string | null | undefined) => {
    if (priceId === 'price_starter') return 'starter'
    if (priceId === 'price_growth') return 'growth'
    return null
  }),
}))

vi.mock('./entitlements', async () => {
  const actual = await vi.importActual<typeof import('./entitlements')>('./entitlements')
  return {
    ...actual,
    saveEntitlement,
    getEmailForSubscription,
    planFromPriceId,
  }
})

vi.mock('@/lib/billing', () => ({
  contractLimitForPlan: (plan: string) => (plan === 'growth' ? 20 : 5),
}))

import {
  applyCheckoutSessionCompleted,
  applySubscriptionDeleted,
  applySubscriptionUpdated,
} from './stripe-webhook'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_PRICE_STARTER = 'price_starter'
  process.env.STRIPE_PRICE_GROWTH = 'price_growth'
})

function fakeStripe(sub: Record<string, unknown>) {
  return {
    subscriptions: {
      retrieve: vi.fn(async () => sub),
    },
    customers: {
      retrieve: vi.fn(async () => ({ deleted: false, email: 'paid@example.com' })),
    },
  } as never
}

describe('webhook entitlement updates', () => {
  it('marks entitlement active on checkout.session.completed', async () => {
    const sub = {
      id: 'sub_1',
      status: 'active',
      customer: 'cus_1',
      metadata: { sign_plan: 'starter' },
      items: {
        data: [{ price: { id: 'price_starter' }, current_period_end: 2_000_000_000 }],
      },
    }
    const session = {
      mode: 'subscription',
      customer: 'cus_1',
      customer_details: { email: 'paid@example.com' },
      subscription: 'sub_1',
      metadata: { sign_plan: 'starter' },
    }
    const result = await applyCheckoutSessionCompleted(fakeStripe(sub), session as never)
    expect(result).toMatchObject({
      email: 'paid@example.com',
      plan: 'starter',
      status: 'active',
      contractLimit: 5,
      subscriptionId: 'sub_1',
      stripeCustomerId: 'cus_1',
    })
    expect(saveEntitlement).toHaveBeenCalled()
  })

  it('canceled subscription loses access (status canceled)', async () => {
    getEmailForSubscription.mockResolvedValueOnce('paid@example.com')
    const sub = {
      id: 'sub_1',
      status: 'canceled',
      customer: 'cus_1',
      metadata: { sign_plan: 'starter' },
      items: { data: [{ price: { id: 'price_starter' }, current_period_end: 1_700_000_000 }] },
    }
    const result = await applySubscriptionDeleted(fakeStripe(sub), sub as never)
    expect(result).toMatchObject({
      email: 'paid@example.com',
      status: 'canceled',
      plan: 'starter',
    })
  })

  it('subscription.updated can flip status to active', async () => {
    getEmailForSubscription.mockResolvedValueOnce('growth@example.com')
    const sub = {
      id: 'sub_2',
      status: 'active',
      customer: 'cus_2',
      metadata: { sign_plan: 'growth' },
      items: { data: [{ price: { id: 'price_growth' }, current_period_end: 2_000_000_000 }] },
    }
    const result = await applySubscriptionUpdated(fakeStripe(sub), sub as never)
    expect(result).toMatchObject({
      email: 'growth@example.com',
      plan: 'growth',
      status: 'active',
      contractLimit: 20,
    })
  })
})
