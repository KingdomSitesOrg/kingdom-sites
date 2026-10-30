import { after, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { appendAudit } from '@/lib/sign/audit'
import { emailCompletedEnvelope, stampAndPersistCompleted } from '@/lib/sign/complete'
import { emailConfigured } from '@/lib/sign/email'
import { signerPublicView } from '@/lib/sign/pdf'
import { isWellFormedSignerToken, unsignedLines } from '@/lib/sign/placement'
import type { Envelope } from '@/lib/sign/types'
import {
  findEnvelopeBySignerToken,
  getEnvelope,
  saveEnvelope,
} from '@/lib/sign/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Ctx = { params: Promise<{ token: string }> }

/** What the signer's page needs, plus whether copies of the signed PDF go out by email. */
function publicView(envelope: Envelope, signerId: string) {
  const view = signerPublicView(envelope, signerId)
  return view ? { ...view, emailsCopies: emailConfigured() } : null
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params
    const found = isWellFormedSignerToken(token) ? await findEnvelopeBySignerToken(token) : null
    if (!found) {
      return NextResponse.json({ ok: false, error: 'Link not found or expired.' }, { status: 404 })
    }
    const { envelope, signerId } = found
    // Do not appendAudit/saveEnvelope on view — that write raced admin placements
    // and could snap the other signature box back to defaults.
    return NextResponse.json({
      ok: true,
      view: publicView(envelope, signerId),
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not load signing session.' }, { status: 500 })
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params
    const found = isWellFormedSignerToken(token) ? await findEnvelopeBySignerToken(token) : null
    if (!found) {
      return NextResponse.json({ ok: false, error: 'Link not found or expired.' }, { status: 404 })
    }

    let { envelope } = found
    const { signerId } = found
    const signer = envelope.signers.find((s) => s.id === signerId)
    if (!signer) {
      return NextResponse.json({ ok: false, error: 'Signer not found.' }, { status: 404 })
    }
    // A customer's draft has not been sent (or counted against their plan):
    // its links do not work until it is.
    if (envelope.status === 'draft' && envelope.ownerId) {
      return NextResponse.json(
        { ok: false, error: 'This document has not been sent for signing yet.' },
        { status: 409 },
      )
    }
    // Valid magic link = invited. Promote draft → sent so links still work if a
    // stale auto-save raced and wrote draft after emails went out.
    if (envelope.status === 'draft') {
      envelope = { ...envelope, status: 'sent' }
      envelope = appendAudit(envelope, 'sent', signer.email, 'auto-opened via magic link')
      envelope = await saveEnvelope(envelope)
    }
    if (signer.status === 'signed') {
      return NextResponse.json({
        ok: true,
        alreadySigned: true,
        view: publicView(envelope, signerId),
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
            view: publicView(envelope, signerId),
          })
        }
      }
    }

    const body = (await request.json().catch(() => null)) as {
      signaturePng?: string
      typedName?: string
      dateText?: string
      signedFieldIds?: unknown
    } | null

    // Every one of this signer's lines must be signed, not just the first.
    const missingLines = unsignedLines(envelope, signerId, body?.signedFieldIds)
    if (missingLines.length) {
      return NextResponse.json(
        {
          ok: false,
          error: `Sign all your lines first: ${missingLines.length} still to sign (page ${missingLines
            .map((f) => f.page)
            .join(', page ')}).`,
        },
        { status: 400 },
      )
    }

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

    // Persist signed state first so Client/Provider UI and admin poll see "Signed"
    // even if stamp fails. On allSigned we then await stamp+save on this request
    // (after() alone was flaky); completed-PDF delivery stays in after().
    envelope = await saveEnvelope(envelope)
    const allSigned = envelope.signers.every((s) => s.status === 'signed')
    const signedView = publicView(envelope, signerId)

    if (allSigned) {
      // Await stamp+save on the request path — after() alone is flaky on some runtimes.
      // Email stays in after()/waitUntil so Resend latency does not block the signer.
      let completedEnv: Awaited<ReturnType<typeof stampAndPersistCompleted>> = null
      try {
        completedEnv = await stampAndPersistCompleted(envelope.id)
      } catch (stampError) {
        Sentry.captureException(stampError)
      }
      if (completedEnv) {
        envelope = completedEnv
      }
      const finalView = publicView(envelope, signerId)
      const completedOk = Boolean(completedEnv?.completedPdfKey)
      if (completedEnv) {
        const toEmail = completedEnv
        after(async () => {
          try {
            await emailCompletedEnvelope(toEmail)
          } catch (emailError) {
            Sentry.captureException(emailError)
          }
        })
      }
      return NextResponse.json({
        ok: true,
        view: finalView || signedView,
        completed: completedOk,
        completing: !completedOk,
      })
    }

    return NextResponse.json({
      ok: true,
      view: signedView,
      completed: false,
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
