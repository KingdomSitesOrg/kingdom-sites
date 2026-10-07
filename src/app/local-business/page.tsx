import { redirect } from 'next/navigation'

/** Former local SEO product page — redirects home. */
export default function LocalBusinessRedirect() {
  redirect('/')
}
