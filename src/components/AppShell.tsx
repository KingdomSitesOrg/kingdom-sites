'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import SiteChrome from '@/components/cinematic/SiteChrome'
import Intelligence from '@/components/intelligence/Intelligence'
import PhoneScrollIndicator from '@/components/PhoneScrollIndicator'
import { paintDark } from '@/lib/paint-dark'

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
  // Set by back and forward, which restore the scroll position themselves.
  const backForward = useRef(false)

  // Layout effect: the new page is placed at the top before it is painted, so
  // a visitor never sees it at the old scroll position first.
  useLayoutEffect(() => {
    // Keep landing on a link like /tap-to-tick#pricing at that section
    // instead of yanking the visitor back to the top of the page.
    if (window.location.hash) return
    if (backForward.current) {
      backForward.current = false
      return
    }
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const onPop = () => {
      backForward.current = true
    }
    // Only a click on an in-page link (same page, #section) glides. Every other
    // move, including a link to another page, lands instantly.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return
      backForward.current = false
      const to = new URL(link.href)
      if (to.origin !== location.origin || to.pathname !== location.pathname || !to.hash) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const root = document.documentElement
      root.style.scrollBehavior = 'smooth'
      const done = () => {
        root.style.scrollBehavior = ''
      }
      window.addEventListener('scrollend', done, { once: true })
      window.setTimeout(done, 1500)
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

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

  // The home page and the Portfolio page draw their own header and footer
  // (CinematicChrome) around their scroll scenes.
  const ownChrome = pathname === '/' || pathname === '/portfolio'

  const standalone =
    ownChrome ||
    section === 'farzana' ||
    ['/tap-to-tick', '/latin-game', '/farzana', '/ministry', '/prayer', '/marketing-frame', '/sign', '/calc'].some((p) =>
      pathname?.startsWith(p),
    )

  // The studio's dark pages tell iOS to colour its status bar and bottom edge dark
  // too, instead of showing the light page canvas behind them.
  const darkRoom = (ownChrome || !standalone) && section !== 'farzana'
  useEffect(() => {
    if (!darkRoom) return
    return paintDark()
  }, [darkRoom])

  // Intelligence, the chat square (T-375), is on every studio page. Not on the
  // Farzana pages, which are farzana.app's own brand, and not in the Sign tool
  // (sending or signing a document; its plans page keeps it). It covered the
  // corner of the document being signed. It sits outside the page's own tree, so a
  // conversation carries on from page to page.
  // The Get started page has the chat built into the page, so no second one floats there.
  const inSignTool =
    (pathname === '/sign' || pathname?.startsWith('/sign/')) && !pathname.startsWith('/sign/pricing')
  const intelligence =
    section === 'farzana' || inSignTool || pathname === '/get-started' ? null : <Intelligence />

  return (
    <>
      {standalone ? (
        // No overflow clipping here — it would make this element the scroll container
        // and stop the product page's sticky nav from sticking.
        <>
          {studioData}
          <main className="w-full">{children}</main>
        </>
      ) : (
        // Every other studio page wears the home page's look: its header, its dark
        // room and its footer (T-365).
        <SiteChrome>
          {studioData}
          {children}
        </SiteChrome>
      )}
      {intelligence}
      <PhoneScrollIndicator />
    </>
  )
}
