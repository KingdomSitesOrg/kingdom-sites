import { Geist, Geist_Mono, Newsreader } from 'next/font/google'

/* Direction 1 (editorial): a book serif for everything big, a plain grotesk
   for reading, a mono for the small labels a printed index would carry. */
export const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--ed-serif',
})

export const sans = Geist({ subsets: ['latin'], display: 'swap', variable: '--ed-sans' })

export const mono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--ed-mono' })

export const fontVars = `${serif.variable} ${sans.variable} ${mono.variable}`
