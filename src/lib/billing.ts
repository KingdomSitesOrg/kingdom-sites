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


/** Kingdom Sites Sign — SaaS plans (Payment Links). */
export type SignPlanId = 'starter' | 'growth'

export type SignPlan = {
  id: SignPlanId
  name: string
  priceMonthly: number
  contractLimit: number
  /** Stripe Payment Link — set after creating products in Stripe Dashboard */
  paymentLink: string
}

export const SIGN_STARTER_LINK =
  process.env.NEXT_PUBLIC_SIGN_STARTER_LINK?.trim() ||
  'https://buy.stripe.com/aFa00j3pygPRgbqarD5Ne07'

export const SIGN_GROWTH_LINK =
  process.env.NEXT_PUBLIC_SIGN_GROWTH_LINK?.trim() ||
  'https://buy.stripe.com/dRm4gzgckfLN7EU2Zb5Ne06'

export const SIGN_PLANS: SignPlan[] = [
  {
    id: 'starter',
    name: 'Sign Starter',
    priceMonthly: 1,
    contractLimit: 5,
    paymentLink: SIGN_STARTER_LINK,
  },
  {
    id: 'growth',
    name: 'Sign Growth',
    priceMonthly: 10,
    contractLimit: 20,
    paymentLink: SIGN_GROWTH_LINK,
  },
]
