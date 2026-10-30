import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'crypto'
import { cookies } from 'next/headers'

export const SIGN_SESSION_COOKIE = 'ks_sign_session'
const SESSION_DAYS = 14

function sessionSecret(): string {
  const explicit = process.env.SIGN_SESSION_SECRET?.trim()
  if (explicit) return explicit
  const admin = process.env.ADMIN_PASSWORD?.trim() || 'dev-only'
  return createHmac('sha256', 'kingdom-sites-sign').update(admin).digest('hex')
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64url')
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, 'base64url')
}

/** The Sign session cookie's settings (14 days, server-only, HTTPS in production). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  }
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim())
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const expectedPass = process.env.ADMIN_PASSWORD?.trim()
  if (!expectedEmail || !expectedPass) return false
  if (email.trim().toLowerCase() !== expectedEmail) return false
  const a = Buffer.from(password)
  const b = Buffer.from(expectedPass)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** A signed-in sender: Thomas (no accountId) or a Sign customer's account. */
type SessionPayload = { email: string; exp: number; accountId?: string }

export function createSessionToken(email: string, accountId?: string): string {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    ...(accountId ? { accountId } : {}),
  }
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function parseSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8')) as SessionPayload
    if (!payload?.email || typeof payload.exp !== 'number') return null
    if (payload.exp < Date.now()) return null
    if (payload.accountId !== undefined && typeof payload.accountId !== 'string') return null
    return payload
  } catch {
    return null
  }
}

/**
 * Thomas's admin session only. A Sign customer's session carries an accountId
 * and is never admin, so it cannot see his documents or the referrals page.
 */
export function adminFromSession(session: SessionPayload | null): SessionPayload | null {
  return session && !session.accountId ? session : null
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  return adminFromSession(parseSessionToken(jar.get(SIGN_SESSION_COOKIE)?.value))
}

export type SignUser =
  | { kind: 'admin'; email: string }
  | { kind: 'account'; email: string; accountId: string }

export function userFromSession(session: SessionPayload | null): SignUser | null {
  if (!session) return null
  return session.accountId
    ? { kind: 'account', email: session.email, accountId: session.accountId }
    : { kind: 'admin', email: session.email }
}

/** Whoever is signed in to send documents: Thomas or a customer account. */
export async function getSignUser(): Promise<SignUser | null> {
  const jar = await cookies()
  return userFromSession(parseSessionToken(jar.get(SIGN_SESSION_COOKIE)?.value))
}

/** Thomas sees only his own documents; an account sees only its own. */
export function canAccessEnvelope(user: SignUser, envelope: { ownerId?: string }): boolean {
  return user.kind === 'admin' ? !envelope.ownerId : envelope.ownerId === user.accountId
}

/** The owner value listEnvelopes filters on for this user. */
export function ownerFor(user: SignUser): string | null {
  return user.kind === 'admin' ? null : user.accountId
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getAdminSession()
  if (!session) throw new AuthError('Unauthorized')
  return session
}

export class AuthError extends Error {
  status = 401
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

/** Opaque random token for signer magic links */
export function newSignerToken(): string {
  return randomBytes(24).toString('base64url')
}

export function newId(prefix = ''): string {
  const id = randomBytes(12).toString('hex')
  return prefix ? `${prefix}_${id}` : id
}

/** Derive a stable key material helper (unused externally; keeps scrypt available if needed). */
export function deriveKey(password: string, salt: string): Buffer {
  return scryptSync(password, salt, 32)
}

/** Store a password as salt:hash (scrypt), never as itself. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  return `${salt}:${scryptSync(password, salt, 64).toString('base64url')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = scryptSync(password, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
