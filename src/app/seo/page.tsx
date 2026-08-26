import { redirect } from 'next/navigation'

/** Websites & SEO is no longer a product. */
export default function SeoRedirect() {
  redirect('/')
}
