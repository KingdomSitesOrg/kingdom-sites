import { CARD_SIZE, CARD_TYPE, EASIEST_LINE, referralCard } from '@/lib/refer/card'

/* A tracker link's preview: the program's own card, nothing about whose it is. */

export const alt = `Kingdom Sites referral program: ${EASIEST_LINE}`
export const size = CARD_SIZE
export const contentType = CARD_TYPE

export default function Image() {
  return referralCard(EASIEST_LINE)
}
