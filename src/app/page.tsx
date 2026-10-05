import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RutaPhoneShot } from '@/components/BuildMocks'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { AI_CONSULT, APP_OFFER, HOME_CLUSTER, HERO } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Kingdom Sites — mobile application solutions',
  description:
    'I design, build, ship, and maintain mobile apps — and the software behind them. Have an idea? Start a conversation. Monthly retainer, quoted after we talk. No pressure.',
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
              <Link href={INQUIRE_PATH} className="btn-primary">
                {INQUIRE_CTA}
              </Link>
              <Link href={HERO.appHref} className="btn-ghost">
                {HERO.appCta}
              </Link>
            </div>
          </div>

          {/* Real screens from the shipped app, in the same dark frame the hero has always had. */}
          <div className="flex items-center justify-center">
            <div className="band-dark w-full max-w-[520px] rounded-[28px] px-5 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10">
              <Link
                href={HERO.appHref}
                aria-label={HERO.appCta}
                className="mx-auto flex max-w-[440px] items-end justify-center"
              >
                {HERO.shots.map((shot, i) => {
                  const middle = i === 1
                  return (
                    <span
                      key={shot.src}
                      className={`relative block overflow-hidden rounded-[22px] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
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
