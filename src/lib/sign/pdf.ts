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
    const role = (signer.role || 'Signer').trim() || 'Signer'

    if (field.type === 'signature') {
      // Layout (PDF bottom-left origin within box):
      //   top: role label
      //   middle: signature ink sitting on horizontal rule
      //   bottom: printed name + role under the line
      const lineY = box.y + box.height * 0.4
      page.drawLine({
        start: { x: box.x + 2, y: lineY },
        end: { x: box.x + box.width - 2, y: lineY },
        thickness: 0.75,
        color: rgb(0.12, 0.12, 0.16),
      })

      // Soft role label near top of box
      const roleSize = Math.min(8, box.height * 0.12)
      page.drawText(role, {
        x: box.x + 3,
        y: box.y + box.height - roleSize - 2,
        size: roleSize,
        font,
        color: rgb(0.4, 0.4, 0.45),
        maxWidth: box.width - 6,
      })

      let drewImage = false
      if (signer.signaturePng) {
        const raw = signer.signaturePng.replace(/^data:image\/\w+;base64,/, '')
        const pngBytes = Buffer.from(raw, 'base64')
        try {
          const image = await doc.embedPng(pngBytes)
          if (image.width > 2 && image.height > 2) {
            const sigH = box.height * 0.42
            const sigW = Math.min(box.width - 4, sigH * (image.width / Math.max(1, image.height)))
            // Sit ON / just above the line
            page.drawImage(image, {
              x: box.x + 2,
              y: lineY + 1,
              width: sigW,
              height: sigH,
            })
            drewImage = true
          }
        } catch {
          drewImage = false
        }
      }
      if (!drewImage) {
        const typedSize = Math.min(14, box.height * 0.28)
        page.drawText(signer.name || 'Signed', {
          x: box.x + 4,
          y: lineY + 4,
          size: typedSize,
          font,
          color: rgb(0.1, 0.1, 0.15),
          maxWidth: box.width - 8,
        })
      }

      const nameSize = Math.min(9, box.height * 0.14)
      page.drawText(signer.name || '', {
        x: box.x + 3,
        y: lineY - nameSize - 3,
        size: nameSize,
        font,
        color: rgb(0.1, 0.1, 0.15),
        maxWidth: box.width - 6,
      })
      page.drawText(role, {
        x: box.x + 3,
        y: lineY - nameSize * 2 - 5,
        size: Math.max(6, nameSize - 1),
        font,
        color: rgb(0.4, 0.4, 0.45),
        maxWidth: box.width - 6,
      })
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
  // Taller box for role + signature-on-line + printed name
  const height = 0.11
  const y = Math.min(0.68 + slot * 0.13, 0.86)
  return {
    id: `fld_${signerId}_sig`,
    type: 'signature',
    signerId,
    page,
    x: 0.12,
    y,
    width: 0.42,
    height,
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
      role: signer.role || 'Signer',
      status: signer.status,
      signedAt: signer.signedAt,
    },
    fields: envelope.fields.filter((f) => f.signerId === signerId),
    allSigned: envelope.signers.every((s) => s.status === 'signed'),
  }
}

export type { Signer }
