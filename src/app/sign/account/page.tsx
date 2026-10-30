import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SIGN_PLANS } from '@/lib/billing'
import { activePlan, getAccount, sendingAllowance } from '@/lib/sign/accounts'
import { getSignUser } from '@/lib/sign/auth'
import { listEnvelopes } from '@/lib/sign/store'
import AccountBilling from '@/components/sign/AccountBilling'
import LogoutButton from '@/components/sign/LogoutButton'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ checkout?: string; welcome?: string }> }

export default async function SignAccountPage({ searchParams }: Props) {
  const user = await getSignUser()
  if (!user) redirect('/sign/login')
  if (user.kind === 'admin') redirect('/sign/dashboard')
  const account = await getAccount(user.accountId)
  if (!account) redirect('/sign/login')
  const { checkout, welcome } = await searchParams
  const plan = activePlan(account)
  const allowance = sendingAllowance(account, await listEnvelopes(account.id))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/sign/dashboard" className="btn-ghost-sm">
            ← Documents
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
            {welcome ? `Welcome, ${account.name}` : 'Plan and billing'}
          </h1>
          <p className="mt-1 text-sm text-body">{account.email}</p>
        </div>
        <LogoutButton />
      </div>
      <AccountBilling
        plans={SIGN_PLANS}
        currentPlanId={plan?.id ?? null}
        status={account.subscriptionStatus ?? null}
        used={allowance.used}
        limit={allowance.limit}
        periodEnd={account.periodEnd ?? null}
        cancelAtPeriodEnd={Boolean(account.cancelAtPeriodEnd)}
        hasCustomer={Boolean(account.stripeCustomerId)}
        checkout={checkout ?? null}
      />
    </div>
  )
}
