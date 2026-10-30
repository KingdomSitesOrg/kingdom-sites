import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_PATH } from '@/lib/contact'
import { introLine } from '@/lib/refer/intro'

export const dynamic = 'force-dynamic'

const DESCRIPTION =
  'Thomas at Kingdom Sites builds custom software for schools, businesses and any organization.'

/** Its own link preview (T-293): the name only when its owner said it may show. */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const line = await introLine(code)
  return {
    title: line,
    description: DESCRIPTION,
    openGraph: { title: line, description: DESCRIPTION, siteName: 'Kingdom Sites', type: 'website', url: `/r/${code.toLowerCase()}` },
    twitter: { card: 'summary_large_image', title: line, description: DESCRIPTION },
    // A personal link is for the people it is sent to, not for search engines.
    robots: { index: false, follow: false },
  }
}

/**
 * The page a personal referral link opens (/r/<code>, T-293). Opening it left
 * the referral cookie (`src/proxy.ts`), so asking for a conversation from here
 * counts for the referrer. The referrer's first name shows only if they said
 * it may. A code that matches nobody shows the same page, without a name.
 */
export default async function ReferralLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const line = await introLine(code)

  return (
    <div className="w-full overflow-x-hidden">
      <section className="cn-wrap pb-14 pt-16 sm:pb-20 sm:pt-24">
        <div className="max-w-4xl">
          <p className="cn-kicker cn-rise">A personal introduction</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance [overflow-wrap:anywhere]">
            {line}
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[48ch] text-pretty">
            I am Thomas, and Kingdom Sites is my studio. I build custom software for schools,
            businesses and any organization that needs software made for how it works. You talk with
            me from the first call to launch day and every month after.
          </p>
          <div className="cn-rise cn-rise-3 mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              Tell me what you need
            </Link>
            <Link href="/" className="btn-ghost">
              See Kingdom Sites
            </Link>
          </div>
        </div>
      </section>

      <section className="cn-wrap pb-24 sm:pb-32">
        <div className="tile-elevated flex flex-col gap-4 p-7 sm:p-10">
          <p className="cn-kicker">For schools and education</p>
          <h2 className="cn-display cn-h3">Farzana Classroom</h2>
          <p className="max-w-3xl text-pretty text-[15px] leading-relaxed text-body">
            Farzana Classroom is the education software I build for schools, training organizations and
            educational businesses: a proven platform with classes, students and families, payments
            and progress, and the features each school needs built on top. Tell me about your school
            and I will set up a call.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              Tell me about your school
            </Link>
            <a href="https://farzana.app" className="btn-ghost">
              See Farzana Classroom
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
