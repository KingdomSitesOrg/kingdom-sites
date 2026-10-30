import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSignUser } from '@/lib/sign/auth'
import NewEnvelopeForm from '@/components/sign/NewEnvelopeForm'
import SignSteps from '@/components/sign/SignSteps'

export const dynamic = 'force-dynamic'

export default async function SignNewPage() {
  const session = await getSignUser()
  if (!session) redirect('/sign/login')
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/sign/dashboard" className="btn-ghost-sm">
        ← Back to documents
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">New document</h1>
      <div className="mt-3">
        <SignSteps current={0} />
      </div>
      <p className="mt-3 text-sm text-body">
        Upload the PDF and say who signs it. On the next screen you click where each person signs.
      </p>
      <div className="mt-6">
        <NewEnvelopeForm />
      </div>
    </div>
  )
}
