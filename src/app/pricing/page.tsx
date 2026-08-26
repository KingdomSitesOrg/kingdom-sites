import { redirect } from 'next/navigation'

/** Pricing menu is gone — quotes happen after an enquiry. */
export default function PricingRedirect() {
  redirect('/get-started')
}
