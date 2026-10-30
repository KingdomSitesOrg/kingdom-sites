'use client'

import { useEffect } from 'react'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import SiteChrome from '@/components/cinematic/SiteChrome'

export default function AppShell({
  children,
  structuredData,
}: {
  children: React.ReactNode
  /** Kingdom Sites' schema.org description, for search engines. */
  structuredData?: object
}) {
  const pathname = usePathname()
  // The section actually showing, whatever the address says: farzana.app/
  // shows the /farzana section while the address bar reads "/".
  const section = useSelectedLayoutSegment()

  useEffect(() => {
    // Keep landing on a link like /tap-to-tick#pricing at that section
    // instead of yanking the visitor back to the top of the page.
    if (window.location.hash) return
    window.scrollTo(0, 0)
  }, [pathname])

  // App product pages keep each app's own branding, so they render without the
  // Kingdom Sites header and footer. The front door is bare for a different
  // reason: it asks one question, and a menu offering ten other answers would
  // rather defeat the point.
  // Farzana (farzana.app) describes its own product to search engines, so
  // the studio's description stays off its pages.
  const studioData =
    structuredData && section !== 'farzana' ? (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    ) : null

  // The home page and the Farzana Classroom case study draw their own
  // header and footer (CinematicChrome) around their scroll scenes.
  const ownChrome = pathname === '/' || pathname === '/work/farzana'

  const standalone =
    ownChrome ||
    section === 'farzana' ||
    ['/tap-to-tick', '/latin-game', '/farzana', '/ministry', '/prayer', '/marketing-frame', '/sign', '/calc'].some((p) =>
      pathname?.startsWith(p),
    )

  // No overflow clipping here — it would make this element the scroll container
  // and stop the product page's sticky nav from sticking.
  if (standalone) {
    return (
      <>
        {studioData}
        <main className="w-full">{children}</main>
      </>
    )
  }

  // Every other studio page wears the home page's look: its header, its dark
  // room and its footer (T-365).
  return (
    <SiteChrome>
      {studioData}
      {children}
    </SiteChrome>
  )
}
