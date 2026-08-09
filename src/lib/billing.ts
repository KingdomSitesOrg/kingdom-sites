/**
 * Where the money actually gets collected.
 *
 * Stripe payment links — one per pricing tier / billing period when used.
 * Until a link is filled in, the billing page falls back to email rather than
 * a button that goes nowhere.
 *
 * Keys match partnership ComplexityTier ids: focused | full | intensive.
 * Legacy SEO plan keys (foundation / growth / everything) are gone.
 *
 * PORTAL_URL is the Stripe customer portal for existing customers.
 */

export type PlanLinks = { monthly: string; annual: string }

export const PAYMENT_LINKS: Record<string, PlanLinks> = {
  focused: { monthly: '', annual: '' },
  full: { monthly: '', annual: '' },
  intensive: { monthly: '', annual: '' },
}

export const PORTAL_URL = ''

export function hasAnyLinks() {
  return Object.values(PAYMENT_LINKS).some((p) => p.monthly !== '' || p.annual !== '')
}
