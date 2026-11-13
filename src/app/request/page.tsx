import Link from 'next/link'
import type { Metadata } from 'next'
import RequestForm from '@/components/RequestForm'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { shareCard } from '@/lib/seo'

const DESCRIPTION =
  'Submit a project request to Kingdom Sites: a phone app, a web app, a website or AI put to work. A few questions about you, your budget and your timing, and Thomas replies within a day.'

export const metadata: Metadata = {
  title: 'Submit a request',
  description: DESCRIPTION,
  alternates: { canonical: '/request' },
  ...shareCard('Submit a request — Kingdom Sites', DESCRIPTION, '/request'),
}

/* The "Submit a request" page (T-547, Thomas, 2026-11-13): the fuller form,
   beside the short note on /get-started, which stays as it is. */
export default function RequestPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <div className="cn-wrap grid grid-cols-[minmax(0,1fr)] gap-12 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:grid-cols-[1fr_minmax(0,640px)] lg:gap-20">
        <section className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="cn-kicker cn-rise">Submit a request</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
            Tell me about your <span className="text-accent">project.</span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
            A few questions so I understand what you need before we talk. It takes about three minutes.
          </p>
          <p className="cn-rise cn-rise-3 mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            Just want to say hello?{' '}
            <Link href={INQUIRE_PATH} className="link-accent">
              {INQUIRE_CTA}
            </Link>{' '}
            instead.
          </p>
        </section>

        <section aria-label="Project request" className="min-w-0 cn-rise cn-rise-3">
          <RequestForm />
        </section>
      </div>
    </div>
  )
}
