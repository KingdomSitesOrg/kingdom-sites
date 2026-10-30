import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* The chat route itself, with Claude replaced by a stand-in (T-382): the
   40-an-hour limit per IP address, the message a visitor sees at the limit,
   and failures reaching Sentry. */

const { captureException, answerWith } = vi.hoisted(() => ({
  captureException: vi.fn(),
  answerWith: { fail: false },
}))

vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('@/lib/intelligence-usage', () => ({
  spentToday: async () => ({ usd: 0 }),
  recordAnswer: async () => {},
}))
vi.mock('@/lib/intelligence-server', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/intelligence-server')>()
  return {
    ...real,
    apiKey: () => 'test-key',
    readKnowledge: () => 'What Thomas builds.',
    anthropic: () => ({
      messages: {
        stream: () => ({
          async *[Symbol.asyncIterator]() {
            if (answerWith.fail) throw new Error('Claude is unavailable')
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Thomas builds apps.' } }
          },
          finalMessage: async () => ({ content: [], stop_reason: 'end_turn', usage: {} }),
          abort: () => {},
        }),
      },
    }),
  }
})

const { POST } = await import('./route')
const { SAY, resetVisitorsForTests } = await import('@/lib/intelligence')

const ask = (ip: string) =>
  POST(
    new Request('https://kingdom-sites.com/api/intelligence', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'What do you build?' }] }),
    }),
  )

beforeEach(() => {
  resetVisitorsForTests()
  captureException.mockClear()
  answerWith.fail = false
  vi.useFakeTimers()
  vi.setSystemTime(Date.UTC(2026, 9, 30, 12))
})
afterEach(() => vi.useRealTimers())

describe('POST /api/intelligence', () => {
  it('answers 40 questions an hour from one IP address, then points to the contact form', async () => {
    // One question every 70 seconds: under the 10-in-10-minutes limit, 40 inside the hour.
    for (let i = 0; i < 40; i++) {
      const res = await ask('203.0.113.7')
      expect(res.status, `question ${i + 1}`).toBe(200)
      expect(await res.text()).toContain('Thomas builds apps.')
      vi.advanceTimersByTime(70_000)
    }
    const limited = await ask('203.0.113.7')
    expect(limited.status).toBe(429)
    const { error } = (await limited.json()) as { error: string }
    expect(error).toBe(SAY.hourFull)
    expect(error).toContain('/get-started')

    // Someone else is not held up by it.
    expect((await ask('198.51.100.4')).status).toBe(200)

    // An hour after the first question, the visitor can ask again.
    vi.advanceTimersByTime(20 * 60_000)
    expect((await ask('203.0.113.7')).status).toBe(200)
  })

  it('reports a failed answer to Sentry and tells the visitor', async () => {
    answerWith.fail = true
    const res = await ask('203.0.113.8')
    expect(await res.text()).toContain(SAY.failed)
    expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: 'Claude is unavailable' }))
  })
})
