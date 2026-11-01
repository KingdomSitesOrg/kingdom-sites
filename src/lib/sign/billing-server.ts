import { NextResponse } from 'next/server'
import { getAccount, sendingAllowance, type SignAccount } from './accounts'
import { getSignUser } from './auth'
import { listEnvelopes } from './store'
import { StripeConfigError } from './stripe'

/** The signed-in customer's account, or null (Thomas has no plan to manage). */
export async function currentAccount(): Promise<SignAccount | null> {
  const user = await getSignUser()
  if (user?.kind !== 'account') return null
  return getAccount(user.accountId)
}

export async function allowanceFor(account: SignAccount) {
  return sendingAllowance(account, await listEnvelopes(account.id))
}

/** Where the browser came from, for Stripe's return addresses. */
export function requestOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto =
    request.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') || host?.startsWith('127.') ? 'http' : 'https')
  return host ? `${proto}://${host}` : new URL(request.url).origin
}

export function billingError(error: unknown) {
  if (error instanceof StripeConfigError) {
    return NextResponse.json({ ok: false, error: 'Billing is not set up yet.' }, { status: 503 })
  }
  return NextResponse.json({ ok: false, error: 'Could not reach billing. Try again.' }, { status: 502 })
}

export function signedOut() {
  return NextResponse.json({ ok: false, error: 'Sign in to your Sign account first.' }, { status: 401 })
}
