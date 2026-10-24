import { describe, expect, it } from 'vitest'
import { isEntitlementActive, type SignEntitlement } from './entitlements'

function ent(partial: Partial<SignEntitlement>): SignEntitlement {
  return {
    email: 'a@example.com',
    plan: 'starter',
    stripeCustomerId: 'cus',
    subscriptionId: 'sub',
    status: 'active',
    contractLimit: 5,
    currentPeriodEnd: null,
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

describe('isEntitlementActive', () => {
  it('requires active/trialing', () => {
    expect(isEntitlementActive(ent({ status: 'active' }))).toBe(true)
    expect(isEntitlementActive(ent({ status: 'trialing' }))).toBe(true)
    expect(isEntitlementActive(ent({ status: 'canceled' }))).toBe(false)
    expect(isEntitlementActive(ent({ status: 'unpaid' }))).toBe(false)
    expect(isEntitlementActive(null)).toBe(false)
  })

  it('rejects expired currentPeriodEnd', () => {
    expect(
      isEntitlementActive(
        ent({ status: 'active', currentPeriodEnd: '2020-01-01T00:00:00.000Z' }),
      ),
    ).toBe(false)
  })
})
