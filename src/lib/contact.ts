/**
 * Who to reach at Kingdom Sites.
 *
 * Enquiries go through the form (INQUIRE_PATH).
 * AI consultation uses a Calendly event on /ai-tooling.
 * Thomas handles product work and replies to every enquiry.
 */

export const CONTACT_EMAIL = 'thomas@kingdom-sites.com'
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`

/**
 * Default inbox targets for form delivery (Resend `to`).
 * LEAD_TO_EMAIL in the environment can still override for testing.
 */
export const INQUIRY_TO_EMAILS = [CONTACT_EMAIL] as const

/** Product enquiry form. */
export const INQUIRE_PATH = '/get-started'
export const INQUIRE_CTA = 'Start a conversation'
export const INQUIRE_API = '/api/inquiry'

/**
 * Paid AI consultation Calendly event on /ai-tooling.
 * Set the public event URL in Vercel / .env.local.
 */
export const CALENDLY_AI_URL = process.env.NEXT_PUBLIC_CALENDLY_AI_URL?.trim() || ''

export type TeamMember = {
  id: 'thomas'
  name: string
  role: string
  email: string
  mailto: string
  /** Public path under /public, e.g. /Photos/about.jpg — null until photo is added. */
  photoSrc: string | null
  photoAlt: string
  blurb: string
}

export const TEAM: TeamMember[] = [
  {
    id: 'thomas',
    name: 'Thomas Klein',
    role: 'Engineering — design, build, ship, maintain',
    email: CONTACT_EMAIL,
    mailto: CONTACT_MAILTO,
    photoSrc: '/Photos/about.jpg',
    photoAlt: 'Thomas and Monisha',
    blurb:
      'Software engineer who designs, builds, ships, and maintains mobile apps and the systems behind them — the person who does the work and stays after launch.',
  },
]
