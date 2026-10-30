import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getAdminSession } from '@/lib/sign/auth'
import { isJoinGift, isPayoutMethod, isStageKey } from '@/lib/referrals'
import { markStage, removeReferrer } from '@/lib/refer/store'

/**
 * Thomas's side of the referral program (/sign/referrals): mark a stage on a
 * referred lead, or remove a referrer. Behind the /sign login; nothing here
 * pays anybody, it records what Thomas did.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ ok: false, error: 'Please log in again.' }, { status: 401 })
  }
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>
  try {
    if (body.action === 'stage') {
      const stage = body.stage
      if (typeof body.id !== 'string' || !(isStageKey(stage) || stage === 'ended')) {
        return NextResponse.json({ ok: false, error: 'Unknown stage.' }, { status: 400 })
      }
      const via = isPayoutMethod(body.via) ? body.via : undefined
      const amount = isJoinGift(body.amount) ? body.amount : undefined
      if (stage === 'joinPaid' && body.on === true && !amount) {
        return NextResponse.json({ ok: false, error: 'Pick $100 or $500.' }, { status: 400 })
      }
      const found = await markStage(body.id, stage, body.on === true, via, amount)
      return NextResponse.json({ ok: found }, { status: found ? 200 : 404 })
    }
    if (body.action === 'remove' && typeof body.code === 'string') {
      const found = await removeReferrer(body.code)
      return NextResponse.json({ ok: found }, { status: found ? 200 : 404 })
    }
    return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'That did not save. Try again.' }, { status: 503 })
  }
}
