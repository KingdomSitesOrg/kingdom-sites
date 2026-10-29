import { REFERRAL_CODE } from '@/lib/referrals'
import { firstName, referrerByCode } from './store'

/** The first name a personal link may show: only when its owner said so. */
export async function introName(code: string): Promise<string> {
  const wanted = code.toLowerCase()
  if (!REFERRAL_CODE.test(wanted)) return ''
  const referrer = await referrerByCode(wanted).catch(() => null)
  return referrer?.showName ? firstName(referrer.name) : ''
}

/** A personal link's headline: "Anna sent you here." or "Someone sent you here." */
export async function introLine(code: string): Promise<string> {
  const name = await introName(code)
  return name ? `${name} sent you here.` : 'Someone sent you here.'
}
