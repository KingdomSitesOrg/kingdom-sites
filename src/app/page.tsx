import Link from 'next/link'
import type { Metadata } from 'next'
import { PhoneMock, WebMock } from '@/components/BuildMocks'
import PricingTiers from '@/components/PricingTiers'
import EvenGrid from '@/components/EvenGrid'
import { CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import {
  AI_PACKAGE,
  AI_PRICE_LABEL,
  HERO,
} from '@/lib/partnership'

/* Portfolio proof only — not the commercial offer. */
const PROOF = [
  {
    name: 'Ruta',
    what: 'Service-management platform · web and mobile',
    desc: 'Quoting, scheduling, crews in the field, billing, and AI in a real product used daily by a service business.',
    href: '/ruta',
  },
  {
    name: 'Jam with Latin',
    what: 'Mobile learning product on a retainer',
    desc: 'iPhone, iPad and Android — built end-to-end for a small business owner with a long feature pipeline and no technical team.',
    href: '/latin-game',
  },
  {
    name: 'Tap to Tick',
    what: 'Personal iOS expense app',
    desc: 'A focused mobile product shipped and maintained — proof of clean product ownership at a smaller surface.',
    href: '/tap-to-tick',
  },
]

export const metadata: Metadata = {
  title: 'Kingdom Sites — product ownership for custom software',
  description:
    'Product ownership retainers for custom products — mobile-led software for product owners and founders. Focused, Full, or Intensive from complexity. Month to month; optional AI package.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* 1 — Hero */}
      <section
        aria-label="Product ownership"
        className="hero-wash px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="eyebrow">{HERO.eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              {HERO.titleLead} <span className="text-accent">{HERO.titleAccent}</span>
            </h1>
            <p className="mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {HERO.sub}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href={HERO.ctaPrimaryHref} className="btn-primary">
                {HERO.ctaPrimary}
              </Link>
              <a href={HERO.ctaSecondaryHref} className="btn-ghost">
                {HERO.ctaSecondary}
              </a>
            </div>

            <p className="mt-6 text-[13.5px] leading-relaxed text-muted">{HERO.priceHint}</p>
          </div>

          <div className="flex items-center justify-center gap-2 [--mock-scale:0.64] sm:gap-5 sm:[--mock-scale:0.82] lg:[--mock-scale:0.94]">
            <div className="band-dark rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-center gap-2 sm:gap-5">
                <WebMock />
                <PhoneMock />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — AI */}
      <section aria-label="AI package" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{AI_PACKAGE.tagline}</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {AI_PACKAGE.name}
              <span className="text-[#f0b48c]"> — {AI_PRICE_LABEL}/month</span>
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/65">
              {AI_PACKAGE.promise}
            </p>
          </div>

          <EvenGrid surface="home-ai" maxCols={2} className="mt-12">
            <div className="tile-dark p-7 sm:p-8">
              <h3 className="text-base font-semibold tracking-tight text-white">Free one-time consult</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/60">{AI_PACKAGE.freeConsult}</p>
            </div>
            <div className="tile-dark p-7 sm:p-8">
              <h3 className="text-base font-semibold tracking-tight text-white">What the package covers</h3>
              <ul className="mt-3 space-y-2.5">
                {AI_PACKAGE.features.map((f) => (
                  <li key={f} className="text-sm leading-relaxed text-white/60">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </EvenGrid>

          <p className="mx-auto mt-8 max-w-2xl text-center text-[13.5px] leading-relaxed text-white/45">
            <span className="text-[#f0b48c]">*</span> {AI_PACKAGE.apiNote}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/ai-tooling" className="btn-primary">
              How AI tooling works
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

      {/* 3 — Pricing */}
      <section
        id="pricing"
        aria-label="Complexity tiers and pricing"
        className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">Pricing</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Focused, Full, or Intensive — from complexity, not a menu.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              Product ownership retainers. Typical monthly averages — after a short call I place
              your product on a band. Month to month is fine; prepay only if you want the discount.
            </p>
          </div>

          <div className="mt-12">
            <PricingTiers />
          </div>
        </div>
      </section>

      {/* 4 — Proof */}
      <section aria-label="Work shipped" className="border-t border-line px-5 py-20 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">Proof</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Products people already use.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              Mobile-led custom software with real backend and product depth — not brochure demos.
            </p>
          </div>

          <EvenGrid surface="home-proof" maxCols={3} className="mt-12">
            {PROOF.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="tile flex flex-col p-7 transition-colors hover:border-accent sm:p-8"
              >
                <h3 className="text-lg font-semibold tracking-tight text-ink">{p.name}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-warm">{p.what}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-body">{p.desc}</p>
                <span className="link-accent mt-5 text-sm">
                  Have a look <span aria-hidden="true">›</span>
                </span>
              </Link>
            ))}
          </EvenGrid>

          <div className="mt-14 text-center">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <p className="mt-4 text-sm text-muted">
              <Link href="/my-work" className="link-accent">
                Full proof portfolio
              </Link>
              {' · '}
              <a href={CONTACT_MAILTO} className="link-accent">
                Or email
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
