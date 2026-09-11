import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import { listEnvelopes } from '@/lib/sign/store'
import LogoutButton from '@/components/sign/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function SignDashboardPage() {
  const session = await getAdminSession()
  if (!session) redirect('/sign/login')
  const envelopes = await listEnvelopes()

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-body">Signed in as {session.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Link
            href="/sign/new"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            New document
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {envelopes.length === 0 ? (
          <div className="tile p-6 text-sm text-body">
            No documents yet. Upload a PDF to create your first signing request.
          </div>
        ) : (
          envelopes.map((env) => (
            <Link
              key={env.id}
              href={`/sign/envelopes/${env.id}`}
              className="tile block p-4 transition hover:border-line-strong"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-ink">{env.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {env.signedCount}/{env.signerCount} signed · {env.pageCount} page
                    {env.pageCount === 1 ? '' : 's'} · updated{' '}
                    {new Date(env.updatedAt).toLocaleString()}
                  </div>
                </div>
                <StatusPill status={env.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-surface-2 text-body',
    sent: 'bg-blue-50 text-accent',
    completed: 'bg-emerald-50 text-emerald-800',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
