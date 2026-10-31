import { redirect } from 'next/navigation'

/** Former local SEO product page — the Rochester page took its place (T-387). */
export default function LocalBusinessRedirect() {
  redirect('/rochester-mn')
}
