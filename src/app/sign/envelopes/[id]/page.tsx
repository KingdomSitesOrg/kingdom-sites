import { redirect, notFound } from 'next/navigation'
import { getAdminSession } from '@/lib/sign/auth'
import { getEnvelope } from '@/lib/sign/store'
import EnvelopeEditor from '@/components/sign/EnvelopeEditor'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EnvelopePage({ params }: Props) {
  const session = await getAdminSession()
  if (!session) redirect('/sign/login')
  const { id } = await params
  const envelope = await getEnvelope(id)
  if (!envelope) notFound()
  return <EnvelopeEditor initial={envelope} />
}
