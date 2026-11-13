/**
 * The "Submit a request" form (/request, T-547, Thomas, 2026-11-13): a fuller
 * project request beside the short "Start a conversation" note. The choices
 * live here so the page, the form and the route that checks it agree.
 * A request reaches Thomas the same way every enquiry does (src/lib/enquiry.ts).
 */

export const REQUEST_PATH = '/request'
export const REQUEST_CTA = 'Submit a request'
export const REQUEST_API = '/api/request'

export const REQUEST_NEEDS = ['A website', 'A web app', 'A phone app', 'Help putting AI to work', 'Something else'] as const

export const REQUEST_STARTS = ['As soon as possible', 'In the next month', 'In 1 to 3 months', 'Later this year', 'Just exploring'] as const

export const REQUEST_DECIDER = ['Yes, I decide', 'Someone else decides', 'We decide together'] as const

/** Keeps only the choices the form offers, so a hand-made request can't put anything else in Thomas's email. */
export function pickOne<T extends readonly string[]>(choices: T, value: unknown): T[number] | '' {
  return typeof value === 'string' && (choices as readonly string[]).includes(value) ? (value as T[number]) : ''
}

export function pickMany<T extends readonly string[]>(choices: T, value: unknown): T[number][] {
  if (!Array.isArray(value)) return []
  return choices.filter((c) => value.includes(c))
}
