import Link from 'next/link'
import type { Metadata } from 'next'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { shareCard } from '@/lib/seo'

const DESCRIPTION = 'Thomas Klein of Kingdom Sites also makes promotional videos for businesses.'

export const metadata: Metadata = {
  title: 'Media',
  description: DESCRIPTION,
  alternates: { canonical: '/media' },
  ...shareCard('Media — Kingdom Sites', DESCRIPTION, '/media'),
}

/* A small page saying Thomas also makes media, such as promotional videos
   (T-616, Thomas 2026-11-19). Same look and contact line as /about. */
export default function Media() {
  return (
    <div className="cn-wrap pb-16 pt-16 sm:pb-24 sm:pt-24">
      <div className="max-w-3xl">
        <p className="cn-kicker cn-rise">Media</p>
        <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
          Promotional <span className="text-accent">videos.</span>
        </h1>
        <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
          Besides apps and websites, I make promotional videos for businesses: short films that show
          what you do, for your website and social media.
        </p>
      </div>

      <div className="mt-20 border-t border-line pt-12">
        <Link href={INQUIRE_PATH} className="btn-primary">
          {INQUIRE_CTA}
        </Link>
        <p className="mt-4 text-sm text-body">Every enquiry comes to me, and I reply personally.</p>
      </div>
    </div>
  )
}
