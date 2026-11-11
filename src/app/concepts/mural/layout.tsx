import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import MuralRoot from './_components/Root'

/*
 * The Mural concept: a possible Kingdom Sites home page, drawn as a tiled wall
 * (night-sky ink, an off-white wall, one orange, one blue). It lives only at
 * /concepts/mural: its typefaces and stylesheet load from this layout, and
 * AppShell leaves the studio's header, footer and chat square off it.
 */

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
  return <MuralRoot>{children}</MuralRoot>
}
