import Link from 'next/link'
import type { Metadata } from 'next'
import { PhoneMock, WebMock } from '@/components/BuildMocks'
import EvenGrid from '@/components/EvenGrid'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
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
  title: 'Kingdom Sites — custom products that advance your ideas and business',
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
            <h1 className="max-w-[18ch] text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink sm:max-w-none sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]">
              {HERO.title}
            </h1>
            <p className="mt-7 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {HERO.sub}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href={HERO.ctaPrimaryHref} className="btn-primary">
                {HERO.ctaPrimary}
              </Link>
              <Link href={HERO.ctaSecondaryHref} className="btn-ghost">
                {HERO.ctaSecondary}
              </Link>
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

      {/* 2 — Add-ons: AI + SEO side by side */}
      <section aria-label="Add-ons" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Optional add-ons
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/65">
              Layer these on product ownership — or start with one when it is what you need first.
            </p>
          </div>

          <EvenGrid surface="home-addons" maxCols={2} className="mt-12">
            <div className="tile-dark flex flex-col p-7 sm:p-8">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                {AI_PACKAGE.name}
                <span className="text-[#f0b48c]"> — {AI_PRICE_LABEL}/month</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{AI_PACKAGE.promise}</p>
              <ul className="mt-6 flex-1 space-y-3">
                <li className="flex gap-3 text-sm leading-relaxed text-white/70">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b48c]" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-white">Free one-time consult</span>
                    {' — '}
                    {AI_PACKAGE.freeConsult}
                  </span>
                </li>
                {AI_PACKAGE.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-relaxed text-white/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[12.5px] leading-relaxed text-white/40">
                <span className="text-[#f0b48c]">*</span> {AI_PACKAGE.apiNote}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
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

            <Link
              href="/seo"
              className="tile-dark flex flex-col p-7 transition-colors hover:border-white/25 sm:p-8"
            >
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Websites &amp; local SEO
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                A clean site, a proper Google listing, and local search work so customers find you
                when they need what you do.
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {[
                  'Website built for calls and enquiries',
                  'Google Business Profile set up and kept right',
                  'Local search pages and posts that compound',
                  'Scoped after a short conversation',
                ].map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-relaxed text-white/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-6 text-sm font-medium text-[#f0b48c]">
                See websites &amp; SEO <span aria-hidden="true">›</span>
              </span>
            </Link>
          </EvenGrid>
        </div>
      </section>

      {/* 3 — Proof */}
      <section aria-label="Work shipped" className="border-t border-line px-5 py-20 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
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

          <div className="mt-14 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <Link href="/pricing" className="btn-ghost">
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            <Link href="/my-work" className="link-accent">
              Full proof portfolio
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
