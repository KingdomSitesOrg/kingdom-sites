import { beforeEach, describe, expect, it, vi } from 'vitest'

/* The "Submit a request" route (T-547): what reaches Thomas, and the spam guards.
   The email sender is replaced, so nothing is sent. */

const sent: { subject: string; body: string; replyTo: string }[] = []
vi.mock('@/lib/notify', () => ({
  notifyThomas: async (subject: string, body: string, replyTo: string) => {
    sent.push({ subject, body, replyTo })
    return true
  },
}))
vi.mock('@/lib/refer/credit', () => ({ creditReferral: async () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: () => {}, captureMessage: () => {} }))

const { POST } = await import('@/app/api/request/route')

let ip = 0
const post = (body: Record<string, unknown>) =>
  POST(
    new Request('http://x/api/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  )

const good = {
  name: 'Pat Lee',
  email: 'pat@example.com',
  business: 'Lee Windows',
  phone: '555 0100',
  decider: 'Someone else decides',
  deciderName: 'Sam Lee, owner',
  needs: ['A website', 'Something else'],
  needsOther: 'online booking',
  budget: 'about $8k',
  start: 'In the next month',
  website: 'leewindows.com',
  message: 'We need people to book a window clean online.',
  company: '',
  elapsedMs: 60_000,
}

beforeEach(() => {
  sent.length = 0
})

describe('POST /api/request', () => {
  it('sends Thomas every answer, with replies going to the visitor', async () => {
    const res = await post(good)
    expect(await res.json()).toEqual({ ok: true })
    expect(sent).toHaveLength(1)
    expect(sent[0].subject).toBe('Project request from Pat Lee')
    expect(sent[0].replyTo).toBe('pat@example.com')
    for (const line of [
      'Business: Lee Windows',
      'Phone: 555 0100',
      'Decision maker: Someone else decides: Sam Lee, owner',
      'Needs: A website, Something else: online booking',
      'Budget: about $8k',
      'Wants to start: In the next month',
      'Current website or app: leewindows.com',
      'We need people to book a window clean online.',
    ]) {
      expect(sent[0].body).toContain(line)
    }
  })

  it('drops choices the form does not offer', async () => {
    await post({ ...good, needs: ['A website', '<script>'] })
    expect(sent[0].body).toContain('Needs: A website\n')
  })

  it('takes the budget as typed, and leaves it optional', async () => {
    await post({ ...good, budget: '' })
    expect(sent[0].body).toContain('Budget: (not said)')
  })

  it('asks for the required answers', async () => {
    expect((await post({ ...good, name: '' })).status).toBe(400)
    expect((await post({ ...good, email: 'nope' })).status).toBe(400)
    expect((await post({ ...good, needs: [] })).status).toBe(400)
    expect((await post({ ...good, message: '' })).status).toBe(400)
    expect(sent).toHaveLength(0)
  })

  it('quietly drops bots: the hidden field filled, or sent too fast', async () => {
    expect(await (await post({ ...good, company: 'Acme' })).json()).toEqual({ ok: true })
    expect(await (await post({ ...good, elapsedMs: 500 })).json()).toEqual({ ok: true })
    expect(sent).toHaveLength(0)
  })

  it('stops a sixth send from one address within ten minutes', async () => {
    const same = () =>
      POST(
        new Request('http://x/api/request', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.9' },
          body: JSON.stringify(good),
        }),
      )
    for (let i = 0; i < 5; i++) expect((await same()).status).toBe(200)
    expect((await same()).status).toBe(429)
  })
})
