/**
 * Farzana's one plan, as the pricing page shows it. The same numbers as the
 * Farzana app's own billing settings (KingdomSitesOrg/edu,
 * `src/config/billing.ts`): one plan, $400 a month, in US dollars. Thomas's
 * decision; change it there and here together.
 */
export const PLAN = { dollars: 400, interval: 'month' } as const

/** The price as a person reads it: "$400". */
export const PLAN_PRICE = `$${PLAN.dollars}`
