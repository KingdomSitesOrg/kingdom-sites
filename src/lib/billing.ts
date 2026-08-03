/**
 * Where the money actually gets collected.
 *
 * These are Stripe payment links — created once in the Stripe dashboard, one per
 * plan and billing period, then pasted in here. Nothing on this site talks to
 * Stripe directly: the customer clicks through to a page Stripe hosts and pays
 * there, which keeps card and bank details entirely out of this codebase.
 *
 * Until a link is filled in, the billing page quietly falls back to "email me
 * and I will send your link" rather than showing a button that goes nowhere.
 *
 * PORTAL_URL is the Stripe customer portal, where an existing customer updates
 * their card or bank details, downloads receipts, or cancels — without needing
 * to call. Find it in Stripe under Settings → Billing → Customer portal.
 */

export type PlanLinks = { monthly: string; annual: string }

export const PAYMENT_LINKS: Record<string, PlanLinks> = {
  foundation: { monthly: '', annual: '' },
  growth: { monthly: '', annual: '' },
  everything: { monthly: '', annual: '' },
}

export const PORTAL_URL = ''

export function hasAnyLinks() {
  return Object.values(PAYMENT_LINKS).some((p) => p.monthly !== '' || p.annual !== '')
}
