'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The Sign header's links. Someone opening a signing link only sees the
 * document: "Plans" and a link away from it are for the sender, not the signer.
 */
export default function SignHeaderNav() {
  const pathname = usePathname()
  if (pathname?.startsWith('/sign/s/')) {
    return <span className="text-xs text-muted">Secure signing link</span>
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/sign/pricing" className="btn-ghost-sm">
        Plans
      </Link>
      <Link href="/" className="btn-ghost-sm">
        kingdom-sites.com
      </Link>
    </div>
  )
}
