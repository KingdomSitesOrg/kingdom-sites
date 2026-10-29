import { CARD_SIZE, CARD_TYPE, referralCard } from '@/lib/refer/card'
import { introLine } from '@/lib/refer/intro'

/* A personal link's preview: "Anna sent you here." when Anna said her first
   name may show on her link, otherwise the same card without a name. */

export const alt = 'A personal introduction to Kingdom Sites'
export const size = CARD_SIZE
export const contentType = CARD_TYPE

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return referralCard(await introLine(code))
}
