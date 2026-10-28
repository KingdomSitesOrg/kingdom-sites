import type { Metadata } from 'next'
import Calculator from './Calculator'

/* A working tool for calls, not a marketing page: kept out of search and out of
   the site's navigation. */
export const metadata: Metadata = {
  title: 'Video cost calculator',
  description: 'What hosted class videos cost on Bunny Stream each month.',
  robots: { index: false, follow: false },
}

export default function CalcPage() {
  return <Calculator />
}
