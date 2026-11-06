export const GOAL_USD = 2000;

export const TIERS = [
  { amount: 25, name: "Supporter" },
  { amount: 50, name: "Early Supporter" },
  { amount: 100, name: "Founding Supporter" },
  { amount: 250, name: "Prototype Backer" },
] as const;

export const MIN_CUSTOM_USD = 1;
export const MAX_CUSTOM_USD = 10000;

export const CHECKOUT_LINE =
  "By contributing, you agree that this contribution is non-refundable and supports prototype development only.";

export const CONTACT_EMAIL = "thomas@kingdom-sites.com";

/** Every Pocket Thought payment carries this tag in the Kingdom Sites Stripe account; the progress bar totals them. */
export const PROJECT_TAG = "pocket-thought";

/** Card statements read "KINGDOM-SI* PKTTHOUGHT": the account's prefix leaves 10 characters for the suffix. */
export const STATEMENT_SUFFIX = "PKTTHOUGHT";

export function tierName(amount: number): string | null {
  return TIERS.find((t) => t.amount === amount)?.name ?? null;
}

export function validAmount(amount: unknown): amount is number {
  return (
    typeof amount === "number" &&
    Number.isInteger(amount) &&
    amount >= MIN_CUSTOM_USD &&
    amount <= MAX_CUSTOM_USD
  );
}

export type PaymentSettings = {
  stripe: boolean;
  paypalUrl: string | null;
  venmoUser: string | null;
};
