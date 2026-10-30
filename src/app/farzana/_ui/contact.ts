import { CONTACT_EMAIL } from '@/lib/contact'

/**
 * Where a Farzana visitor goes to book a call, and who they reach.
 *
 * Booking is a request for now: the form posts to the site's own enquiry
 * route (/api/inquiry, the same Resend setup as every other enquiry) marked as
 * a Farzana call request, and Thomas replies with a time. His own calendar
 * replaces the form later (THO-200); every button points at BOOK_PATH, so
 * nothing else changes when it does.
 */
export { CONTACT_EMAIL }

export const BOOK_PATH = '/farzana/book'

/** Where the film sits, near the end of the page. */
export const FILM_PATH = '/farzana#film'

/** The two pages beside the front page. */
export const ABOUT_PATH = '/farzana/about'
export const PRICING_PATH = '/farzana/pricing'

/** JAM Legio, Thomas's Latin learning game, on the App Store. */
export const LATIN_GAME_URL = 'https://apps.apple.com/us/app/jam-legio/id6797884645'

/**
 * Kingdom Sites pages the About page points to: the mission, and Thomas's
 * work on Ruta. Full addresses, since the Farzana pages are served at
 * farzana.app.
 */
export const MISSION_URL = 'https://kingdom-sites.com/mission'
export const RUTA_URL = 'https://kingdom-sites.com/ruta'
