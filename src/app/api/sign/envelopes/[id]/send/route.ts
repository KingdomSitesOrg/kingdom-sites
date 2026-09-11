import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession } from '@/lib/sign/auth'
import { appendAudit } from '@/lib/sign/audit'
import { protectSignedSigners } from '@/lib/sign/complete'
import { sendMagicLinkEmail, signerLink } from '@/lib/sign/email'
import { getEnvelope, saveEnvelope } from '@/lib/sign/store'
import type { Envelope } from '@/lib/sign/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Ctx = { params: Promise<{ id: string }> }

/** Re-read a few times and merge signed state so Blob lag cannot wipe admin signatures. */
async function loadEnvelopeForSend(id: string): Promise<Envelope | null> {
  let best: Envelope | null = null
  for (let i = 0; i < 3; i++) {
    const loaded = await getEnvelope(id)
    if (loaded) best = protectSignedSigners(loaded, best)
    if (i < 2) await new Promise((r) => setTimeout(r, 120 * (i + 1)))
  }
  return best
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const session = await getAdminSession()
    if (!session) throw new AuthError()
    const { id } = await ctx.params
    let envelope = await loadEnvelopeForSend(id)
    if (!envelope) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }
    if (envelope.signers.length === 0) {
      return NextResponse.json({ ok: false, error: 'Add at least one signer first.' }, { status: 400 })
    }
    if (!envelope.fields.some((f) => f.type === 'signature')) {
      return NextResponse.json(
        { ok: false, error: 'Place at least one signature box first.' },
        { status: 400 },
      )
    }

    // Open for signing FIRST so magic links never arrive while status is still draft
    // (and so a later field auto-save cannot race ahead of this write).
    // protectSignedSigners across RMW so a stale draft snapshot cannot clear signatures.
    if (envelope.status !== 'completed') {
      envelope = { ...envelope, status: 'sent' }
    }
    envelope = appendAudit(envelope, 'sent', session.email, 'opened for signing')
    envelope = await saveEnvelope(envelope)
    // Re-stabilize after save in case Blob echoed a stale pending signer.
    {
      const again = await loadEnvelopeForSend(id)
      if (again) envelope = protectSignedSigners(again, envelope)
    }

    const body = (await request.json().catch(() => null)) as { email?: boolean } | null
    // Default true for the "Email magic links" button. Admin self-sign passes email:false
    // so opening the envelope does not spam invites before the admin hits Send.
    const shouldEmail = body?.email !== false

    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim())
    const results: {
      email: string
      sent: boolean
      link: string
      skippedAlreadySigned?: boolean
    }[] = []
    let skippedAlreadySigned = 0

    for (const signer of envelope.signers) {
      const link = signerLink(signer.token)
      if (signer.status === 'signed') {
        // Already signed in admin (or via magic link) — never email or reset.
        skippedAlreadySigned += 1
        results.push({ email: signer.email, sent: false, link, skippedAlreadySigned: true })
        continue
      }
      if (!shouldEmail || !hasResend) {
        results.push({ email: signer.email, sent: false, link })
        continue
      }
      const sent = await sendMagicLinkEmail({
        to: signer.email,
        signerName: signer.name,
        title: envelope.title,
        token: signer.token,
      })
      results.push({ email: signer.email, sent, link })
    }

    const emailedResults = results.filter((r) => r.sent && !r.skippedAlreadySigned)
    const skipDetail =
      skippedAlreadySigned > 0
        ? `already-signed skipped: ${results
            .filter((r) => r.skippedAlreadySigned)
            .map((r) => r.email)
            .join(', ')}`
        : ''
    const emailDetail = shouldEmail
      ? results
          .filter((r) => !r.skippedAlreadySigned)
          .map((r) => `${r.email}:${r.sent ? 'emailed' : 'link-only'}`)
          .join(', ')
      : 'opened without email'
    const auditDetail = [emailDetail, skipDetail].filter(Boolean).join(' | ')

    // Record email outcomes (status stays sent/completed via monotonic save).
    envelope = appendAudit(envelope, 'sent', session.email, auditDetail || 'opened without email')
    envelope = await saveEnvelope(envelope)
    {
      const again = await loadEnvelopeForSend(id)
      if (again) envelope = protectSignedSigners(again, envelope)
    }

    const base = process.env.SIGN_APP_URL?.trim() || ''
    const localLinks = /localhost|127\.0\.0\.1/i.test(base)
    return NextResponse.json({
      ok: true,
      envelope,
      results,
      skippedAlreadySigned,
      emailed: hasResend && emailedResults.length > 0,
      notice: !hasResend
        ? 'Opened for signing without email (RESEND_API_KEY not set). Use the links or sign in the editor.'
        : localLinks
          ? 'Magic links point at localhost — they only work on this computer. Set SIGN_APP_URL to your live site before emailing real clients.'
          : undefined,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not send invites.' }, { status: 500 })
  }
}
