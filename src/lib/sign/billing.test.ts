import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'
import { activePlan, applySubscription, sendingAllowance, type SignAccount } from './accounts'
import {
  adminFromSession,
  canAccessEnvelope,
  hashPassword,
  ownerFor,
  userFromSession,
  verifyPassword,
} from './auth'
import { checkKeyMode, formEncode, verifyStripeSignature, type StripeSubscription } from './stripe'

const SECRET = 'whsec_test_secret'
const NOW = 1_793_400_000

function sign(payload: string, t = NOW, secret = SECRET) {
  return `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`
}

function account(partial: Partial<SignAccount> = {}): SignAccount {
  return {
    id: 'acc_0123456789abcdef01234567',
    email: 'pat@example.com',
    name: 'Pat',
    passwordHash: 'x:y',
    createdAt: '2026-10-01T00:00:00.000Z',
    emailVerified: true,
    stripeCustomerId: 'cus_1',
    ...partial,
  }
}

function sub(partial: Partial<StripeSubscription> = {}, lookup = 'sign_starter_monthly'): StripeSubscription {
  return {
    id: 'sub_1',
    status: 'active',
    customer: 'cus_1',
    items: {
      data: [
        {
          id: 'si_1',
          price: { id: 'price_1', lookup_key: lookup, unit_amount: 100, currency: 'usd' },
          current_period_start: Date.UTC(2026, 9, 15) / 1000,
          current_period_end: Date.UTC(2026, 10, 15) / 1000,
        },
      ],
    },
    ...partial,
  }
}

describe('verifyStripeSignature', () => {
  const payload = '{"id":"evt_1","type":"customer.subscription.updated"}'

  it('accepts Stripe’s signature over the raw body', () => {
    expect(verifyStripeSignature(payload, sign(payload), SECRET, NOW)).toBe(true)
  })

  it('refuses a changed body, a wrong secret, a missing header and an old timestamp', () => {
    expect(verifyStripeSignature(payload.replace('evt_1', 'evt_2'), sign(payload), SECRET, NOW)).toBe(false)
    expect(verifyStripeSignature(payload, sign(payload, NOW, 'whsec_other'), SECRET, NOW)).toBe(false)
    expect(verifyStripeSignature(payload, null, SECRET, NOW)).toBe(false)
    expect(verifyStripeSignature(payload, sign(payload, NOW - 600), SECRET, NOW)).toBe(false)
  })
})

describe('checkKeyMode (test mode everywhere but production)', () => {
  it('allows a test key anywhere', () => {
    expect(checkKeyMode('sk_test_abc', undefined)).toBe('sk_test_abc')
    expect(checkKeyMode('sk_test_abc', 'preview')).toBe('sk_test_abc')
  })

  it('refuses a live key outside production', () => {
    expect(() => checkKeyMode('sk_live_abc', undefined)).toThrow(/production/)
    expect(() => checkKeyMode('sk_live_abc', 'preview')).toThrow(/production/)
    expect(checkKeyMode('sk_live_abc', 'production')).toBe('sk_live_abc')
  })

  it('refuses something that is not a secret key', () => {
    expect(() => checkKeyMode('pk_test_abc', undefined)).toThrow()
  })
})

describe('formEncode', () => {
  it('encodes nested objects and arrays the way Stripe reads them', () => {
    expect(
      decodeURIComponent(
        formEncode({ line_items: [{ price: 'p', quantity: 1 }], metadata: { a: 'b' }, lookup_keys: ['x'] }),
      ),
    ).toBe('line_items[0][price]=p&line_items[0][quantity]=1&metadata[a]=b&lookup_keys[]=x')
  })
})

describe('applySubscription (the plan comes only from Stripe’s record)', () => {
  it('turns on the plan named by the price’s lookup key, with its period', () => {
    const next = applySubscription(account(), sub({}, 'sign_growth_monthly'))
    expect(activePlan(next)?.id).toBe('growth')
    expect(next.periodStart).toBe('2026-10-15T00:00:00.000Z')
  })

  it('a cancelled or missing subscription turns the plan off', () => {
    expect(activePlan(applySubscription(account(), sub({ status: 'canceled' })))).toBeUndefined()
    expect(activePlan(applySubscription(account({ plan: 'starter', subscriptionStatus: 'active' }), null))).toBeUndefined()
  })

  it('an unpaid subscription does not count as a plan', () => {
    expect(activePlan(applySubscription(account(), sub({ status: 'past_due' })))).toBeUndefined()
  })

  it('a price that is not a Sign plan grants nothing', () => {
    expect(activePlan(applySubscription(account(), sub({}, 'something_else')))).toBeUndefined()
  })
})

describe('sendingAllowance (documents sent this month against the plan)', () => {
  const starter = applySubscription(account(), sub())
  const sentOn = (iso: string) => ({ firstSentAt: iso })

  it('without a plan, nothing can be sent', () => {
    const a = sendingAllowance(account(), [])
    expect(a.allowed).toBe(false)
    expect(a.reason).toBe('no-plan')
  })

  it('counts only documents first sent in this billing month', () => {
    const a = sendingAllowance(starter, [sentOn('2026-10-10T00:00:00Z'), sentOn('2026-10-20T00:00:00Z'), {}])
    expect(a).toMatchObject({ allowed: true, used: 1, limit: 5 })
  })

  it('stops at the plan’s limit and points Starter at Growth', () => {
    const five = Array.from({ length: 5 }, () => sentOn('2026-10-20T00:00:00Z'))
    const a = sendingAllowance(starter, five)
    expect(a.allowed).toBe(false)
    expect(a.message).toMatch(/5 of 5.*Upgrade to Growth/)
  })

  it('asks for a new card when the payment failed', () => {
    const a = sendingAllowance(applySubscription(account(), sub({ status: 'past_due' })), [])
    expect(a.reason).toBe('past-due')
  })
})

describe('accounts and Thomas’s admin access stay apart', () => {
  const adminSession = { email: 'thomas@example.com', exp: Date.now() + 1000 }
  const accountSession = { ...adminSession, email: 'pat@example.com', accountId: 'acc_1' }

  it('an account session is never an admin session', () => {
    expect(adminFromSession(accountSession)).toBeNull()
    expect(adminFromSession(adminSession)).toBe(adminSession)
  })

  it('each sees only its own documents', () => {
    const admin = userFromSession(adminSession)!
    const pat = userFromSession(accountSession)!
    expect(canAccessEnvelope(admin, {})).toBe(true)
    expect(canAccessEnvelope(admin, { ownerId: 'acc_1' })).toBe(false)
    expect(canAccessEnvelope(pat, { ownerId: 'acc_1' })).toBe(true)
    expect(canAccessEnvelope(pat, { ownerId: 'acc_2' })).toBe(false)
    expect(canAccessEnvelope(pat, {})).toBe(false)
    expect(ownerFor(admin)).toBeNull()
    expect(ownerFor(pat)).toBe('acc_1')
  })
})

describe('passwords', () => {
  it('are stored hashed and checked', () => {
    const stored = hashPassword('correct horse battery')
    expect(stored).not.toContain('correct')
    expect(verifyPassword('correct horse battery', stored)).toBe(true)
    expect(verifyPassword('wrong horse battery', stored)).toBe(false)
  })
})
