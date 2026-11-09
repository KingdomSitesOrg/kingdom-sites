/** The price the demand question asks about. */
export const PRICE_USD = 129;

export const ANSWERS = ["yes", "maybe", "no"] as const;
export type Answer = (typeof ANSWERS)[number];

export function validAnswer(a: unknown): a is Answer {
  return typeof a === "string" && (ANSWERS as readonly string[]).includes(a);
}

export const CONTACT_EMAIL = "thomas@kingdom-sites.com";
