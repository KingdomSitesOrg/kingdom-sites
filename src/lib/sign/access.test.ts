import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./auth', () => ({
  AuthError: class AuthError extends Error {
    status = 401
    constructor(message = 'Unauthorized') {
      super(message)
      this.name = 'AuthError'
    }
  },
  getAdminSession: vi.fn(),
}))

vi.mock('./entitlements', () => ({
  getEntitlement: vi.fn(),
  isEntitlementActive: vi.fn((e: { status?: string } | null) => {
    if (!e) return false
    return e.status === 'active' || e.status === 'trialing'
  }),
}))

vi.mock('./store', () => ({
  countEnvelopesForOwner: vi.fn(),
}))

import { getAdminSession, AuthError } from './auth'
import { getEntitlement, isEntitlementActive } from './entitlements'
import { countEnvelopesForOwner } from './store'
import {
  assertCanCreateEnvelope,
  ForbiddenError,
  requireSignAccess,
  type SignAccess,
} from './access'

const getSession = getAdminSession as unknown as ReturnType<typeof vi.fn>
const getEnt = getEntitlement as unknown as ReturnType<typeof vi.fn>
const countOwner = countEnvelopesForOwner as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.ADMIN_EMAIL
})

describe('requireSignAccess', () => {
  it('blocks unpaid users without a session', async () => {
    getSession.mockResolvedValue(null)
    await expect(requireSignAccess()).rejects.toBeInstanceOf(AuthError)
  })

  it('blocks session without active subscription', async () => {
    getSession.mockResolvedValue({ email: 'user@example.com', exp: Date.now() + 10000 })
    getEnt.mockResolvedValue({ email: 'user@example.com', status: 'canceled', plan: 'starter' })
    await expect(requireSignAccess()).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('allows active starter subscriber', async () => {
    getSession.mockResolvedValue({ email: 'starter@example.com', exp: Date.now() + 10000 })
    getEnt.mockResolvedValue({
      email: 'starter@example.com',
      status: 'active',
      plan: 'starter',
      contractLimit: 5,
    })
    const access = await requireSignAccess()
    expect(access.isAdmin).toBe(false)
    expect(access.entitlement?.plan).toBe('starter')
  })

  it('allows ADMIN_EMAIL owner override without subscription', async () => {
    process.env.ADMIN_EMAIL = 'owner@kingdom-sites.com'
    getSession.mockResolvedValue({ email: 'owner@kingdom-sites.com', exp: Date.now() + 10000 })
    const access = await requireSignAccess()
    expect(access.isAdmin).toBe(true)
    expect(getEnt).not.toHaveBeenCalled()
  })
})

describe('assertCanCreateEnvelope limits', () => {
  function subscriber(plan: 'starter' | 'growth', limit: number): SignAccess {
    return {
      session: { email: `${plan}@example.com`, exp: Date.now() + 10000 },
      isAdmin: false,
      entitlement: {
        email: `${plan}@example.com`,
        plan,
        stripeCustomerId: 'cus_x',
        subscriptionId: 'sub_x',
        status: 'active',
        contractLimit: limit,
        currentPeriodEnd: null,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  it('allows starter create until 5', async () => {
    countOwner.mockResolvedValue(4)
    await expect(assertCanCreateEnvelope(subscriber('starter', 5))).resolves.toBeUndefined()
    countOwner.mockResolvedValue(5)
    await expect(assertCanCreateEnvelope(subscriber('starter', 5))).rejects.toMatchObject({
      code: 'contract_limit',
      status: 403,
    })
  })

  it('allows growth create until 20', async () => {
    countOwner.mockResolvedValue(19)
    await expect(assertCanCreateEnvelope(subscriber('growth', 20))).resolves.toBeUndefined()
    countOwner.mockResolvedValue(20)
    await expect(assertCanCreateEnvelope(subscriber('growth', 20))).rejects.toMatchObject({
      code: 'contract_limit',
      status: 403,
    })
  })

  it('admin override bypasses contract limits', async () => {
    countOwner.mockResolvedValue(999)
    await expect(
      assertCanCreateEnvelope({
        session: { email: 'owner@kingdom-sites.com', exp: Date.now() + 10000 },
        isAdmin: true,
        entitlement: null,
      }),
    ).resolves.toBeUndefined()
    expect(countOwner).not.toHaveBeenCalled()
  })
})

describe('isEntitlementActive passthrough', () => {
  it('treats canceled as inactive', () => {
    expect(isEntitlementActive({ status: 'canceled' } as never)).toBe(false)
    expect(isEntitlementActive({ status: 'active' } as never)).toBe(true)
  })
})
