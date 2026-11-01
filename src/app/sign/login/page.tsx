import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSignUser } from '@/lib/sign/auth'
import LoginForm from '@/components/sign/LoginForm'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ confirm?: string }> }

export default async function SignLoginPage({ searchParams }: Props) {
  const confirmInvalid = (await searchParams).confirm === 'invalid'
  const session = await getSignUser()
  if (session) redirect('/sign/dashboard')
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-body">
        Sign in to send documents for signature. Signing a document someone sent you needs no
        account: use the link in your email.
      </p>
      {confirmInvalid ? (
        <p role="alert" className="mt-3 text-sm text-warm">
          That confirmation link has expired or was already used. Sign in, or sign up again with the
          same email for a new link.
        </p>
      ) : null}
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-body">
        New to Sign?{' '}
        <Link href="/sign/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
