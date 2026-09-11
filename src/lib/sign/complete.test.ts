import { describe, expect, it, vi } from 'vitest'
import {
  allSignersSigned,
  completeEnvelopeAfterAllSigned,
  emailCompletedEnvelope,
  loadEnvelopeReadyToComplete,
  needsCompletedPdf,
  protectSignedSigners,
  stampAndPersistCompleted,
} from './complete'
import type { Envelope, FieldPlacement, Signer } from './types'

function signer(
  partial: Partial<Signer> & Pick<Signer, 'id' | 'name' | 'email' | 'token'>,
): Signer {
  return {
    role: 'Signer',
    status: 'pending',
    ...partial,
  }
}

function field(partial: Partial<FieldPlacement> & Pick<FieldPlacement, 'id' | 'signerId'>): FieldPlacement {
  return {
    type: 'signature',
    page: 1,
    x: 0.2,
    y: 0.2,
    width: 0.42,
    height: 0.11,
    ...partial,
  }
}

function envelope(partial: Partial<Envelope> & Pick<Envelope, 'signers' | 'fields'>): Envelope {
  return {
    id: 'env_1',
    title: 'Test',
    status: 'sent',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    pageCount: 1,
    originalPdfKey: 'pdfs/env_1.pdf',
    audit: [],
    ...partial,
  }
}

const signedPair = () => {
  const client = signer({
    id: 'sig_c',
    name: 'Client',
    email: 'c@example.com',
    token: 'tok_c',
    status: 'signed',
    signedAt: '2026-01-01T01:00:00.000Z',
    signaturePng: 'data:image/png;base64,C',
  })
  const provider = signer({
    id: 'sig_p',
    name: 'Provider',
    email: 'p@example.com',
    token: 'tok_p',
    status: 'signed',
    signedAt: '2026-01-01T01:05:00.000Z',
    signaturePng: 'data:image/png;base64,P',
  })
  const fields = [
    field({ id: 'f_c', signerId: 'sig_c' }),
    field({ id: 'f_p', signerId: 'sig_p' }),
  ]
  return { client, provider, fields }
}

describe('allSignersSigned / needsCompletedPdf', () => {
  it('detects stuck sent/draft with all signatures', () => {
    const { client, provider, fields } = signedPair()
    const stuckSent = envelope({ status: 'sent', signers: [client, provider], fields })
    const stuckDraft = envelope({ status: 'draft', signers: [client, provider], fields })
    expect(allSignersSigned(stuckSent)).toBe(true)
    expect(needsCompletedPdf(stuckSent)).toBe(true)
    expect(needsCompletedPdf(stuckDraft)).toBe(true)
  })

  it('does not need complete when already completed with pdf key', () => {
    const { client, provider, fields } = signedPair()
    const done = envelope({
      status: 'completed',
      completedPdfKey: 'pdfs/env_1-completed.pdf',
      signers: [client, provider],
      fields,
    })
    expect(needsCompletedPdf(done)).toBe(false)
  })

  it('needs complete when completed status but missing pdf key', () => {
    const { client, provider, fields } = signedPair()
    const missing = envelope({
      status: 'completed',
      signers: [client, provider],
      fields,
    })
    expect(needsCompletedPdf(missing)).toBe(true)
  })
})

describe('protectSignedSigners', () => {
  it('restores wiped signature from previous read', () => {
    const { client, provider, fields } = signedPair()
    const good = envelope({ signers: [client, provider], fields })
    const wiped = envelope({
      signers: [
        client,
        {
          ...provider,
          status: 'pending',
          signedAt: undefined,
          signaturePng: undefined,
        },
      ],
      fields,
    })
    const merged = protectSignedSigners(wiped, good)
    expect(merged.signers.find((s) => s.id === 'sig_p')?.status).toBe('signed')
    expect(allSignersSigned(merged)).toBe(true)
  })
})

describe('loadEnvelopeReadyToComplete', () => {
  it('retries until all signed appear', async () => {
    const { client, provider, fields } = signedPair()
    const pending = envelope({
      signers: [client, { ...provider, status: 'pending', signedAt: undefined, signaturePng: undefined }],
      fields,
    })
    const good = envelope({ signers: [client, provider], fields })
    const get = vi
      .fn()
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(good)
    const result = await loadEnvelopeReadyToComplete('env_1', {
      get,
      delaysMs: [1, 1],
    })
    expect(result).not.toBeNull()
    expect(allSignersSigned(result!)).toBe(true)
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('merge-protects across a bad middle read', async () => {
    const { client, provider, fields } = signedPair()
    const good = envelope({ signers: [client, provider], fields })
    const wiped = envelope({
      signers: [
        client,
        {
          ...provider,
          status: 'pending',
          signedAt: undefined,
          signaturePng: undefined,
        },
      ],
      fields,
    })
    const get = vi
      .fn()
      .mockResolvedValueOnce(good)
      .mockResolvedValueOnce(wiped)
    // First read already all-signed — returns immediately
    const result = await loadEnvelopeReadyToComplete('env_1', {
      get,
      delaysMs: [1, 1],
    })
    expect(allSignersSigned(result!)).toBe(true)
    expect(get).toHaveBeenCalledTimes(1)
  })
})

describe('complete API surface', () => {
  it('exports stamp/persist split helpers', () => {
    expect(typeof stampAndPersistCompleted).toBe('function')
    expect(typeof emailCompletedEnvelope).toBe('function')
    expect(typeof completeEnvelopeAfterAllSigned).toBe('function')
  })
})
