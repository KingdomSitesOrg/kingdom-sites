import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'

export const dynamic = 'force-dynamic'

export default async function SignIndexPage() {
  const session = await getAdminSession()
  redirect(session ? '/sign/dashboard' : '/sign/login')
}
