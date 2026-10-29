import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import { readReferrals } from '@/lib/refer/store'
import ReferralsAdmin from '@/components/sign/ReferralsAdmin'

export const dynamic = 'force-dynamic'

/**
 * Thomas's side of the referral program (T-293): everyone with a link, who
 * each one sent, and the stage buttons he taps as each moves along. Behind the
 * /sign login. The referrer's tracker reads the same records.
 */
export default async function ReferralsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/sign/login')
  const doc = await readReferrals()
  const head = await headers()
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? ''
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Referrals</h1>
          <p className="mt-1 text-sm text-body">
            {doc.referrers.length} {doc.referrers.length === 1 ? 'referrer' : 'referrers'},{' '}
            {doc.referred.length} referred
          </p>
        </div>
        <Link href="/sign/dashboard" className="btn-ghost-sm">
          Documents
        </Link>
      </div>
      <div className="mt-8">
        <ReferralsAdmin doc={doc} origin={`${proto}://${host}`} />
      </div>
    </div>
  )
}
