import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RutaPhoneCluster } from '@/components/BuildMocks'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { APP_PROOF } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'My portfolio',
  description:
    'Apps and software Thomas Klein has designed, built, and shipped: Ruta, Tap to Tick, a Latin learning game for iPhone and Android, and more.',
  alternates: { canonical: '/my-work' },
}

export default function MyWork() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="cn-wrap pb-16 pt-16 sm:pb-24 sm:pt-24">
        <p className="cn-kicker cn-rise">All work</p>
        <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5">My portfolio.</h1>
        <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
          Mobile apps — and the software that makes them real. Built, shipped, and still looked
          after.
        </p>
      </section>

      <section aria-label="Apps" className="cn-wrap py-16 sm:py-24">
        <div className="grid gap-20 sm:gap-28">
          {APP_PROOF.map((app) => (
            <div key={app.name} className="grid items-start gap-12 border-t border-line pt-12 lg:grid-cols-2 lg:gap-14">
              {'phones' in app && app.phones.length > 0 ? (
                <RutaPhoneCluster />
              ) : app.shots.length > 0 ? (
                <div className="flex items-end justify-center self-start pb-4">
                  {app.shots.map((shot, i) => (
                    <div
                      key={shot.src}
                      className={`cn-phone ${
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
                <h2 className="cn-display cn-h3">{app.name}</h2>
                <p className="cn-body mt-4 max-w-[44ch]">{app.line}</p>
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

      <section aria-label="AI in the work" className="cn-wrap py-16 sm:py-20">
        <div className="grid gap-6 border-t border-line pt-12 lg:grid-cols-[1.4fr_1fr] lg:items-baseline">
          <h2 className="cn-display cn-h3 text-balance">AI when the product needs it.</h2>
          <div>
          <p className="cn-body text-pretty">
            Some of the contract work includes AI inside a live product — answers from a
            company&apos;s own records, with a person in the loop. If you want to learn to use AI
            yourself, that is its own thing.
          </p>
          <Link href="/ai-tooling" className="btn-ghost mt-8">
            AI consultation
          </Link>
          </div>
        </div>
      </section>

      <section aria-label="Contact" className="cn-wrap pb-28 pt-24 text-center sm:pb-36 sm:pt-32">
        <div>
          <h2 className="cn-display cn-h2 mx-auto max-w-[14ch] text-balance">
            Have something like this <span className="text-accent">in mind?</span>
          </h2>
          <p className="cn-body mx-auto mt-6 max-w-[40ch] text-pretty">
            Tell me about it. We will talk it through, and you get a quote once I understand the
            project. No pressure.
          </p>
          <Link href={INQUIRE_PATH} className="btn-primary mt-10">
            {INQUIRE_CTA}
          </Link>
        </div>
      </section>
    </div>
  )
}
