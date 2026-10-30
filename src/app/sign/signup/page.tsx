import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signPlan } from '@/lib/billing'
import { getSignUser } from '@/lib/sign/auth'
import SignupForm from '@/components/sign/SignupForm'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ plan?: string }> }

export default async function SignSignupPage({ searchParams }: Props) {
  if (await getSignUser()) redirect('/sign/account')
  const plan = signPlan((await searchParams).plan)
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your Sign account</h1>
      <p className="mt-2 text-sm text-body">
        {plan
          ? `Then confirm your email and start ${plan.name} ($${plan.priceMonthly} a month, ${plan.contractLimit} documents).`
          : 'Then confirm your email and choose a plan.'}
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-4 text-sm text-body">
        Already have an account?{' '}
        <Link href="/sign/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
