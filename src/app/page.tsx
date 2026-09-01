import Link from 'next/link'
import type { Metadata } from 'next'
import { PhoneMock, PhoneShotCluster, WebMock } from '@/components/BuildMocks'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { AI_CONSULT, APP_OFFER, HOME_APP_PHONES, HERO } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Kingdom Sites — mobile application solutions',
  description:
    'I design, build, ship, and maintain mobile apps — and the software behind them. Have an idea? Start a conversation. Monthly retainer, quoted after we talk. No pressure.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* 1 — Hero: the app offer. No CTA. */}
      <section aria-label="Mobile apps" className="hero-wash px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="text-balance text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem] xl:text-[3.85rem]">
              {HERO.title}
              <span className="mt-3 block text-[0.72em] font-medium leading-snug text-accent sm:mt-4">
                {HERO.accent}
              </span>
            </h1>
            <p className="mt-7 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {HERO.sub}
            </p>
          </div>

          <div className="flex items-center justify-center [--mock-scale:0.48] sm:[--mock-scale:0.72] lg:[--mock-scale:0.94]">
            <div className="band-dark rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-center gap-2 sm:gap-5">
                <WebMock />
                <PhoneMock />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Apps I build + shots + My Work + inquire */}
      <section aria-label="Apps I build" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              {APP_OFFER.title}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {APP_OFFER.sub}
            </p>
          </div>

          {/* Three CSS phone drawings — not product screenshots. */}
          <div className="mx-auto mt-14 max-w-lg sm:max-w-xl">
            <PhoneShotCluster items={[...HOME_APP_PHONES]} />
          </div>
          <p className="mt-8 text-center text-sm font-medium text-ink">
            {HOME_APP_PHONES.map((app, i) => (
              <span key={app.name}>
                {i > 0 && <span className="mx-2 text-muted">·</span>}
                <Link href={app.href} className="hover:text-accent">
                  {app.name}
                </Link>
              </span>
            ))}
          </p>

          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/my-work" className="btn-primary">
              My work
            </Link>
            <Link href={INQUIRE_PATH} className="btn-ghost">
              {INQUIRE_CTA}
            </Link>
          </div>
        </div>
      </section>

      {/* 3 — AI consultation (no dollar amount here) */}
      <section aria-label="AI consultation" className="band-dark px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {AI_CONSULT.homeTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
            {AI_CONSULT.homeSub}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/ai-tooling" className="btn-primary">
              AI consultation
            </Link>
            <Link
              href={INQUIRE_PATH}
              className="text-sm font-medium text-white/75 underline underline-offset-4 hover:text-white"
            >
              {INQUIRE_CTA}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
