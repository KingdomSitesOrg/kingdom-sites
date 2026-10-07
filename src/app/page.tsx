import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RutaPhoneShot } from '@/components/BuildMocks'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { AI_CONSULT, APP_OFFER, HOME_CLUSTER, HERO, PROCESS } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Kingdom Sites — mobile application solutions',
  description:
    'I design, build, ship, and maintain mobile apps — and the software behind them. Have an idea? Start a conversation. No pressure.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* 1 — Hero: the Jam with Latin launch, then an invitation to build yours. */}
      <section aria-label="Jam with Latin is out now" className="hero-wash px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="eyebrow eyebrow-blue">{HERO.eyebrow}</p>
            <h1 className="mt-4 text-balance text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem] xl:text-[3.85rem]">
              {HERO.title}
              <span className="mt-3 block text-[0.72em] font-medium leading-snug text-accent sm:mt-4">
                {HERO.accent}
              </span>
            </h1>
            <p className="mt-7 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {HERO.sub}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href={INQUIRE_PATH} className="btn-primary w-full max-w-[280px] sm:w-auto">
                {INQUIRE_CTA}
              </Link>
              <Link href={HERO.appHref} className="btn-ghost w-full max-w-[280px] sm:w-auto">
                {HERO.appCta}
              </Link>
            </div>
          </div>

          {/* Real screens from the shipped app, straight on the page. */}
          <div className="flex items-center justify-center pb-6">
            <Link
              href={HERO.appHref}
              aria-label={HERO.appCta}
              className="mx-auto flex w-full max-w-[480px] items-end justify-center"
            >
              {HERO.shots.map((shot, i) => {
                const middle = i === 1
                return (
                  <span
                    key={shot.src}
                    className={`relative block overflow-hidden rounded-[26px] shadow-[0_16px_40px_rgba(16,23,37,0.16)] ${
                      middle
                        ? 'z-10 w-[40%]'
                        : `w-[31%] translate-y-5 ${i === 0 ? '-mr-4 sm:-mr-5' : '-ml-4 sm:-ml-5'}`
                    }`}
                  >
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={360}
                      height={780}
                      priority={middle}
                      sizes="(min-width: 1024px) 200px, 40vw"
                      className="h-auto w-full"
                    />
                  </span>
                )
              })}
            </Link>
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

          {/* Tap to Tick and Latin are photos. Ruta is a CSS drawing — not a screenshot. */}
          <div className="mx-auto mt-14 flex max-w-lg items-end justify-center pb-6 sm:max-w-xl">
            {HOME_CLUSTER.map((app, i) => {
              const middle = i === 1
              return (
                <Link
                  key={app.href}
                  href={app.href}
                  aria-label={app.name}
                  className={`relative block overflow-hidden rounded-[26px] shadow-[0_16px_40px_rgba(16,23,37,0.16)] ${
                    middle
                      ? 'z-10 w-[42%] max-w-[200px]'
                      : `w-[30%] max-w-[148px] translate-y-5 ${i === 0 ? '-mr-4 sm:-mr-6' : '-ml-4 sm:-ml-6'}`
                  }`}
                >
                  {'shot' in app ? (
                    <Image
                      src={app.shot.src}
                      alt={app.shot.alt}
                      width={360}
                      height={780}
                      className="h-auto w-full"
                    />
                  ) : (
                    <RutaPhoneShot scene="portal" fill />
                  )}
                </Link>
              )
            })}
          </div>
          <p className="mt-8 text-center text-sm font-medium text-ink">
            {HOME_CLUSTER.map((app, i) => (
              <span key={app.name}>
                {i > 0 && <span className="mx-2 text-muted">·</span>}
                <Link href={app.href} className="hover:text-accent">
                  {app.name}
                </Link>
              </span>
            ))}
          </p>

          <div className="mt-12 flex justify-center">
            <Link href="/my-work" className="btn-ghost">
              See all my work <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 — How working together starts. No prices: a quote comes after the conversation. */}
      <section aria-label="How it starts" className="border-t border-line px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              {PROCESS.title}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {PROCESS.sub}
            </p>
          </div>

          <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
            {PROCESS.steps.map((step, i) => (
              <li key={step.title} className="tile flex gap-4 p-6 sm:p-7 md:block">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-ink md:mt-5">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex justify-center sm:mt-14">
            <Link href={INQUIRE_PATH} className="btn-primary w-full max-w-[280px] sm:w-auto">
              {INQUIRE_CTA}
            </Link>
          </div>
        </div>
      </section>

      {/* 4 — AI consultation (no dollar amount here) */}
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
