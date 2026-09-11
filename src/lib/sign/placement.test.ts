import { describe, expect, it } from 'vitest'
import {
  dateOverlayBesideSignature,
  defaultSignatureField,
  formatSignedDateText,
  maxPageInRawFields,
  mergeEnvelope,
  mergeSigner,
  placementAtPointer,
  sanitizeField,
  signerPublicView,
} from './placement'
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
    pageCount: 3,
    originalPdfKey: 'pdfs/env_1-original.pdf',
    audit: [],
    ...partial,
  }
}

describe('defaultSignatureField', () => {
  it('lands on page 1 near the top in separate columns (not mashed / not last-page bottom)', () => {
    const client = defaultSignatureField('sig_client', 0)
    const provider = defaultSignatureField('sig_provider', 1)
    expect(client.page).toBe(1)
    expect(provider.page).toBe(1)
    expect(client.y).toBeLessThan(0.3)
    expect(provider.y).toBeLessThan(0.3)
    // Side-by-side columns — boxes must not share the same x (mash)
    expect(Math.abs(client.x - provider.x)).toBeGreaterThan(0.2)
    expect(client.x + client.width).toBeLessThanOrEqual(provider.x + 0.01)
    // Must not look like the old last-page bottom defaults
    expect(client.y).toBeLessThan(0.5)
    expect(provider.y).toBeLessThan(0.5)
  })
})

describe('sanitizeField', () => {
  it('keeps custom x/y/page', () => {
    const ids = new Set(['sig_a'])
    const raw = {
      id: 'fld_a',
      type: 'signature',
      signerId: 'sig_a',
      page: 2,
      x: 0.33,
      y: 0.44,
      width: 0.42,
      height: 0.11,
    }
    const out = sanitizeField(raw, ids, 5)
    expect(out).toEqual({
      id: 'fld_a',
      type: 'signature',
      signerId: 'sig_a',
      page: 2,
      x: 0.33,
      y: 0.44,
      width: 0.42,
      height: 0.11,
    })
  })
})

describe('mergeEnvelope placements', () => {
  it('keeps Client top + Provider top when a stale save brings Provider default back', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const clientTop = field({ id: 'fld_c', signerId: 'sig_c', page: 1, x: 0.1, y: 0.12 })
    const providerTop = field({ id: 'fld_p', signerId: 'sig_p', page: 1, x: 0.1, y: 0.28 })
    const previous = envelope({
      signers: [client, provider],
      fields: [clientTop, providerTop],
      updatedAt: '2026-01-01T01:00:00.000Z',
    })
    // Stale Client save still has Provider at default page-1 slot 1
    const staleProviderDefault = defaultSignatureField('sig_p', 1)
    const incoming = envelope({
      signers: [client, provider],
      fields: [clientTop, staleProviderDefault],
      updatedAt: '2026-01-01T00:30:00.000Z',
    })
    const merged = mergeEnvelope(incoming, previous)
    const bySigner = Object.fromEntries(
      merged.fields.filter((f) => f.type === 'signature').map((f) => [f.signerId, f]),
    )
    expect(bySigner.sig_c.y).toBeCloseTo(0.12, 5)
    expect(bySigner.sig_p.y).toBeCloseTo(0.28, 5)
    expect(bySigner.sig_p.page).toBe(1)
  })
  it('keeps both Client and Provider low y/page after merge with stale Provider default', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const clientLow = field({
      id: 'fld_c',
      signerId: 'sig_c',
      page: 3,
      x: 0.08,
      y: 0.72,
    })
    const providerLow = field({
      id: 'fld_p',
      signerId: 'sig_p',
      page: 3,
      x: 0.54,
      y: 0.72,
    })
    const previous = envelope({
      signers: [client, provider],
      fields: [clientLow, providerLow],
      pageCount: 3,
      updatedAt: '2026-01-01T01:00:00.000Z',
    })
    const incoming = envelope({
      signers: [client, provider],
      fields: [clientLow, defaultSignatureField('sig_p', 1)],
      pageCount: 3,
      updatedAt: '2026-01-01T00:30:00.000Z',
    })
    const merged = mergeEnvelope(incoming, previous)
    const bySigner = Object.fromEntries(
      merged.fields.filter((f) => f.type === 'signature').map((f) => [f.signerId, f]),
    )
    expect(bySigner.sig_c.y).toBeCloseTo(0.72, 5)
    expect(bySigner.sig_p.y).toBeCloseTo(0.72, 5)
    expect(bySigner.sig_c.page).toBe(3)
    expect(bySigner.sig_p.page).toBe(3)
  })

  it('does not let an older stacked page-1 Provider default overwrite a custom low box', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const clientLow = field({ id: 'fld_c', signerId: 'sig_c', page: 2, x: 0.1, y: 0.7 })
    const providerLow = field({ id: 'fld_p', signerId: 'sig_p', page: 2, x: 0.1, y: 0.7 })
    // Pre-column-layout default: page 1, x=0.12, y=0.08+1*0.13
    const staleStackedProvider: FieldPlacement = {
      id: 'fld_p',
      type: 'signature',
      signerId: 'sig_p',
      page: 1,
      x: 0.12,
      y: 0.21,
      width: 0.42,
      height: 0.11,
    }
    const previous = envelope({
      signers: [client, provider],
      fields: [clientLow, providerLow],
      pageCount: 3,
      updatedAt: '2026-01-01T01:00:00.000Z',
    })
    const incoming = envelope({
      signers: [client, provider],
      fields: [clientLow, staleStackedProvider],
      pageCount: 3,
      updatedAt: '2026-01-01T00:45:00.000Z',
    })
    const merged = mergeEnvelope(incoming, previous)
    const bySigner = Object.fromEntries(
      merged.fields.filter((f) => f.type === 'signature').map((f) => [f.signerId, f]),
    )
    expect(bySigner.sig_p.y).toBeCloseTo(0.7, 5)
    expect(bySigner.sig_p.page).toBe(2)
    expect(bySigner.sig_c.y).toBeCloseTo(0.7, 5)
  })

})

describe('signerPublicView', () => {
  it('includes all signature fields for any signer, plus parties without signaturePng', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
      status: 'signed',
      signedAt: '2026-01-01T02:00:00.000Z',
      signaturePng: 'data:image/png;base64,AAA',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const fields = [
      field({ id: 'fld_c', signerId: 'sig_c', y: 0.1 }),
      field({ id: 'fld_p', signerId: 'sig_p', y: 0.25 }),
    ]
    const env = envelope({ signers: [client, provider], fields })
    const view = signerPublicView(env, 'sig_p')
    expect(view).not.toBeNull()
    expect(view!.fields).toHaveLength(2)
    expect(view!.fields.map((f) => f.signerId).sort()).toEqual(['sig_c', 'sig_p'])
    expect(view!.parties).toHaveLength(2)
    expect(view!.parties.map((p) => p.id).sort()).toEqual(['sig_c', 'sig_p'])
    for (const p of view!.parties) {
      expect(p).not.toHaveProperty('signaturePng')
      expect(p).not.toHaveProperty('token')
    }
    expect(view!.parties.find((p) => p.id === 'sig_c')?.status).toBe('signed')
  })
})

describe('mergeSigner', () => {
  it('does not downgrade a signed signer to pending via a stale write', () => {
    const previous = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      token: 'tok_c',
      status: 'signed',
      signedAt: '2026-01-01T02:00:00.000Z',
      signaturePng: 'data:image/png;base64,AAA',
      signedDateText: 'January 1, 2026',
    })
    const incoming = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      token: 'tok_c',
      status: 'pending',
    })
    const merged = mergeSigner(incoming, previous)
    expect(merged.status).toBe('signed')
    expect(merged.signedAt).toBe(previous.signedAt)
    expect(merged.signaturePng).toBe(previous.signaturePng)
  })
})

describe('first signer signed survives concurrent admin save', () => {
  it('keeps Client signed when admin autosave merges a pending snapshot; both public views agree', () => {
    const clientPending = signer({
      id: 'sig_client',
      name: 'Thomas Client',
      email: 'client@example.com',
      role: 'Client',
      token: 'tok_client',
      status: 'pending',
    })
    const provider = signer({
      id: 'sig_provider',
      name: 'Thomas Provider',
      email: 'provider@example.com',
      role: 'Provider',
      token: 'tok_provider',
      status: 'pending',
    })
    const clientField = field({
      id: 'fld_sig_client_sig',
      signerId: 'sig_client',
      page: 3,
      x: 0.1,
      y: 0.7,
      width: 0.42,
      height: 0.11,
    })
    const providerField = field({
      id: 'fld_sig_provider_sig',
      signerId: 'sig_provider',
      page: 3,
      x: 0.55,
      y: 0.7,
      width: 0.42,
      height: 0.11,
    })

    // Durable state after Client magic-link Save signature
    const afterClientSign = envelope({
      updatedAt: '2026-01-01T03:00:00.000Z',
      signers: [
        {
          ...clientPending,
          status: 'signed',
          signedAt: '2026-01-01T03:00:00.000Z',
          signaturePng: 'data:image/png;base64,CLIENT',
          signedDateText: 'January 1, 2026',
        },
        provider,
      ],
      fields: [clientField, providerField],
      audit: [
        {
          at: '2026-01-01T03:00:00.000Z',
          action: 'signed',
          actor: 'client@example.com',
        },
      ],
    })

    // Admin autosave still holding Client as pending (stale React state)
    const adminAutosave = envelope({
      updatedAt: '2026-01-01T03:00:05.000Z',
      signers: [clientPending, provider],
      fields: [clientField, providerField],
      audit: [
        {
          at: '2026-01-01T03:00:05.000Z',
          action: 'updated',
          actor: 'admin@example.com',
        },
      ],
    })

    const merged = mergeEnvelope(adminAutosave, afterClientSign)
    const client = merged.signers.find((s) => s.id === 'sig_client')
    const prov = merged.signers.find((s) => s.id === 'sig_provider')
    expect(client?.status).toBe('signed')
    expect(client?.signaturePng).toBe('data:image/png;base64,CLIENT')
    expect(prov?.status).toBe('pending')
    // Placement merge must not regress Client page-3 box
    expect(merged.fields.find((f) => f.signerId === 'sig_client')?.page).toBe(3)

    const clientView = signerPublicView(merged, 'sig_client')
    const providerView = signerPublicView(merged, 'sig_provider')
    expect(clientView?.signer.status).toBe('signed')
    expect(providerView?.parties.find((p) => p.id === 'sig_client')?.status).toBe('signed')
    expect(clientView?.parties.find((p) => p.id === 'sig_client')?.status).toBe('signed')
    expect(providerView?.signer.status).toBe('pending')
  })

  it('Client sign incoming wins over unsigned previous (first write path)', () => {
    const client = signer({
      id: 'sig_client',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_provider',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const previous = envelope({
      updatedAt: '2026-01-01T02:00:00.000Z',
      signers: [client, provider],
      fields: [
        field({ id: 'fld_c', signerId: 'sig_client', page: 3 }),
        field({ id: 'fld_p', signerId: 'sig_provider', page: 3 }),
      ],
    })
    const incoming = envelope({
      updatedAt: '2026-01-01T02:30:00.000Z',
      signers: [
        {
          ...client,
          status: 'signed',
          signedAt: '2026-01-01T02:30:00.000Z',
          signaturePng: 'data:image/png;base64,C',
          signedDateText: 'January 1, 2026',
        },
        provider,
      ],
      fields: previous.fields,
    })
    const merged = mergeEnvelope(incoming, previous)
    expect(merged.signers.find((s) => s.id === 'sig_client')?.status).toBe('signed')
    expect(signerPublicView(merged, 'sig_client')?.signer.status).toBe('signed')
    expect(
      signerPublicView(merged, 'sig_provider')?.parties.find((p) => p.id === 'sig_client')
        ?.status,
    ).toBe('signed')
  })
})

describe('formatSignedDateText + dateOverlayBesideSignature', () => {
  it('returns null for unsigned parties (no date placeholder required)', () => {
    const pending = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      token: 'tok_p',
      status: 'pending',
    })
    expect(formatSignedDateText(pending)).toBeNull()
  })

  it('uses signedDateText / signedAt for signed parties', () => {
    expect(
      formatSignedDateText(
        signer({
          id: 'sig_c',
          name: 'Client',
          email: 'c@example.com',
          token: 'tok_c',
          status: 'signed',
          signedAt: '2026-09-11T08:00:00.000Z',
          signedDateText: 'September 11, 2026',
        }),
      ),
    ).toBe('September 11, 2026')
  })

  it('places the date overlay to the right of the signature field', () => {
    const sig = field({ id: 'fld_c', signerId: 'sig_c', x: 0.12, y: 0.2, width: 0.42 })
    const dateBox = dateOverlayBesideSignature(sig)
    expect(dateBox.y).toBe(sig.y)
    expect(dateBox.height).toBe(sig.height)
    expect(dateBox.x).toBeGreaterThan(sig.x + sig.width)
  })
})

describe('signerPublicView signed dates', () => {
  it('includes signedDateText on signed parties and omits it for pending', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
      status: 'signed',
      signedAt: '2026-09-11T08:00:00.000Z',
      signedDateText: 'September 11, 2026',
      signaturePng: 'data:image/png;base64,AAA',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const view = signerPublicView(
      envelope({
        signers: [client, provider],
        fields: [
          field({ id: 'fld_c', signerId: 'sig_c' }),
          field({ id: 'fld_p', signerId: 'sig_p' }),
        ],
      }),
      'sig_p',
    )
    expect(view!.parties.find((p) => p.id === 'sig_c')?.signedDateText).toBe(
      'September 11, 2026',
    )
    expect(view!.parties.find((p) => p.id === 'sig_p')?.signedDateText).toBeUndefined()
  })
})

describe('multi-page placements', () => {
  it('keeps a custom box on page 2 (not forced back to page 1)', () => {
    const ids = new Set(['sig_a'])
    const raw = {
      id: 'fld_sig_a_sig',
      type: 'signature',
      signerId: 'sig_a',
      page: 2,
      x: 0.2,
      y: 0.25,
      width: 0.42,
      height: 0.11,
    }
    const out = sanitizeField(raw, ids, 3)
    expect(out?.page).toBe(2)
    expect(out?.y).toBeCloseTo(0.25)
  })
})

describe('stale pageCount must not drop last-page placements', () => {
  it('sanitizeField keeps page 3 even when stored pageCount is 1', () => {
    const ids = new Set(['sig_a'])
    const out = sanitizeField(
      {
        id: 'fld_a',
        type: 'signature',
        signerId: 'sig_a',
        page: 3,
        x: 0.2,
        y: 0.55,
        width: 0.42,
        height: 0.11,
      },
      ids,
      1,
    )
    expect(out?.page).toBe(3)
    expect(out?.y).toBeCloseTo(0.55)
  })

  it('maxPageInRawFields discovers last page for bumping', () => {
    expect(
      maxPageInRawFields([
        { page: 1 },
        { page: 3, x: 0.1 },
        { page: '2' },
        null,
      ]),
    ).toBe(3)
  })

  it('mergeEnvelope keeps both boxes on page 3 and bumps pageCount from 1 → 3', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const clientLast = field({ id: 'fld_c', signerId: 'sig_c', page: 3, x: 0.1, y: 0.6 })
    const providerLast = field({ id: 'fld_p', signerId: 'sig_p', page: 3, x: 0.55, y: 0.6 })
    // Stored envelope wrongly still says pageCount: 1 (pdf.js showed 3 in the UI).
    const previous = envelope({
      signers: [client, provider],
      fields: [defaultSignatureField('sig_c', 0), defaultSignatureField('sig_p', 1)],
      pageCount: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const incoming = envelope({
      signers: [client, provider],
      fields: [clientLast, providerLast],
      pageCount: 1,
      updatedAt: '2026-01-01T01:00:00.000Z',
    })
    const merged = mergeEnvelope(incoming, previous)
    const bySigner = Object.fromEntries(
      merged.fields.filter((f) => f.type === 'signature').map((f) => [f.signerId, f]),
    )
    expect(bySigner.sig_c.page).toBe(3)
    expect(bySigner.sig_p.page).toBe(3)
    expect(bySigner.sig_c.y).toBeCloseTo(0.6)
    expect(bySigner.sig_p.y).toBeCloseTo(0.6)
    expect(merged.pageCount).toBe(3)
  })

  it('signerPublicView returns identical last-page fields for Client AND Provider links', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const fields = [
      field({
        id: 'fld_c',
        signerId: 'sig_c',
        page: 3,
        x: 0.1,
        y: 0.62,
        width: 0.42,
        height: 0.11,
      }),
      field({
        id: 'fld_p',
        signerId: 'sig_p',
        page: 3,
        x: 0.54,
        y: 0.62,
        width: 0.42,
        height: 0.11,
      }),
    ]
    const env = envelope({ signers: [client, provider], fields, pageCount: 3 })
    const clientView = signerPublicView(env, 'sig_c')
    const providerView = signerPublicView(env, 'sig_p')
    expect(clientView).not.toBeNull()
    expect(providerView).not.toBeNull()
    expect(clientView!.fields).toHaveLength(2)
    expect(providerView!.fields).toHaveLength(2)

    const norm = (list: typeof fields) =>
      [...list]
        .map((f) => ({
          signerId: f.signerId,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
        }))
        .sort((a, b) => a.signerId.localeCompare(b.signerId))

    expect(norm(clientView!.fields)).toEqual(norm(providerView!.fields))
    expect(norm(clientView!.fields)).toEqual(norm(fields))
    expect(clientView!.fields.every((f) => f.page === 3)).toBe(true)
    expect(providerView!.fields.every((f) => f.page === 3)).toBe(true)
  })
})

describe('Provider page-3 stickiness vs dragged page-1 default size', () => {
  it('keeps Provider page-3 Place box when incoming has mid-page page-1 factory size', () => {
    // Live regression: Client Place (0.42×0.11 p3) survived; Provider was replaced by a
    // dragged factory default (0.38×0.12 on page 1 mid) that was NOT defaultish by y alone.
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const clientPlaced = field({
      id: 'fld_c',
      signerId: 'sig_c',
      page: 3,
      x: 0.53,
      y: 0.09,
      width: 0.42,
      height: 0.11,
    })
    const providerPlaced = field({
      id: 'fld_p',
      signerId: 'sig_p',
      page: 3,
      x: 0.08,
      y: 0.72,
      width: 0.42,
      height: 0.11,
    })
    const draggedFactoryProvider: FieldPlacement = {
      id: 'fld_p',
      type: 'signature',
      signerId: 'sig_p',
      page: 1,
      x: 0.2984,
      y: 0.5671,
      width: 0.38,
      height: 0.12,
    }
    const previous = envelope({
      signers: [client, provider],
      fields: [clientPlaced, providerPlaced],
      pageCount: 3,
      updatedAt: '2026-01-01T01:00:00.000Z',
    })
    const incoming = envelope({
      signers: [client, provider],
      fields: [clientPlaced, draggedFactoryProvider],
      pageCount: 3,
      updatedAt: '2026-01-01T00:30:00.000Z',
    })
    const merged = mergeEnvelope(incoming, previous)
    const bySigner = Object.fromEntries(
      merged.fields.filter((f) => f.type === 'signature').map((f) => [f.signerId, f]),
    )
    expect(bySigner.sig_c.page).toBe(3)
    expect(bySigner.sig_p.page).toBe(3)
    expect(bySigner.sig_p.x).toBeCloseTo(0.08, 5)
    expect(bySigner.sig_p.y).toBeCloseTo(0.72, 5)
    expect(bySigner.sig_p.width).toBeCloseTo(0.42, 5)
  })

  it('Client sign POST merge does not rewrite Provider page-3 placement', () => {
    const client = signer({
      id: 'sig_c',
      name: 'Client',
      email: 'c@example.com',
      role: 'Client',
      token: 'tok_c',
    })
    const provider = signer({
      id: 'sig_p',
      name: 'Provider',
      email: 'p@example.com',
      role: 'Provider',
      token: 'tok_p',
    })
    const fields = [
      field({
        id: 'fld_c',
        signerId: 'sig_c',
        page: 3,
        x: 0.53,
        y: 0.09,
        width: 0.42,
        height: 0.11,
      }),
      field({
        id: 'fld_p',
        signerId: 'sig_p',
        page: 3,
        x: 0.08,
        y: 0.72,
        width: 0.42,
        height: 0.11,
      }),
    ]
    const previous = envelope({
      status: 'sent',
      signers: [client, provider],
      fields,
      pageCount: 3,
      updatedAt: '2026-01-01T01:00:00.000Z',
    })
    // Magic-link sign updates only the Client signer; fields must round-trip unchanged.
    const incoming = envelope({
      status: 'sent',
      signers: [
        {
          ...client,
          status: 'signed',
          signedAt: '2026-01-01T02:00:00.000Z',
          signaturePng: 'data:image/png;base64,AAA',
          signedDateText: 'January 1, 2026',
        },
        provider,
      ],
      fields,
      pageCount: 3,
      updatedAt: '2026-01-01T02:00:00.000Z',
    })
    const merged = mergeEnvelope(incoming, previous)
    const bySigner = Object.fromEntries(
      merged.fields.filter((f) => f.type === 'signature').map((f) => [f.signerId, f]),
    )
    expect(bySigner.sig_c.page).toBe(3)
    expect(bySigner.sig_p.page).toBe(3)
    expect(bySigner.sig_p.x).toBeCloseTo(0.08, 5)
    expect(bySigner.sig_p.y).toBeCloseTo(0.72, 5)
    expect(merged.signers.find((s) => s.id === 'sig_c')?.status).toBe('signed')
    expect(merged.signers.find((s) => s.id === 'sig_p')?.status).toBe('pending')

    const clientView = signerPublicView(merged, 'sig_c')
    const providerView = signerPublicView(merged, 'sig_p')
    const coords = (v: NonNullable<typeof clientView>) =>
      [...v.fields]
        .map((f) => `${f.signerId}:${f.page}:${f.x}:${f.y}`)
        .sort()
    expect(coords(clientView!)).toEqual(coords(providerView!))
  })
})

describe('placementAtPointer (cross-page drag)', () => {
  const pages = [
    { page: 1, left: 0, top: 0, width: 100, height: 200 },
    { page: 2, left: 0, top: 220, width: 100, height: 200 },
    { page: 3, left: 0, top: 440, width: 100, height: 200 },
  ]

  it('maps pointer on page 3 to pageNum 3 with local y', () => {
    const out = placementAtPointer(50, 540, pages, 0.42, 0.11, 0.21, 0.055)
    expect(out?.page).toBe(3)
    expect(out!.y).toBeGreaterThan(0.2)
    expect(out!.y).toBeLessThan(0.8)
  })

  it('does not stay stuck on page 1 when pointer is over page 2', () => {
    const out = placementAtPointer(40, 300, pages, 0.42, 0.11, 0.21, 0.055)
    expect(out?.page).toBe(2)
  })
})
