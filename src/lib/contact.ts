/**
 * Who to reach at Kingdom Sites.
 *
 * Enquiries go through the form (INQUIRE_PATH).
 * AI consultation uses a Calendly event on /ai-tooling.
 * Sales contact is Jack; Thomas does the product work.
 */

export const CONTACT_EMAIL = 'thomas@kingdom-sites.com'
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`

/** Sales — design, build, ship, and maintain conversations, fit, and next steps. */
export const SALES_EMAIL = 'jack@kingdom-sites.com'
export const SALES_MAILTO = `mailto:${SALES_EMAIL}`
export const SALES_NAME = 'Jack'

/**
 * Default inbox targets for form delivery (Resend `to`).
 * LEAD_TO_EMAIL in the environment can still override for testing.
 * Jack is included so sales sees every product-retainer enquiry.
 */
export const INQUIRY_TO_EMAILS = [CONTACT_EMAIL, SALES_EMAIL] as const

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
  id: 'thomas' | 'jack'
  name: string
  role: string
  email: string
  mailto: string
  /** Public path under /public, e.g. /Photos/jack.jpg — null until photo is added. */
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
  {
    id: 'jack',
    name: SALES_NAME,
    role: 'Sales',
    email: SALES_EMAIL,
    mailto: SALES_MAILTO,
    photoSrc: '/Photos/jack.jpg',
    photoAlt: 'Jack',
    blurb:
      'Sales contact. Reach out about an idea or a fit conversation — he will loop in engineering when it is time to build.',
  },
]
