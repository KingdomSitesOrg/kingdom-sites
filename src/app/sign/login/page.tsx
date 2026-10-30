import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import LoginForm from '@/components/sign/LoginForm'

export const dynamic = 'force-dynamic'

export default async function SignLoginPage() {
  const session = await getAdminSession()
  if (session) redirect('/sign/dashboard')
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-body">
        Sign in to send documents for signature. Signing a document someone sent you needs no
        account: use the link in your email.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  )
}
