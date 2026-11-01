/**
 * Sign-in throttle: 10 wrong passwords within 15 minutes pauses sign-in for
 * that email and for that network address for 15 minutes. Kept in memory per
 * server instance, like the site's other form limits, so it slows a guesser
 * down without a store round trip on every sign-in.
 */
export const LOGIN_MAX_FAILURES = 10
export const LOGIN_WINDOW_MS = 15 * 60 * 1000
export const LOGIN_LOCK_MS = 15 * 60 * 1000

type Entry = { failures: number[]; lockedUntil: number }

const entries = new Map<string, Entry>()

export function loginLimitKeys(email: string, ip: string | null): string[] {
  const keys = [`email:${email.trim().toLowerCase()}`]
  if (ip) keys.push(`ip:${ip}`)
  return keys
}

/** The client's address as the hosting proxy reports it. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || null
}

/** Milliseconds until sign-in opens again for any of these keys (0 = open). */
export function loginLockedFor(keys: string[], now = Date.now()): number {
  let wait = 0
  for (const key of keys) {
    const entry = entries.get(key)
    if (entry && entry.lockedUntil > now) wait = Math.max(wait, entry.lockedUntil - now)
  }
  return wait
}

export function recordLoginFailure(keys: string[], now = Date.now()): void {
  for (const key of keys) {
    const entry = entries.get(key) ?? { failures: [], lockedUntil: 0 }
    entry.failures = entry.failures.filter((t) => now - t < LOGIN_WINDOW_MS)
    entry.failures.push(now)
    if (entry.failures.length >= LOGIN_MAX_FAILURES) {
      entry.lockedUntil = now + LOGIN_LOCK_MS
      entry.failures = []
    }
    entries.set(key, entry)
  }
  prune(now)
}

export function clearLoginFailures(keys: string[]): void {
  for (const key of keys) entries.delete(key)
}

/** Plain words for the pause. */
export function lockedMessage(waitMs: number): string {
  const minutes = Math.max(1, Math.ceil(waitMs / 60_000))
  return `Too many wrong tries. Sign-in is paused; try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
}

function prune(now: number): void {
  if (entries.size < 5000) return
  for (const [key, entry] of entries) {
    const recent = entry.failures.some((t) => now - t < LOGIN_WINDOW_MS)
    if (!recent && entry.lockedUntil <= now) entries.delete(key)
  }
}

/** Tests only. */
export function resetLoginLimits(): void {
  entries.clear()
}
