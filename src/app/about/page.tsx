import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../../public/Photos/about.jpg'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PERSON_LD, jsonLd, shareCard } from '@/lib/seo'

const DESCRIPTION =
  'Meet Thomas Klein of Kingdom Sites: websites, iPhone and Android apps, the software behind them, and AI consultation, designed, built and looked after by Thomas Klein, one engineer.'

export const metadata: Metadata = {
  title: 'About Thomas Klein',
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  ...shareCard('About Thomas Klein — Kingdom Sites', DESCRIPTION, '/about'),
}

export default function About() {
  return (
    <div className="cn-wrap pb-16 pt-16 sm:pb-24 sm:pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(PERSON_LD) }} />
      <div className="max-w-3xl">
        <p className="cn-kicker cn-rise">The studio</p>
        <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
          About <span className="text-accent">Kingdom Sites.</span>
        </h1>
        <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
          I design, build, ship and maintain everything myself, on purpose, so you always know who you are
          talking to.
        </p>
      </div>

      {/* Thomas — full bio, same voice as before */}
      <section
        aria-label="Thomas Klein"
        className="mt-16 grid items-start gap-10 sm:mt-24 lg:grid-cols-12 lg:gap-16"
      >
        <div className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-md">
            <div className="tile-elevated">
              <Image
                src={aboutImage}
                alt="Thomas and Monisha"
                quality={75}
                placeholder="blur"
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="cn-kicker">Engineering: design, build, ship, maintain</p>
          <h2 className="cn-display cn-h3 mt-3">
            Thomas Klein
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
            My name is Thomas Klein. I am first and foremost a problem solver and an engineer. I want to
            help you accomplish your goals, and I do this with a purpose to glorify God.
          </p>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
            I make software people actually use: websites, apps and the systems behind them. I also help
            you use AI to bring in more revenue, save time and grow your business. When you write to me,
            you get me, the person who builds it.
          </p>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
            My wife Monisha and I are currently working from abroad. Kingdom Sites is based in Rochester,
            Minnesota, and client work carries on as always, on the same timelines.
          </p>
          <div className="mt-8 grid gap-4">
            <div className="tile p-6">
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                I build it and I maintain it
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                I build and maintain the app, so don&rsquo;t worry about maintenance.{' '}
                <Link href={INQUIRE_PATH} className="link-accent">
                  {INQUIRE_CTA} <span aria-hidden="true">›</span>
                </Link>
              </p>
            </div>

            <div className="tile p-6">
              <h3 className="text-sm font-semibold tracking-tight text-ink">Portfolio</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Farzana Classroom, education software I built from the ground up; JAM Legio, a Latin learning game
                for iPhone and Android; Tap to Tick, my own iPhone expense app; and contract work on
                Ruta.{' '}
                <Link href="/portfolio" className="link-accent">
                  Portfolio <span aria-hidden="true">›</span>
                </Link>
              </p>
            </div>

            <div className="tile p-6">
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                Free websites for ministries
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Ministries, missionaries raising support, and churches get their website built for free
                <span className="align-super text-[0.6em] text-accent">*</span>, with the same care as
                every client. It is one of the ways I put this business toward the gospel.{' '}
                <Link href="/mission" className="link-accent">
                  My mission <span aria-hidden="true">›</span>
                </Link>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                <span className="align-super text-[0.75em] text-accent">*</span> My time is the
                donation. The domain name and hosting stay in your name.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-20 border-t border-line pt-12">
        <Link href={INQUIRE_PATH} className="btn-primary">
          {INQUIRE_CTA}
        </Link>
        <p className="mt-4 text-sm text-body">
          Every enquiry comes to me, and I reply personally.
        </p>
        <p className="mt-3 text-sm text-muted">
          <Link href="/portfolio" className="underline underline-offset-4">
            Portfolio
          </Link>
          {' · '}
          <Link href="/ai-tooling" className="underline underline-offset-4">
            AI consultation
          </Link>
          {' · '}
          <Link href="/guides" className="underline underline-offset-4">
            Guides
          </Link>
        </p>
      </div>
    </div>
  )
}
