import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Unbounded } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './mural.css'

/*
 * The Mural concept: a possible Kingdom Sites home page, drawn as a tiled wall
 * (night-sky ink, an off-white wall, one orange, one blue). It lives only at
 * /concepts/mural: its typefaces and stylesheet load from this layout, and
 * AppShell leaves the studio's header, footer and chat square off it.
 */

/* Wide and blocky for the big lines; Geist for reading, Geist Mono for labels. */
const display = Unbounded({ subsets: ['latin'], display: 'swap', variable: '--font-unbounded' })

const DESCRIPTION = 'A concept for the Kingdom Sites home page: a tiled mural you can lay tiles on.'

export const metadata: Metadata = {
  title: { absolute: 'Mural concept | Kingdom Sites' },
  description: DESCRIPTION,
  // A concept, not a page of the live site: kept out of search.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: '/concepts/mural' },
}

export const viewport: Viewport = {
  themeColor: '#0A0C12',
  viewportFit: 'cover',
}

export default function MuralLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // The script below adds a class to this element before React takes over, hence suppressHydrationWarning.
    <div className={`mu ${display.variable} ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      {/* Marks the page as scripted before it paints, so pieces that rise into
          place start hidden only where a script will bring them in. */}
      <script dangerouslySetInnerHTML={{ __html: "document.currentScript.parentElement.classList.add('mu-js')" }} />
      {/* The chat button sits outside this element, so the mural's wide typeface is handed to it by name (mural.css draws the rest). */}
      <style dangerouslySetInnerHTML={{ __html: `body:has(.mu) .ki-square{font-family:${display.style.fontFamily},'Arial Black',system-ui,sans-serif}` }} />
      {children}
    </div>
  )
}
