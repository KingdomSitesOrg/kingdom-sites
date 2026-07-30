'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Keep landing on a link like /tap-to-tick#pricing at that section
    // instead of yanking the visitor back to the top of the page.
    if (window.location.hash) return
    window.scrollTo(0, 0)
  }, [pathname])

  // App product pages keep each app's own branding, so they render without the
  // Kingdom Sites header and footer.
  const standalone = ['/tap-to-tick', '/latin-game', '/ministry'].some((p) => pathname?.startsWith(p))

  // No overflow clipping here — it would make this element the scroll container
  // and stop the product page's sticky nav from sticking.
  if (standalone) {
    return <main className="w-full">{children}</main>
  }

  // `overflow-x: clip` rather than `hidden` on the wrapper: hidden would make it
  // a scroll container, and the sticky header inside it would stop sticking on
  // both mobile and desktop. Clip still keeps stray width from scrolling.
  return (
    <div className="min-h-screen min-h-dvh w-full overflow-x-clip text-ink">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
