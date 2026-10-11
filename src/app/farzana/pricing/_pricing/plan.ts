/**
 * Farzana's prices: one set of features, three sizes, by how many students a
 * school teaches. Thomas's decision (Oct 11, 2026). Every size gets every
 * feature and is set up for the school.
 *
 * The Farzana app's checkout (KingdomSitesOrg/farzana, `src/config/billing.ts`)
 * still charges the single $400 plan until tiered billing is built; change
 * these and that together once it is.
 */
export type Tier = {
  dollars: number
  /** The sizes, as a person reads them. */
  label: string
  /** Fewest and most students this size covers. */
  min: number
  max: number
}

export const TIERS: Tier[] = [
  { dollars: 100, label: 'Up to 100 students', min: 0, max: 100 },
  { dollars: 400, label: '101 to 7,999 students', min: 101, max: 7999 },
  { dollars: 800, label: '8,000 students or more', min: 8000, max: Infinity },
]

export const INTERVAL = 'month'

/** The size a school with this many students is on. */
export function tierFor(students: number): Tier {
  return TIERS.find((tier) => students <= tier.max) ?? TIERS[TIERS.length - 1]
}
