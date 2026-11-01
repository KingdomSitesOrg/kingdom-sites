import { redirect } from 'next/navigation'
import { getSignUser } from '@/lib/sign/auth'

export const dynamic = 'force-dynamic'

export default async function SignIndexPage() {
  const session = await getSignUser()
  redirect(session ? '/sign/dashboard' : '/sign/login')
}
