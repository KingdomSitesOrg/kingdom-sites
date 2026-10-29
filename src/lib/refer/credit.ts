import * as Sentry from '@sentry/nextjs'
import { REFERRAL_CODE, REFERRAL_COOKIE } from '@/lib/referrals'
import { firstName, readReferrals, recordReferred } from './store'

/**
 * Someone who opened a referral link (it left the `ks_ref` cookie, see
 * `src/proxy.ts`) and then asked for a conversation: they count as that
 * referrer's (T-293), unless they are already someone's. Returns who referred
 * them, as "Anna (anna-7k2m)", for Thomas's email, or null. Never stops the enquiry itself: a record that
 * cannot be saved is reported and skipped.
 */
export async function creditReferral(
  request: Request,
  person: { name: string; email: string; note: string },
): Promise<string | null> {
  const cookie = request.headers.get('cookie') ?? ''
  const code = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFERRAL_COOKIE}=`))
    ?.slice(REFERRAL_COOKIE.length + 1)
    .toLowerCase()
  if (!code || !REFERRAL_CODE.test(code)) return null
  try {
    const referrer = (await readReferrals()).referrers.find((r) => r.code === code)
    if (!referrer) return null
    // Nobody earns a gift for sending themselves.
    if (referrer.email === person.email.trim().toLowerCase()) return null
    const recorded = await recordReferred({
      code,
      via: 'link',
      name: person.name,
      contactName: person.name,
      contactEmail: person.email.trim().toLowerCase(),
      website: '',
      note: person.note,
    })
    // Already someone's (the first referral wins): not this link's to claim.
    return recorded ? `${firstName(referrer.name)} (${code})` : null
  } catch (error) {
    Sentry.captureException(error)
    return null
  }
}
