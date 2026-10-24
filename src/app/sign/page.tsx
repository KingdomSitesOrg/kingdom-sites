import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import { getSignAccess } from '@/lib/sign/access'

export const dynamic = 'force-dynamic'

export default async function SignIndexPage() {
  const session = await getAdminSession()
  if (!session) redirect('/sign/pricing')
  const access = await getSignAccess()
  redirect(access ? '/sign/dashboard' : '/sign/pricing')
}
