import { CARD_SIZE, CARD_TYPE, EASIEST_LINE, referralCard } from '@/lib/refer/card'

/* The /refer link preview: the Kingdom Sites mark, $500 and the page's own line. */

export const alt = `Kingdom Sites referral program: ${EASIEST_LINE}`
export const size = CARD_SIZE
export const contentType = CARD_TYPE

export default function Image() {
  return referralCard(EASIEST_LINE)
}
