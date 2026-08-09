import { redirect } from 'next/navigation'

/** Former free-look funnel — contact is email; main offer is on home. */
export default function GetStartedRedirect() {
  redirect('/')
}
