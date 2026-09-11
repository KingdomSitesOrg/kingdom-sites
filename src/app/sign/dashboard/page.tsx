import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import { getSignAccess } from '@/lib/sign/access'
import { listEnvelopes, listEnvelopesForOwner } from '@/lib/sign/store'
import LogoutButton from '@/components/sign/LogoutButton'
import DocumentList from '@/components/sign/DocumentList'

export const dynamic = 'force-dynamic'

export default async function SignDashboardPage() {
  const session = await getAdminSession()
  if (!session) redirect('/sign/login')
  const access = await getSignAccess()
  if (!access) redirect('/sign/pricing')

  const envelopes = access.isAdmin
    ? await listEnvelopes()
    : await listEnvelopesForOwner(access.session.email)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-body">
            Signed in as {session.email}
            {access.isAdmin ? ' (owner)' : access.entitlement ? ` · ${access.entitlement.plan}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Link
            href="/sign/new"
            className="btn-primary !min-h-10 !px-4 !py-2 !text-sm"
          >
            New document
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <DocumentList initial={envelopes} />
      </div>
    </div>
  )
}
