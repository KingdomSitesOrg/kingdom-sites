import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession } from '@/lib/sign/auth'
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

async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) throw new AuthError()
  return session
}

/** Admin recovery: stamp + mark completed + email when all parties signed but stuck. */
export async function POST(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin()
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
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not generate completed PDF.' }, { status: 500 })
  }
}
