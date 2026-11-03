import { Archivo, Figtree } from 'next/font/google'
import localFont from 'next/font/local'

/* Direction 2 (cinematic): one family, Archivo, narrowed for the big lines
   (width 72) and at its normal width for reading. */
export const sans = Archivo({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--cn-sans' })

/* The home page hero: Switzer (Fontshare, free for commercial use), served
   from this site, in the four weights the hero uses. */
export const switzer = localFont({
  src: [
    { path: '../../../public/fonts/switzer/Switzer-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/switzer/Switzer-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../../public/fonts/switzer/Switzer-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../../public/fonts/switzer/Switzer-Extrabold.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--sw-sans',
})

/* The home page hero's second look (?look=figtree, the default while Thomas
   tries it): Figtree from Google Fonts, served from this site at build. One
   variable file covers every weight the hero uses (500 to 800). */
export const figtree = Figtree({ subsets: ['latin'], display: 'swap', variable: '--fig-sans' })
