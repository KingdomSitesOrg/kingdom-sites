/**
 * Who to reach at Kingdom Sites.
 *
 * Enquiries go through the form first (INQUIRE_PATH → /api/inquiry).
 * Sales contact is Jack; Thomas designs, builds, ships, and maintains the product work.
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

/** Product enquiry form (same delivery stack as the old free-look). */
export const INQUIRE_PATH = '/get-started'
export const INQUIRE_CTA = 'Start an enquiry'
export const INQUIRE_API = '/api/inquiry'

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
      'Software engineer who designs, builds, ships, and maintains mobile-led custom products, systems, and AI — the person who does the work and stays after launch.',
  },
  {
    id: 'jack',
    name: SALES_NAME,
    role: 'Sales',
    email: SALES_EMAIL,
    mailto: SALES_MAILTO,
    /* Drop the file at public/Photos/jack.jpg when ready; About will pick it up. */
    photoSrc: null,
    photoAlt: 'Jack',
    blurb:
      'Sales contact. Reach out about fit, complexity band, and getting started — he will loop in engineering when it is time to build.',
  },
]
