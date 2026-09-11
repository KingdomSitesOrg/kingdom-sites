import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import NewEnvelopeForm from '@/components/sign/NewEnvelopeForm'

export const dynamic = 'force-dynamic'

export default async function SignNewPage() {
  const session = await getAdminSession()
  if (!session) redirect('/sign/login')
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/sign/dashboard" className="btn-ghost-sm">
        ← Back to documents
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">New document</h1>
      <p className="mt-2 text-sm text-body">
        Upload a PDF and add Client + Provider (name and email). You will place signature boxes on the
        next screen.
      </p>
      <div className="mt-6">
        <NewEnvelopeForm />
      </div>
    </div>
  )
}
