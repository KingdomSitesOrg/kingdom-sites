import { beforeEach, describe, expect, it, vi } from 'vitest'

/* The contact form's failures reach Sentry (T-382). Email and the webhook are
   replaced by stand-ins: nothing is sent anywhere. */

const { captureException, captureMessage, deliver } = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  deliver: { email: true, webhook: false, throws: false },
}))

vi.mock('@sentry/nextjs', () => ({ captureException, captureMessage }))
vi.mock('@/lib/notify', () => ({
  notifyThomas: async () => {
    if (deliver.throws) throw new Error('Resend is down')
    return deliver.email
  },
}))
vi.mock('@/lib/refer/credit', () => ({ creditReferral: async () => null }))

const { POST } = await import('./route')

let ip = 0
const send = () =>
  POST(
    new Request('https://kingdom-sites.com/api/inquiry', {
      method: 'POST',
      // A new address each time, so the form's own 5-in-10-minutes limit stays out of the way.
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `192.0.2.${++ip}` },
      body: JSON.stringify({ name: 'Test Visitor', email: 'visitor@example.com', message: 'Hello', elapsedMs: 5000 }),
    }),
  )

beforeEach(() => {
  captureException.mockClear()
  captureMessage.mockClear()
  Object.assign(deliver, { email: true, webhook: false, throws: false })
  delete process.env.LEAD_WEBHOOK_URL
})

describe('POST /api/inquiry', () => {
  it('delivers without reporting anything when the email goes', async () => {
    const res = await send()
    expect(await res.json()).toEqual({ ok: true })
    expect(captureException).not.toHaveBeenCalled()
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('reports to Sentry when the enquiry could not be delivered', async () => {
    deliver.email = false
    const res = await send()
    expect(res.status).toBe(502)
    expect(captureMessage).toHaveBeenCalledWith(expect.stringContaining('could not be delivered'), 'error')
  })

  it('reports to Sentry when sending throws', async () => {
    deliver.throws = true
    const res = await send()
    expect(res.status).toBe(500)
    expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: 'Resend is down' }))
  })
})
