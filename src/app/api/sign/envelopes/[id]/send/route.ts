import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession } from '@/lib/sign/auth'
import { appendAudit } from '@/lib/sign/audit'
import { sendMagicLinkEmail } from '@/lib/sign/email'
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
    if (envelope.fields.length === 0) {
      return NextResponse.json({ ok: false, error: 'Place at least one field first.' }, { status: 400 })
    }
    if (!process.env.RESEND_API_KEY?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'RESEND_API_KEY is not set — cannot send magic links.' },
        { status: 503 },
      )
    }

    const results: { email: string; sent: boolean }[] = []
    for (const signer of envelope.signers) {
      if (signer.status === 'signed') {
        results.push({ email: signer.email, sent: true })
        continue
      }
      const sent = await sendMagicLinkEmail({
        to: signer.email,
        signerName: signer.name,
        title: envelope.title,
        token: signer.token,
      })
      results.push({ email: signer.email, sent })
    }

    const anySent = results.some((r) => r.sent)
    if (!anySent) {
      return NextResponse.json(
        { ok: false, error: 'No magic-link emails could be sent. Check Resend config.' },
        { status: 502 },
      )
    }

    envelope = {
      ...envelope,
      status: envelope.status === 'completed' ? 'completed' : 'sent',
    }
    envelope = appendAudit(
      envelope,
      'sent',
      session.email,
      results.map((r) => `${r.email}:${r.sent ? 'ok' : 'fail'}`).join(', '),
    )
    await saveEnvelope(envelope)

    return NextResponse.json({ ok: true, envelope, results })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not send invites.' }, { status: 500 })
  }
}
