'use client'

import { useEffect } from 'react'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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

  const standalone =
    section === 'farzana' ||
    ['/tap-to-tick', '/latin-game', '/farzana', '/ministry', '/prayer', '/marketing-frame', '/sign'].some((p) =>
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

  // `overflow-x: clip` rather than `hidden` on the wrapper: hidden would make it
  // a scroll container, and the sticky header inside it would stop sticking on
  // both mobile and desktop. Clip still keeps stray width from scrolling.
  return (
    <div className="min-h-screen min-h-dvh w-full overflow-x-clip text-ink">
      {studioData}
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
