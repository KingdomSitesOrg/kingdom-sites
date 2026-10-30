import { Figtree, Source_Serif_4 } from 'next/font/google'

/* Direction 3 (warm): a bookish serif for the words that matter, a friendly
   sans for the rest. */
export const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--wm-serif',
})

export const sans = Figtree({ subsets: ['latin'], display: 'swap', variable: '--wm-sans' })

export const fontVars = `${serif.variable} ${sans.variable}`
