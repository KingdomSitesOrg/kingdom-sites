import { redirect } from 'next/navigation'

/** Former Rochester trade SEO landing — quiet SEO page is /seo. */
export default function RochesterMnRedirect() {
  redirect('/seo')
}
