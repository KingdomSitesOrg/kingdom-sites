import { Archivo } from 'next/font/google'

/* Direction 2 (cinematic): one family, Archivo, narrowed for the big lines
   (width 72) and at its normal width for reading. */
export const sans = Archivo({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--cn-sans' })
