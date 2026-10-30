import Link from 'next/link'
import type { Metadata } from 'next'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

/* Any address the site does not have. It sits in the studio's chrome (AppShell). */
export default function NotFound() {
  return (
    <section className="cn-wrap pb-28 pt-20 sm:pb-40 sm:pt-32">
      <p className="cn-kicker cn-rise">404</p>
      <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 max-w-[12ch]">This page is not here.</h1>
      <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[42ch]">
        The address may be old or mistyped. The work, the studio and a way to reach us are one click away.
      </p>
      <div className="cn-rise cn-rise-3 mt-10 flex flex-wrap gap-3">
        <Link href="/" className="cn-btn">
          Home <span aria-hidden="true">→</span>
        </Link>
        <Link href={INQUIRE_PATH} className="cn-ghost">
          {INQUIRE_CTA}
        </Link>
      </div>
    </section>
  )
}
