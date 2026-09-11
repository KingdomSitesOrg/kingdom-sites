import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Envelope, FieldPlacement, Signer } from './types'

export async function countPdfPages(bytes: Uint8Array | Buffer): Promise<number> {
  const doc = await PDFDocument.load(bytes)
  return doc.getPageCount()
}

function fieldRect(
  pageWidth: number,
  pageHeight: number,
  field: FieldPlacement,
): { x: number; y: number; width: number; height: number } {
  const width = field.width * pageWidth
  const height = field.height * pageHeight
  const x = field.x * pageWidth
  // PDF origin is bottom-left; our UI origin is top-left
  const y = pageHeight - field.y * pageHeight - height
  return { x, y, width, height }
}

export async function stampEnvelopePdf(
  originalBytes: Uint8Array | Buffer,
  envelope: Envelope,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalBytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()

  for (const field of envelope.fields) {
    const signer = envelope.signers.find((s) => s.id === field.signerId)
    if (!signer || signer.status !== 'signed') continue
    const page = pages[field.page - 1]
    if (!page) continue
    const { width: pageWidth, height: pageHeight } = page.getSize()
    const box = fieldRect(pageWidth, pageHeight, field)

    if (field.type === 'signature' && signer.signaturePng) {
      const raw = signer.signaturePng.replace(/^data:image\/\w+;base64,/, '')
      const pngBytes = Buffer.from(raw, 'base64')
      let drewImage = false
      try {
        const image = await doc.embedPng(pngBytes)
        // Skip near-empty placeholder PNGs (typed-name fallback)
        if (image.width > 2 && image.height > 2) {
          page.drawImage(image, {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          })
          drewImage = true
        }
      } catch {
        drewImage = false
      }
      if (!drewImage) {
        page.drawText(signer.name || 'Signed', {
          x: box.x + 4,
          y: box.y + box.height / 3,
          size: Math.min(16, box.height * 0.5),
          font,
          color: rgb(0.1, 0.1, 0.15),
          maxWidth: box.width - 8,
        })
      }
    } else if (field.type === 'date') {
      const text = signer.signedDateText || new Date(signer.signedAt || Date.now()).toLocaleDateString('en-US')
      page.drawText(text, {
        x: box.x + 2,
        y: box.y + Math.max(2, box.height * 0.25),
        size: Math.min(12, box.height * 0.55),
        font,
        color: rgb(0.1, 0.1, 0.15),
        maxWidth: box.width - 4,
      })
    }
  }

  // Small completion footer on last page
  const last = pages[pages.length - 1]
  if (last) {
    const { width } = last.getSize()
    last.drawText(`Completed via Kingdom Sites Sign · ${new Date().toISOString()}`, {
      x: 24,
      y: 16,
      size: 7,
      font,
      color: rgb(0.45, 0.45, 0.5),
      maxWidth: width - 48,
    })
  }

  return doc.save()
}

export function defaultSignatureField(
  signerId: string,
  page: number,
  /** 0 = Client (upper), 1 = Provider (lower), … */
  slot = 0,
): FieldPlacement {
  const y = Math.min(0.72 + slot * 0.12, 0.88)
  return {
    id: `fld_${signerId}_sig`,
    type: 'signature',
    signerId,
    page,
    x: 0.12,
    y,
    width: 0.42,
    height: 0.09,
  }
}

export function defaultDateField(signerId: string, page: number): FieldPlacement {
  return {
    id: `fld_${signerId}_date`,
    type: 'date',
    signerId,
    page,
    x: 0.55,
    y: 0.91,
    width: 0.2,
    height: 0.035,
  }
}

/** Public view of a signer (no other signers' signature images). */
export function signerPublicView(envelope: Envelope, signerId: string) {
  const signer = envelope.signers.find((s) => s.id === signerId)
  if (!signer) return null
  return {
    envelopeId: envelope.id,
    title: envelope.title,
    status: envelope.status,
    pageCount: envelope.pageCount,
    signer: {
      id: signer.id,
      name: signer.name,
      email: signer.email,
      status: signer.status,
      signedAt: signer.signedAt,
    },
    fields: envelope.fields.filter((f) => f.signerId === signerId),
    allSigned: envelope.signers.every((s) => s.status === 'signed'),
  }
}

export type { Signer }
