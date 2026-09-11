import SignerClient from '@/components/sign/SignerClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }

export default async function SignerPage({ params }: Props) {
  const { token } = await params
  return <SignerClient token={token} />
}
