import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Inbox from '@/components/inbox/Inbox'
import { getAdminSession } from '@/lib/sign/auth'

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/** Thomas's messages from the site (lib/chat), behind his admin sign-in. */
export default async function InboxPage() {
  if (!(await getAdminSession())) redirect('/sign/login?next=/inbox')
  return <Inbox />
}
