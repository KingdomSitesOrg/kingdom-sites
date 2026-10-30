import { describe, expect, it } from 'vitest'
import { crc32, deflateSync } from 'zlib'
import { PDFDocument, PDFDict, PDFName } from 'pdf-lib'
import { stampEnvelopePdf } from './pdf'
import { linesForSigner, mergeEnvelope, signerPublicView, unsignedLines } from './placement'
import type { Envelope, FieldPlacement, Signer } from './types'

// An 8×4 grey PNG, as a stored signature (the stamp skips images of 2px or less).
function png(width: number, height: number): string {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bit depth
  header[9] = 0 // greyscale
  const rows = Buffer.alloc((width + 1) * height, 0x80)
  for (let y = 0; y < height; y++) rows[y * (width + 1)] = 0
  return `data:image/png;base64,${Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]).toString('base64')}`
}
const PNG = png(8, 4)

function signer(id: string, partial: Partial<Signer> = {}): Signer {
  return { id, name: id, email: `${id}@example.com`, role: 'Signer', token: `tok_${id}`, status: 'pending', ...partial }
}

function line(id: string, signerId: string, page: number, y = 0.7): FieldPlacement {
  return { id, type: 'signature', signerId, page, x: 0.1, y, width: 0.42, height: 0.11 }
}

function envelope(partial: Partial<Envelope> = {}): Envelope {
  return {
    id: 'env_1',
    title: 'MSA and SOW',
    status: 'draft',
    createdAt: '2026-10-30T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
    pageCount: 3,
    originalPdfKey: 'pdfs/env_1-original.pdf',
    signers: [signer('sig_c'), signer('sig_p')],
    // The JAM contract: each party signs the MSA (page 2) and the SOW (page 3).
    fields: [
      line('fld_c_msa', 'sig_c', 2, 0.1),
      line('fld_c_sow', 'sig_c', 3),
      line('fld_p_msa', 'sig_p', 2, 0.25),
      line('fld_p_sow', 'sig_p', 3, 0.85),
    ],
    audit: [],
    ...partial,
  }
}

describe('several signature lines per signer', () => {
  it('a signing save keeps both of a signer’s lines (they used to collapse to one)', () => {
    const stored = envelope({ status: 'sent' })
    const signing = { ...stored, signers: [signer('sig_c', { status: 'signed' as const }), signer('sig_p')] }
    const merged = mergeEnvelope(signing, stored)
    expect(linesForSigner(merged, 'sig_c').map((f) => f.id)).toEqual(['fld_c_msa', 'fld_c_sow'])
    expect(linesForSigner(merged, 'sig_p').map((f) => f.id)).toEqual(['fld_p_msa', 'fld_p_sow'])
  })

  it('a draft save removes a line the sender deleted', () => {
    const stored = envelope()
    const edited = { ...stored, fields: stored.fields.filter((f) => f.id !== 'fld_c_sow') }
    const merged = mergeEnvelope(edited, stored, { replaceFields: true })
    expect(linesForSigner(merged, 'sig_c').map((f) => f.id)).toEqual(['fld_c_msa'])
  })

  it('never drops lines once the stored document has been sent', () => {
    const stored = envelope({ status: 'sent' })
    const stale = { ...envelope(), fields: [] }
    const merged = mergeEnvelope(stale, stored, { replaceFields: true })
    expect(merged.fields).toHaveLength(4)
  })

  it('lists a signer’s lines in reading order', () => {
    expect(linesForSigner(envelope(), 'sig_p').map((f) => f.page)).toEqual([2, 3])
  })

  it('the signer’s page gets every line', () => {
    const view = signerPublicView(envelope({ status: 'sent' }), 'sig_c')
    expect(view?.fields.filter((f) => f.signerId === 'sig_c')).toHaveLength(2)
  })
})

describe('unsignedLines (the signer must sign all of theirs)', () => {
  const env = envelope({ status: 'sent' })

  it('refuses a signature that covers only one of two lines', () => {
    expect(unsignedLines(env, 'sig_c', ['fld_c_msa']).map((f) => f.id)).toEqual(['fld_c_sow'])
  })

  it('accepts a signature that covers every line', () => {
    expect(unsignedLines(env, 'sig_c', ['fld_c_sow', 'fld_c_msa'])).toEqual([])
  })

  it('refuses a request with no list when the signer has two lines', () => {
    expect(unsignedLines(env, 'sig_c', undefined)).toHaveLength(2)
  })

  it('still accepts an older page (no list) for a signer with one line', () => {
    const single = envelope({ status: 'sent', fields: [line('fld_c', 'sig_c', 3), line('fld_p', 'sig_p', 3, 0.85)] })
    expect(unsignedLines(single, 'sig_c', undefined)).toEqual([])
  })
})

describe('the signed PDF shows every line', () => {
  it('stamps the signature on each page a signer signs', async () => {
    const doc = await PDFDocument.create()
    for (let i = 0; i < 3; i++) doc.addPage([612, 792])
    const original = await doc.save()
    const signedEnv = envelope({
      status: 'completed',
      signers: [
        signer('sig_c', { status: 'signed', signaturePng: PNG, signedAt: '2026-10-30T10:00:00.000Z' }),
        signer('sig_p', { status: 'signed', signaturePng: PNG, signedAt: '2026-10-30T11:00:00.000Z' }),
      ],
    })
    const stamped = await PDFDocument.load(await stampEnvelopePdf(original, signedEnv))
    const images = (pageIndex: number) => {
      const resources = stamped.getPage(pageIndex).node.Resources()
      const xobjects = resources?.lookup(PDFName.of('XObject'))
      return xobjects instanceof PDFDict ? xobjects.keys().length : 0
    }
    // Page 1 has no lines; pages 2 and 3 carry both parties' signatures.
    expect(images(0)).toBe(0)
    expect(images(1)).toBe(2)
    expect(images(2)).toBe(2)
  })
})
