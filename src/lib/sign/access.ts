import { getAdminSession, AuthError, type SessionPayload } from './auth'
import { getEntitlement, isEntitlementActive, type SignEntitlement } from './entitlements'
import { countEnvelopesForOwner } from './store'

export class ForbiddenError extends Error {
  status = 403
  code?: string
  constructor(message = 'Forbidden', code?: string) {
    super(message)
    this.name = 'ForbiddenError'
    this.code = code
  }
}

export function adminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null
}

export function isOwnerAdmin(email: string): boolean {
  const admin = adminEmail()
  if (!admin) return false
  return email.trim().toLowerCase() === admin
}

export type SignAccess = {
  session: SessionPayload
  isAdmin: boolean
  entitlement: SignEntitlement | null
}

/**
 * Session required. Access granted if ADMIN_EMAIL owner override OR active subscription.
 */
export async function requireSignAccess(): Promise<SignAccess> {
  const session = await getAdminSession()
  if (!session) throw new AuthError('Unauthorized')
  const isAdmin = isOwnerAdmin(session.email)
  if (isAdmin) {
    return { session, isAdmin: true, entitlement: null }
  }
  const entitlement = await getEntitlement(session.email)
  if (!isEntitlementActive(entitlement)) {
    throw new ForbiddenError('An active Sign subscription is required.', 'subscription_required')
  }
  return { session, isAdmin: false, entitlement }
}

export async function getSignAccess(): Promise<SignAccess | null> {
  const session = await getAdminSession()
  if (!session) return null
  const isAdmin = isOwnerAdmin(session.email)
  if (isAdmin) return { session, isAdmin: true, entitlement: null }
  const entitlement = await getEntitlement(session.email)
  if (!isEntitlementActive(entitlement)) return null
  return { session, isAdmin: false, entitlement }
}

/** True when session exists and (admin OR active sub). */
export async function hasSignAccess(): Promise<boolean> {
  return Boolean(await getSignAccess())
}

export async function assertCanCreateEnvelope(access: SignAccess): Promise<void> {
  if (access.isAdmin) return
  const limit = access.entitlement?.contractLimit ?? 0
  const used = await countEnvelopesForOwner(access.session.email)
  if (used >= limit) {
    throw new ForbiddenError(
      `Plan limit reached (${used}/${limit} contracts). Upgrade to create more.`,
      'contract_limit',
    )
  }
}
