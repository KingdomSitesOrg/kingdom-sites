import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_PATH } from '@/lib/contact'
import { REFERRAL_CODE } from '@/lib/referrals'
import { firstName, referrerByCode } from '@/lib/refer/store'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'A personal introduction',
  description: 'Thomas at Kingdom Sites builds custom software for any organization, and Farzana for schools.',
  // A personal link is for the people it is sent to, not for search engines.
  robots: { index: false, follow: false },
}

/**
 * The page a personal referral link opens (/r/<code>, T-293). Opening it left
 * the referral cookie (`src/proxy.ts`), so asking for a conversation from here
 * counts for the referrer. The referrer's first name shows only if they said
 * it may. A code that matches nobody shows the same page, without a name.
 */
export default async function ReferralLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const wanted = code.toLowerCase()
  const referrer = REFERRAL_CODE.test(wanted) ? await referrerByCode(wanted).catch(() => null) : null
  const name = referrer?.showName ? firstName(referrer.name) : ''

  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">A personal introduction</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink [overflow-wrap:anywhere] sm:text-5xl">
            {name ? `${name} sent you here.` : 'Someone sent you here.'}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            I am Thomas, and Kingdom Sites is my studio. I build custom software for schools,
            businesses and any organization that needs software made for how it works. You talk with
            me from the first call to launch day and every month after.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              Tell me what you need
            </Link>
            <Link href="/" className="btn-ghost">
              See Kingdom Sites
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="tile-elevated mx-auto flex max-w-6xl flex-col gap-4 p-7 sm:p-10">
          <p className="text-sm font-semibold text-accent">For schools and education</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Farzana</h2>
          <p className="max-w-3xl text-pretty text-[15px] leading-relaxed text-body">
            Farzana is the education software I build for schools, training organizations and
            educational businesses: a proven platform with classes, students and families, payments
            and progress, and the features each school needs built on top. Tell me about your school
            and we will start with a call.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              Tell me about your school
            </Link>
            <a href="https://farzana.app" className="btn-ghost">
              See Farzana
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
