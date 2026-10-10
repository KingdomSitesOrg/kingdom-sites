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
