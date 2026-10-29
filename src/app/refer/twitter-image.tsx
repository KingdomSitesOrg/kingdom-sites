import { CARD_SIZE, CARD_TYPE, referralCard } from '@/lib/refer/card'
import { JOIN_GIFT } from '@/lib/referrals'

/* The /refer link preview: the Kingdom Sites mark and $500, nothing more (T-297). */

export const alt = `Kingdom Sites referral program: $${JOIN_GIFT}`
export const size = CARD_SIZE
export const contentType = CARD_TYPE

export default function Image() {
  return referralCard()
}
