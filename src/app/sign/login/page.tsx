import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import LoginForm from '@/components/sign/LoginForm'

export const dynamic = 'force-dynamic'

/* Where to go after signing in: a page on this site (?next=/inbox), never elsewhere. */
const nextPath = (next: unknown) => (typeof next === 'string' && /^\/(?!\/)/.test(next) ? next : '/sign/dashboard')

export default async function SignLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = nextPath((await searchParams).next)
  const session = await getAdminSession()
  if (session) redirect(next)
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-body">
        Admin access for Kingdom Sites Sign. Use the email and password configured in the
        environment.
      </p>
      <div className="mt-6">
        <LoginForm next={next} />
      </div>
    </div>
  )
}
