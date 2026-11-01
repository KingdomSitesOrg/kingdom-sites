import { afterEach, describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { newSignerToken } from './auth'
import { emailConfigured, sendMagicLinkEmail } from './email'
import { checkUploadedPdf } from './pdf'
import { isWellFormedSignerToken, signerPublicView, signersWithoutLine } from './placement'
import type { Envelope, Signer } from './types'

function signer(id: string, partial: Partial<Signer> = {}): Signer {
  return {
    id,
    name: id === 'sig_c' ? 'Casey Client' : 'Pat Provider',
    email: `${id}@example.com`,
    role: id === 'sig_c' ? 'Client' : 'Provider',
    token: newSignerToken(),
    status: 'pending',
    ...partial,
  }
}

function envelope(partial: Partial<Envelope> = {}): Envelope {
  return {
    id: 'env_1',
    title: 'Agreement',
    status: 'draft',
    createdAt: '2026-10-30T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
    pageCount: 3,
    originalPdfKey: 'pdfs/env_1-original.pdf',
    signers: [signer('sig_c'), signer('sig_p')],
    fields: [],
    audit: [],
    ...partial,
  }
}

const line = (signerId: string) => ({
  id: `fld_${signerId}_sig`,
  type: 'signature' as const,
  signerId,
  page: 3,
  x: 0.1,
  y: 0.7,
  width: 0.42,
  height: 0.11,
})

describe('signersWithoutLine (Send waits until every signer has a place to sign)', () => {
  it('lists every signer of a new document, which starts with no lines', () => {
    expect(signersWithoutLine(envelope()).map((s) => s.id)).toEqual(['sig_c', 'sig_p'])
  })

  it('lists only the signer still missing a line', () => {
    const env = envelope({ fields: [line('sig_c')] })
    expect(signersWithoutLine(env).map((s) => s.id)).toEqual(['sig_p'])
  })

  it('is empty once each signer has a line', () => {
    const env = envelope({ fields: [line('sig_c'), line('sig_p')] })
    expect(signersWithoutLine(env)).toEqual([])
  })
})

describe('isWellFormedSignerToken', () => {
  it('accepts the tokens Sign issues', () => {
    for (let i = 0; i < 20; i++) expect(isWellFormedSignerToken(newSignerToken())).toBe(true)
  })

  it('refuses paths, blanks and short guesses before any lookup', () => {
    for (const bad of ['', 'abc', '../../envelopes/env_1', 'a/b', 'x'.repeat(65), null, undefined]) {
      expect(isWellFormedSignerToken(bad)).toBe(false)
    }
  })
})

describe('checkUploadedPdf (uploads that are not usable PDFs get a plain 400, not a server error)', () => {
  async function pdf(pages: number): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    for (let i = 0; i < pages; i++) doc.addPage([612, 792])
    return doc.save({ useObjectStreams: false })
  }

  it('reads the page count of a real PDF', async () => {
    expect(await checkUploadedPdf(await pdf(3))).toEqual({ ok: true, pageCount: 3 })
  })

  it('refuses a file that is not a PDF', async () => {
    const result = await checkUploadedPdf(Buffer.from('hello, I am a photo'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/not a PDF/)
  })

  it('refuses a damaged PDF', async () => {
    const result = await checkUploadedPdf(Buffer.from('%PDF-1.7\nnothing else'))
    expect(result.ok).toBe(false)
  })

  it('refuses a password-protected PDF with a way out', async () => {
    const text = Buffer.from(await pdf(1)).toString('latin1')
    const locked = text.replace('/Root', '/Encrypt 1 0 R\n/Root')
    expect(locked).not.toBe(text)
    const result = await checkUploadedPdf(Buffer.from(locked, 'latin1'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/password-protected/)
  })
})

describe('signerPublicView.signedPdfReady', () => {
  it('is false until the stamped PDF exists', () => {
    const env = envelope({ status: 'sent', fields: [line('sig_c'), line('sig_p')] })
    expect(signerPublicView(env, 'sig_c')?.signedPdfReady).toBe(false)
  })

  it('is true once the document is completed with its stamped PDF', () => {
    const env = envelope({
      status: 'completed',
      completedPdfKey: 'pdfs/env_1-completed.pdf',
      signers: [signer('sig_c', { status: 'signed' }), signer('sig_p', { status: 'signed' })],
      fields: [line('sig_c'), line('sig_p')],
    })
    expect(signerPublicView(env, 'sig_c')?.signedPdfReady).toBe(true)
  })
})

describe('Sign email with a local mail catcher', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('goes to the catcher and never to Resend, even with a Resend key present', async () => {
    vi.stubEnv('SIGN_MAIL_CATCHER_URL', 'http://127.0.0.1:54324/')
    vi.stubEnv('RESEND_API_KEY', 're_should_not_be_used')
    const fetchMock = vi.fn(async () => new Response('{"ID":"x"}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(emailConfigured()).toBe(true)
    const sent = await sendMagicLinkEmail({
      to: 'client@example.com',
      signerName: 'Casey',
      title: 'Agreement',
      token: newSignerToken(),
    })

    expect(sent).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:54324/api/v1/send')
    expect(String(init.body)).toContain('client@example.com')
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('api.resend.com')
  })

  it('reports email as not set up when neither is configured', () => {
    vi.stubEnv('SIGN_MAIL_CATCHER_URL', '')
    vi.stubEnv('RESEND_API_KEY', '')
    expect(emailConfigured()).toBe(false)
  })
})
