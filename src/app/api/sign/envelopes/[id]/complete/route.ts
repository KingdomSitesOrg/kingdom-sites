import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError } from '@/lib/sign/auth'
import { ForbiddenError, requireSignAccess } from '@/lib/sign/access'
import {
  allSignersSigned,
  completeEnvelopeAfterAllSigned,
  needsCompletedPdf,
} from '@/lib/sign/complete'
import { getEnvelope } from '@/lib/sign/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Ctx = { params: Promise<{ id: string }> }

/** Admin recovery: stamp + mark completed + email when all parties signed but stuck. */
export async function POST(_request: Request, ctx: Ctx) {
  try {
    await requireSignAccess()
    const { id } = await ctx.params
    const existing = await getEnvelope(id)
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }
    if (!allSignersSigned(existing)) {
      return NextResponse.json(
        { ok: false, error: 'Not all parties have signed yet.' },
        { status: 400 },
      )
    }
    if (!needsCompletedPdf(existing) && existing.completedPdfKey) {
      return NextResponse.json({ ok: true, envelope: existing, alreadyCompleted: true })
    }

    const envelope = await completeEnvelopeAfterAllSigned(id)
    if (!envelope) {
      return NextResponse.json(
        { ok: false, error: 'Could not complete envelope (signatures may still be settling).' },
        { status: 409 },
      )
    }
    return NextResponse.json({ ok: true, envelope })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code, upgradeUrl: '/sign/pricing' },
        { status: 403 },
      )
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not generate completed PDF.' }, { status: 500 })
  }
}
