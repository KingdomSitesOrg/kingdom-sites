import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSignUser, ownerFor } from '@/lib/sign/auth'
import { activePlan, getAccount, sendingAllowance } from '@/lib/sign/accounts'
import { listEnvelopes } from '@/lib/sign/store'
import LogoutButton from '@/components/sign/LogoutButton'
import DocumentList from '@/components/sign/DocumentList'

export const dynamic = 'force-dynamic'

export default async function SignDashboardPage() {
  const session = await getSignUser()
  if (!session) redirect('/sign/login')
  const envelopes = await listEnvelopes(ownerFor(session))
  const account = session.kind === 'account' ? await getAccount(session.accountId) : null
  const allowance = account ? sendingAllowance(account, envelopes) : null
  const plan = account ? activePlan(account) : undefined

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-body">Signed in as {session.email}</p>
          {allowance ? (
            <p className="mt-1 text-sm text-body">
              {plan
                ? `${plan.name}: ${allowance.used} of ${allowance.limit} documents sent this month.`
                : 'No plan yet: you can prepare documents, and choose a plan to send them.'}{' '}
              <Link href="/sign/account" className="font-medium text-accent hover:underline">
                {plan ? 'Plan and billing' : 'Choose a plan'}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sign/new"
            className="btn-primary !min-h-10 !px-4 !py-2 !text-sm"
          >
            New document
          </Link>
          {session.kind === 'admin' ? (
            <Link href="/sign/referrals" className="btn-ghost-sm">
              Referrals
            </Link>
          ) : (
            <Link href="/sign/account" className="btn-ghost-sm">
              Account
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <div className="mt-8">
        <DocumentList initial={envelopes} />
      </div>
    </div>
  )
}
