import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession } from '@/lib/sign/auth'
import { appendAudit } from '@/lib/sign/audit'
import { sendMagicLinkEmail, signerLink } from '@/lib/sign/email'
import { getEnvelope, saveEnvelope } from '@/lib/sign/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const session = await getAdminSession()
    if (!session) throw new AuthError()
    const { id } = await ctx.params
    let envelope = await getEnvelope(id)
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

    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim())
    const results: { email: string; sent: boolean; link: string }[] = []

    for (const signer of envelope.signers) {
      const link = signerLink(signer.token)
      if (signer.status === 'signed') {
        results.push({ email: signer.email, sent: true, link })
        continue
      }
      if (!hasResend) {
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

    // Always open for signing. Emails are best-effort (local / missing Resend still works).
    envelope = {
      ...envelope,
      status: envelope.status === 'completed' ? 'completed' : 'sent',
    }
    envelope = appendAudit(
      envelope,
      'sent',
      session.email,
      results.map((r) => `${r.email}:${r.sent ? 'emailed' : 'link-only'}`).join(', '),
    )
    await saveEnvelope(envelope)

    const base = process.env.SIGN_APP_URL?.trim() || ''
    const localLinks = /localhost|127\.0\.0\.1/i.test(base)
    return NextResponse.json({
      ok: true,
      envelope,
      results,
      emailed: hasResend && results.some((r) => r.sent),
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
