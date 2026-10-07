import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RutaPhoneCluster } from '@/components/BuildMocks'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { APP_PROOF } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'My portfolio',
  description:
    'Apps and software Thomas Klein has designed, built, and shipped — Jam with Latin, Ruta, Tap to Tick, and more.',
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
          Mobile apps — and the software that makes them real. Built, shipped, and still looked
          after.
        </p>
      </section>

      <section aria-label="Apps" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-16 sm:gap-20">
          {APP_PROOF.map((app) => (
            <div key={app.name} className="grid items-start gap-12 lg:grid-cols-2 lg:gap-14">
              {'phones' in app && app.phones.length > 0 ? (
                <RutaPhoneCluster />
              ) : app.shots.length > 0 ? (
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
              ) : null}
              <div className="self-start lg:pt-6">
                <h2 className="text-3xl font-semibold tracking-tight text-ink">{app.name}</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-body">{app.line}</p>
                {/* Site pages open in place; external links open in a new tab. */}
                <Link
                  href={app.href}
                  className="btn-ghost mt-6"
                  {...(app.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {app.href.startsWith('http') ? 'Visit the site' : 'See the project'}{' '}
                  <span aria-hidden="true">{app.href.startsWith('http') ? '↗' : '→'}</span>
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
            Some of the contract work includes AI inside a live product — answers from a
            company&apos;s own records, with a person in the loop. If you want to learn to use AI
            yourself, that is its own thing.
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
            Tell me about it. We will talk it through, and you get a quote once I understand the
            project. No pressure.
          </p>
          <Link href={INQUIRE_PATH} className="btn-primary mt-8">
            {INQUIRE_CTA}
          </Link>
        </div>
      </section>
    </div>
  )
}
