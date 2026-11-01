/**
 * Where the money actually gets collected.
 *
 * PAY_URL: one-time custom-amount invoice.
 * RETAINER_300 / RETAINER_800: monthly subscription links.
 * PORTAL_URL: Stripe customer portal (not activated yet).
 */

export type PlanLinks = { monthly: string; annual: string }

export const PAY_URL = 'https://buy.stripe.com/4gM14n4tC6bde3i6bn5Ne00'

export const RETAINER_300 = 'https://buy.stripe.com/7sY3cvbW42Z12kA6bn5Ne01'
export const RETAINER_800 = 'https://buy.stripe.com/28EcN55xG1UX2kA57j5Ne02'

export const PAYMENT_LINKS: Record<string, PlanLinks> = {
  focused: { monthly: RETAINER_300, annual: '' },
  full: { monthly: RETAINER_800, annual: '' },
  intensive: { monthly: '', annual: '' },
}

export const PORTAL_URL = ''

export function hasAnyLinks() {
  return Object.values(PAYMENT_LINKS).some((p) => p.monthly !== '' || p.annual !== '')
}


/**
 * Kingdom Sites Sign — subscription plans. Prices and limits live here; Stripe
 * holds the matching recurring Price, found by its lookup key (same key in
 * test and live mode), so no price id is written into the code.
 */
export type SignPlanId = 'starter' | 'growth'

export type SignPlan = {
  id: SignPlanId
  name: string
  priceMonthly: number
  /** Documents that can be sent for signing per billing month. */
  contractLimit: number
  /** Stripe Price lookup_key for the monthly price. */
  lookupKey: string
}

export const SIGN_PLANS: SignPlan[] = [
  {
    id: 'starter',
    name: 'Sign Starter',
    priceMonthly: 1,
    contractLimit: 5,
    lookupKey: 'sign_starter_monthly',
  },
  {
    id: 'growth',
    name: 'Sign Growth',
    priceMonthly: 10,
    contractLimit: 20,
    lookupKey: 'sign_growth_monthly',
  },
]

export function signPlan(id: string | null | undefined): SignPlan | undefined {
  return SIGN_PLANS.find((p) => p.id === id)
}

export function signPlanByLookupKey(key: string | null | undefined): SignPlan | undefined {
  return SIGN_PLANS.find((p) => p.lookupKey === key)
}
