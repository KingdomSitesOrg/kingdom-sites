import { describe, expect, it, beforeEach } from 'vitest'
import { CHAT, inboxRow, isTestAddress, sameKey, shouldAlert, take, resetChatLimitsForTests, tidy, visitorView, type Conversation } from './chat'

const convo = (over: Partial<Conversation> = {}): Conversation => ({
  id: 'abc123',
  key: 'secret-key',
  name: 'Grace',
  email: 'grace@example.com',
  createdAt: '2026-11-04T00:00:00.000Z',
  updatedAt: '2026-11-04T00:00:00.000Z',
  messages: [{ id: 'm1', from: 'visitor', text: 'Hello', at: '2026-11-04T00:00:00.000Z' }],
  ...over,
})

describe('messages', () => {
  beforeEach(() => resetChatLimitsForTests())

  it('never emails an address that cannot receive mail', () => {
    expect(isTestAddress('a@example.com')).toBe(true)
    expect(isTestAddress('a@school.test')).toBe(true)
    expect(isTestAddress('a@gmail.com')).toBe(false)
    expect(isTestAddress('a@myexample.com')).toBe(false)
  })

  it('alerts once, then not again until the other side has looked or a while has passed', () => {
    const now = Date.parse('2026-11-04T01:00:00.000Z')
    expect(shouldAlert(undefined, undefined, now)).toBe(true)
    const alerted = '2026-11-04T00:55:00.000Z'
    expect(shouldAlert(alerted, undefined, now)).toBe(false)
    expect(shouldAlert(alerted, '2026-11-04T00:56:00.000Z', now)).toBe(true)
    expect(shouldAlert(alerted, undefined, now + CHAT.alertQuietMs)).toBe(true)
  })

  it('keeps the private key out of what the visitor gets back', () => {
    expect(JSON.stringify(visitorView(convo()))).not.toContain('secret-key')
  })

  it('marks a conversation unread until Thomas has seen the last message', () => {
    expect(inboxRow(convo()).unread).toBe(true)
    expect(inboxRow(convo({ thomasSeenAt: '2026-11-04T00:01:00.000Z' })).unread).toBe(false)
  })

  it('limits conversations started per visitor per day', () => {
    const results = Array.from({ length: CHAT.startsPerDay + 1 }, () => take('start', '1.2.3.4'))
    expect(results.at(-1)).toBe(false)
    expect(take('start', '5.6.7.8')).toBe(true)
  })

  it('compares keys exactly and tidies text', () => {
    expect(sameKey('abc', 'abc')).toBe(true)
    expect(sameKey('abc', 'abd')).toBe(false)
    expect(sameKey('abc', 'abcd')).toBe(false)
    expect(tidy('  hi\r\n\n\n\nthere  ', 100)).toBe('hi\n\nthere')
  })
})
