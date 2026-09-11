import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import { getSignAccess } from '@/lib/sign/access'
import LoginForm from '@/components/sign/LoginForm'

export const dynamic = 'force-dynamic'

export default async function SignLoginPage() {
  const session = await getAdminSession()
  if (session) {
    const access = await getSignAccess()
    redirect(access ? '/sign/dashboard' : '/sign/pricing')
  }
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Owner sign in</h1>
      <p className="mt-2 text-sm text-body">
        Admin override for Kingdom Sites Sign. Subscribers get access after Stripe Checkout — use{' '}
        <Link href="/sign/pricing" className="text-accent underline-offset-2 hover:underline">
          Plans
        </Link>{' '}
        to subscribe.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  )
}
