import Link from 'next/link'
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
      <section className="hero-wash px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow eyebrow-blue">Contract work</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Ruta.
          </h1>
          <p className="mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
            Ruta is service-management software for landscaping and maintenance businesses. I did
            not build it on my own, but I have been working on it as a contractor on the team. Here
            are a few things I have worked on.
          </p>

          <ul className="mt-8 space-y-2.5">
            {PARTICIPATED.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-body">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm leading-relaxed text-muted">
            For the company&apos;s own site, see{' '}
            <a href={RUTA_SITE_URL} target="_blank" rel="noopener noreferrer" className="link-accent">getruta.com</a>{'. Ruta is not a product Kingdom Sites sells.'}
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
      </section>
    </div>
  )
}
