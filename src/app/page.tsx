import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../public/Photos/about.jpg'
import { PhoneMock, WebMock } from '@/components/BuildMocks'
import PricingTiers from '@/components/PricingTiers'
import EvenGrid from '@/components/EvenGrid'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import {
  AI_PACKAGE,
  AI_PRICE_LABEL,
  COMPLEXITY_FACTORS,
  FAQS,
  HERO,
  OWNERSHIP_PILLARS,
  PREPAY_LINE,
  NOTICE_LINE,
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
      {/* Section 1 — Hero: product ownership offer */}
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

      {/* Section 2 — AI package */}
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
            <a href={CONTACT_MAILTO} className="text-sm font-medium text-white/75 underline underline-offset-4 hover:text-white">
              Email about the AI package
            </a>
          </div>
        </div>
      </section>

      {/* Section 3 — Services / ownership retainer */}
      <section id="services" aria-label="Product ownership retainers" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">How ownership works</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              One person owns the product with you.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              Not a project that ends at launch. A monthly ownership relationship for the next features, fixes, and releases.
            </p>
          </div>

          <EvenGrid surface="home-pillars" maxCols={2} className="mt-12">
            {OWNERSHIP_PILLARS.map((item) => (
              <div key={item.title} className="tile flex flex-col p-7 sm:p-8">
                <h3 className="text-lg font-semibold tracking-tight text-ink">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{item.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      {/* Complexity tiers */}
      <section id="pricing" aria-label="Complexity tiers and pricing" className="scroll-mt-20 border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">What it costs</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Focused, Full, or Intensive — from complexity, not a menu.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              Typical monthly averages. After a short call I place your product on a band. Month to month is fine; prepay only if you want the discount.
            </p>
          </div>

          <div className="mt-12">
            <PricingTiers />
          </div>
        </div>
      </section>

      {/* Complexity scorecard */}
      <section aria-label="What drives the tier" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">On the call</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              What decides Focused, Full, or Intensive.
            </h2>
          </div>

          <EvenGrid surface="home-complexity" maxCols={3} className="mt-12">
            {COMPLEXITY_FACTORS.map((f) => (
              <div key={f.title} className="tile flex flex-col p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{f.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      {/* FAQs */}
      <section aria-label="Common questions" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">Questions</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Straight answers.
            </h2>
          </div>

          <EvenGrid surface="home-faqs" maxCols={2} className="mt-12">
            {FAQS.map((item) => (
              <div key={item.q} className="tile flex flex-col p-7 sm:p-8">
                <h3 className="text-base font-semibold tracking-tight text-ink">{item.q}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{item.a}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      {/* Mission purpose strip — not a commercial hero */}
      <section aria-label="Purpose" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="tile-elevated mx-auto w-full max-w-xs lg:mx-0">
            <Image
              src={aboutImage}
              alt="Thomas and Monisha"
              quality={75}
              placeholder="blur"
              sizes="(max-width: 1024px) 70vw, 320px"
              className="h-auto w-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Why Kingdom Sites</p>
            <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Commercial work that supports gospel and ministry.
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
              Revenue from product ownership helps fund the long-term mission work my wife Monisha and I are part of. That purpose sits behind the business — it is not the product pitch.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <Link href="/mission" className="link-accent text-sm">
                Our mission <span aria-hidden="true">›</span>
              </Link>
              <Link href="/about" className="link-accent text-sm">
                Team <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proof — portfolio only */}
      <section aria-label="Work shipped" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
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
        </div>
      </section>

      {/* Contact — enquiry form (same stack as production free-look) */}
      <section id="contact" aria-label="Contact" className="px-5 pb-24 pt-8 sm:px-8">
        <div className="tile-elevated mx-auto max-w-4xl px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Tell me what you are building.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-body">
            Product owners and founders with a real pipeline — send an enquiry and I will reply about
            complexity, fit, and whether ownership with me makes sense. {PREPAY_LINE} {NOTICE_LINE}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <a href={CONTACT_MAILTO} className="link-accent text-sm">
              Or email {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
