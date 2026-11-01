import { NextResponse } from 'next/server'
import { activePlan } from '@/lib/sign/accounts'
import { allowanceFor, currentAccount, signedOut } from '@/lib/sign/billing-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Plan and this month's use, for the account page while it waits on Stripe. */
export async function GET() {
  const account = await currentAccount()
  if (!account) return signedOut()
  const allowance = await allowanceFor(account)
  return NextResponse.json({
    ok: true,
    plan: activePlan(account)?.id ?? null,
    status: account.subscriptionStatus ?? null,
    used: allowance.used,
    limit: allowance.limit,
  })
}
