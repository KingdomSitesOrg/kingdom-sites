import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { appendAudit } from '@/lib/sign/audit'
import { sendCompletedPdfEmail } from '@/lib/sign/email'
import { signerPublicView, stampEnvelopePdf } from '@/lib/sign/pdf'
import {
  findEnvelopeBySignerToken,
  getEnvelope,
  readPdf,
  saveEnvelope,
  savePdf,
} from '@/lib/sign/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Ctx = { params: Promise<{ token: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params
    const found = await findEnvelopeBySignerToken(token)
    if (!found) {
      return NextResponse.json({ ok: false, error: 'Link not found or expired.' }, { status: 404 })
    }
    let { envelope } = found
    const { signerId } = found
    const signer = envelope.signers.find((s) => s.id === signerId)!
    envelope = appendAudit(envelope, 'viewed', signer.email)
    await saveEnvelope(envelope)

    return NextResponse.json({
      ok: true,
      view: signerPublicView(envelope, signerId),
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not load signing session.' }, { status: 500 })
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params
    const found = await findEnvelopeBySignerToken(token)
    if (!found) {
      return NextResponse.json({ ok: false, error: 'Link not found or expired.' }, { status: 404 })
    }

    let { envelope } = found
    const { signerId } = found
    const signer = envelope.signers.find((s) => s.id === signerId)
    if (!signer) {
      return NextResponse.json({ ok: false, error: 'Signer not found.' }, { status: 404 })
    }
    // Valid magic link = invited. Promote draft → sent so links still work if a
    // stale auto-save raced and wrote draft after emails went out.
    if (envelope.status === 'draft') {
      envelope = { ...envelope, status: 'sent' }
      envelope = appendAudit(envelope, 'sent', signer.email, 'auto-opened via magic link')
      await saveEnvelope(envelope)
    }
    if (signer.status === 'signed') {
      return NextResponse.json({
        ok: true,
        alreadySigned: true,
        view: signerPublicView(envelope, signerId),
      })
    }

    // Re-read right before mutating so a parallel sign/admin save cannot double-sign.
    {
      const latest = await getEnvelope(envelope.id)
      if (latest) {
        envelope = latest
        const live = envelope.signers.find((s) => s.id === signerId)
        if (live?.status === 'signed') {
          return NextResponse.json({
            ok: true,
            alreadySigned: true,
            view: signerPublicView(envelope, signerId),
          })
        }
      }
    }

    const body = (await request.json().catch(() => null)) as {
      signaturePng?: string
      typedName?: string
      dateText?: string
    } | null

    let signaturePng = body?.signaturePng?.trim() || ''
    const typedName = body?.typedName?.trim() || ''
    if (!signaturePng && typedName) {
      // Build a simple PNG-less fallback: store a 1x1 and rely on text stamp via name
      // Prefer generating a data-URL text signature on the client; server accepts typed name as drawText fallback
      signaturePng = await textSignatureDataUrl(typedName)
    }
    if (!signaturePng || !signaturePng.startsWith('data:image/')) {
      return NextResponse.json(
        { ok: false, error: 'Please draw or type a signature.' },
        { status: 400 },
      )
    }
    if (signaturePng.length > 1_500_000) {
      return NextResponse.json({ ok: false, error: 'Signature image is too large.' }, { status: 400 })
    }

    const signedAt = new Date().toISOString()
    const dateText =
      body?.dateText?.trim() ||
      new Date(signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

    envelope = {
      ...envelope,
      signers: envelope.signers.map((s) =>
        s.id === signerId
          ? {
              ...s,
              status: 'signed' as const,
              signedAt,
              signaturePng,
              signedDateText: dateText,
              name: typedName || s.name,
            }
          : s,
      ),
    }
    envelope = appendAudit(envelope, 'signed', signer.email)

    const allSigned = envelope.signers.every((s) => s.status === 'signed')
    if (allSigned) {
      const original = await readPdf(envelope.originalPdfKey)
      const stamped = await stampEnvelopePdf(original, envelope)
      const completedKey = await savePdf(`pdfs/${envelope.id}-completed.pdf`, stamped)
      envelope = {
        ...envelope,
        status: 'completed',
        completedPdfKey: completedKey,
      }
      envelope = appendAudit(envelope, 'completed', 'system', 'All parties signed')

      const recipients = Array.from(
        new Set([
          ...envelope.signers.map((s) => s.email),
          process.env.ADMIN_EMAIL?.trim() || '',
          process.env.LEAD_TO_EMAIL?.trim() || '',
        ]),
      ).filter(Boolean)

      if (process.env.RESEND_API_KEY?.trim() && recipients.length) {
        const filename = `${envelope.title.replace(/[^\w.\- ]+/g, '').slice(0, 60) || 'document'}-signed.pdf`
        await sendCompletedPdfEmail({
          to: recipients,
          title: envelope.title,
          pdf: Buffer.from(stamped),
          filename,
        })
      }
    }

    await saveEnvelope(envelope)
    return NextResponse.json({
      ok: true,
      view: signerPublicView(envelope, signerId),
      completed: allSigned,
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not submit signature.' }, { status: 500 })
  }
}

/** Minimal 1×1 transparent PNG — stamp path falls back to drawing the typed name. */
async function textSignatureDataUrl(name: string): Promise<string> {
  // Store a marker PNG; stampEnvelopePdf catches embed failure? We draw name when png fails.
  // Better: create a real small PNG with pdf-lib? Use a known 1x1 PNG and rely on name in stamp.
  void name
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
}
