import { CARD_SIZE, CARD_TYPE, referralCard } from '@/lib/refer/card'
import { JOIN_GIFT } from '@/lib/referrals'

/* A tracker link's preview: the program's own card, nothing about whose it is. */

export const alt = `Kingdom Sites referral program: up to $${JOIN_GIFT}`
export const size = CARD_SIZE
export const contentType = CARD_TYPE

export default function Image() {
  return referralCard()
}
