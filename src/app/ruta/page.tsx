import Link from 'next/link'
import { RutaPhoneShot } from '@/components/BuildMocks'
import { INQUIRE_PATH } from '@/lib/contact'

const RUTA_SITE_URL = 'https://getruta.com'

const PARTICIPATED = [
  'Recurring billing and customer payment arrangements',
  'The crew mobile app — visits, the time clock, and use without a signal',
  "Office tools for the day's schedule, messaging, and reviewing finished work",
  'Customer self-service',
  'The shared backend the apps sit on',
  'In-product AI system',
]

export default function Ruta() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="cn-wrap pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="cn-rise cn-rise-3 flex flex-col items-center self-start">
            <div className="cn-phone w-full max-w-[300px]">
              <RutaPhoneShot scene="portal" fill />
            </div>
            <p className="mt-5 max-w-[300px] text-center text-sm leading-relaxed text-muted">
              This is representing the app — just an animation, not the real product.
            </p>
          </div>
          <div className="self-start lg:pt-6">
            <p className="cn-kicker cn-rise">Contract work</p>
            <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5">Ruta.</h1>
            <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
              Ruta is service-management software for landscaping and maintenance businesses. I did
              not build it on my own, but I have been working on it as a contractor on the team.
              Here are a few things I have worked on.
            </p>

            <ul className="mt-8 space-y-2.5">
              {PARTICIPATED.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-body">
                  <span
                    className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-sm leading-relaxed text-muted">
              For the company&apos;s own site, see{' '}
              <a
                href={RUTA_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent"
              >
                getruta.com
              </a>
              {'. Ruta is not a product Kingdom Sites sells.'}
            </p>
            <p className="mt-6 text-sm text-body">
              <Link href="/my-work" className="link-accent">
                My work
              </Link>
              {' · '}
              <Link href={INQUIRE_PATH} className="link-accent">
                Start a conversation
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
