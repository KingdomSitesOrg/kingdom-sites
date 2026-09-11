import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Envelope, FieldPlacement, Signer } from './types'
import { formatSignedDateText } from './placement'

export { defaultSignatureField, signerPublicView } from './placement'

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

      // Auto date to the right of the signature block (no separate placeable date field).
      const dateText = formatSignedDateText(signer)
      if (dateText) {
        const dateX = box.x + box.width + 10
        const dateW = Math.min(pageWidth - dateX - 24, Math.max(70, box.width * 0.55))
        if (dateW > 40) {
          const dateLabelSize = Math.min(8, box.height * 0.12)
          page.drawText('Date', {
            x: dateX,
            y: box.y + box.height - dateLabelSize - 2,
            size: dateLabelSize,
            font,
            color: rgb(0.4, 0.4, 0.45),
            maxWidth: dateW,
          })
          page.drawLine({
            start: { x: dateX, y: lineY },
            end: { x: dateX + dateW, y: lineY },
            thickness: 0.75,
            color: rgb(0.12, 0.12, 0.16),
          })
          const dateSize = Math.min(11, box.height * 0.18)
          page.drawText(dateText, {
            x: dateX,
            y: lineY - dateSize - 3,
            size: dateSize,
            font,
            color: rgb(0.1, 0.1, 0.15),
            maxWidth: dateW,
          })
        }
      }
    } else if (field.type === 'date') {
      // Legacy placeable date fields (if any remain) still stamp.
      const text =
        formatSignedDateText(signer) ||
        signer.signedDateText ||
        new Date(signer.signedAt || Date.now()).toLocaleDateString('en-US')
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

export type { Signer }
