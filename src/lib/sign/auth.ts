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

type SessionPayload = { email: string; exp: number }

export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
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
    return payload
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  return parseSessionToken(jar.get(SIGN_SESSION_COOKIE)?.value)
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
