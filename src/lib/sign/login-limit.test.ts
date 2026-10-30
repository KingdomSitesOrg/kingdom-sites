import { beforeEach, describe, expect, it } from 'vitest'
import {
  LOGIN_LOCK_MS,
  LOGIN_WINDOW_MS,
  clearLoginFailures,
  clientIp,
  lockedMessage,
  loginLimitKeys,
  loginLockedFor,
  recordLoginFailure,
  resetLoginLimits,
} from './login-limit'

const T0 = Date.UTC(2026, 9, 30, 12, 0, 0)

function fail(keys: string[], times: number, start = T0) {
  for (let i = 0; i < times; i++) recordLoginFailure(keys, start + i * 1000)
}

describe('sign-in throttle', () => {
  beforeEach(() => resetLoginLimits())

  it('stays open after 9 wrong tries', () => {
    const keys = loginLimitKeys('thomas@example.com', '1.2.3.4')
    fail(keys, 9)
    expect(loginLockedFor(keys, T0 + 10_000)).toBe(0)
  })

  it('pauses that email after 10 wrong tries within 15 minutes', () => {
    const keys = loginLimitKeys('Thomas@Example.com', '1.2.3.4')
    fail(keys, 10)
    expect(loginLockedFor(loginLimitKeys('thomas@example.com', '9.9.9.9'), T0 + 10_000)).toBeGreaterThan(0)
  })

  it('pauses that address too, whichever email it tries next', () => {
    fail(loginLimitKeys('a@example.com', '1.2.3.4'), 10)
    expect(loginLockedFor(loginLimitKeys('b@example.com', '1.2.3.4'), T0 + 10_000)).toBeGreaterThan(0)
    expect(loginLockedFor(loginLimitKeys('b@example.com', '5.6.7.8'), T0 + 10_000)).toBe(0)
  })

  it('does not count tries older than the window', () => {
    const keys = loginLimitKeys('thomas@example.com', null)
    fail(keys, 9)
    recordLoginFailure(keys, T0 + LOGIN_WINDOW_MS + 60_000)
    expect(loginLockedFor(keys, T0 + LOGIN_WINDOW_MS + 61_000)).toBe(0)
  })

  it('opens again once the pause is over', () => {
    const keys = loginLimitKeys('thomas@example.com', '1.2.3.4')
    fail(keys, 10)
    expect(loginLockedFor(keys, T0 + 9_000 + LOGIN_LOCK_MS + 1)).toBe(0)
  })

  it('a right password clears the count', () => {
    const keys = loginLimitKeys('thomas@example.com', '1.2.3.4')
    fail(keys, 9)
    clearLoginFailures(keys)
    recordLoginFailure(keys, T0 + 20_000)
    expect(loginLockedFor(keys, T0 + 21_000)).toBe(0)
  })

  it('says how long to wait in plain words', () => {
    expect(lockedMessage(14 * 60_000 + 1)).toBe('Too many wrong tries. Sign-in is paused; try again in 15 minutes.')
    expect(lockedMessage(30_000)).toMatch(/1 minute\.$/)
  })

  it('reads the visitor address from the proxy header', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9')
    expect(clientIp(new Headers())).toBeNull()
  })
})
