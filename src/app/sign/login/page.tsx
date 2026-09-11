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
        Admin access for Kingdom Sites Sign. Use the email and password configured in the
        environment.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  )
}
