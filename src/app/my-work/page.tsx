import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { APP_PROOF } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'My portfolio',
  description:
    'Ruta, Jam with Latin, and Tap to Tick — mobile apps I design, build, ship, and maintain. Not products for sale off the shelf.',
  alternates: { canonical: '/my-work' },
}

export default function MyWork() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
          My portfolio.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
          Mobile apps — and the software that makes them real. Proof for hiring someone who stays
          after launch, not products you buy off this site.
        </p>
      </section>

      <section aria-label="Apps" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-16">
          {APP_PROOF.map((app) => (
            <div key={app.name} className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="flex items-end justify-center self-start pb-4">
                {app.shots.map((shot, i) => (
                  <div
                    key={shot.src}
                    className={`overflow-hidden rounded-[26px] shadow-[0_18px_44px_rgba(16,23,37,0.16)] ${
                      i === 1
                        ? 'z-10 w-[46%] max-w-[200px]'
                        : `w-[34%] max-w-[150px] translate-y-4 ${i === 0 ? '-mr-3' : '-ml-3'}`
                    }`}
                  >
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={360}
                      height={780}
                      className="h-auto w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="self-start lg:pt-6">
                <h2 className="text-3xl font-semibold tracking-tight text-ink">{app.name}</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-body">{app.line}</p>
                <Link href={app.href} className="btn-primary mt-7">
                  See the page
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="AI in the work" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            AI when the product needs it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
            Ruta has AI wired into the real product — answers from the company&apos;s own records,
            with a person in the loop. That kind of work sits inside an app retainer. Separate AI
            consultation is on its own page.
          </p>
          <Link href="/ai-tooling" className="btn-ghost mt-8">
            AI consultation
          </Link>
        </div>
      </section>

      <section aria-label="Contact" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Have something like this <span className="text-accent">in mind?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-body">
            Reach out. We will talk and decide if it is a fit. No pressure.
          </p>
          <Link href={INQUIRE_PATH} className="btn-primary mt-8">
            {INQUIRE_CTA}
          </Link>
        </div>
      </section>
    </div>
  )
}
