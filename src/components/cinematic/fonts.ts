import { Archivo } from 'next/font/google'

/* Direction 2 (cinematic): one family, Archivo, narrowed for the big lines
   (width 72) and at its normal width for reading. */
export const sans = Archivo({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--cn-sans' })

/* The home page's headline face, chosen by Thomas on 2026-11-03: Geist Serif
   (Vercel, SIL Open Font License) in its Triangle shape, from the `geist`
   package. It comes in one weight, which reads as a medium. */
export { GeistSerifTriangle as geistSerif } from 'geist/font/serif/triangle'
