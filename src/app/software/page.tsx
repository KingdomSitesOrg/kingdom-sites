import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../../public/Photos/about.jpg'
import ToolTicker from '@/components/ToolTicker'
import MissionPreview from '@/components/MissionPreview'
import EvenGrid from '@/components/EvenGrid'
import { WebMock, PhoneMock } from '@/components/BuildMocks'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import {
  AI_PACKAGE,
  AI_PRICE_LABEL,
  ENTRY_PRICE_LABEL,
  INTENSIVE_DESIGN_NOTE,
  NOTICE_LINE,
  OWNERSHIP_PILLARS,
  PREPAY_LINE,
  PRICING_ASTERISK,
  TIERS,
} from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Product ownership for custom products',
  description:
    'Month-to-month product ownership retainers for custom apps, systems, and AI — for product owners and business founders. One engineer who owns the product after launch, not a project that ends.',
  alternates: { canonical: '/software' },
}

const STACK = ['Next.js', 'React', 'TypeScript', 'React Native', 'Swift', 'Node.js', 'PostgreSQL', 'AWS', 'Vercel']

const PROOF = [
  {
    name: 'Ruta',
    what: 'Service-management platform — web, mobile, AI',
    href: '/ruta',
  },
  {
    name: 'Jam with Latin',
    what: 'Mobile learning product on a retainer',
    href: '/latin-game',
  },
  {
    name: 'Tap to Tick',
    what: 'Personal iOS expense app on the App Store',
    href: '/tap-to-tick',
  },
]

export default function Software() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="hero-wash px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-6xl">
            Custom products <span className="text-accent">owned with you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            For product owners and business founders with a long list of features and growth ahead —
            mobile-led software people actually use, with one person who owns the product after
            launch, not a project that ends.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <Link href="/pricing" className="btn-ghost">
              See pricing and how ownership works
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">
            Ownership from {ENTRY_PRICE_LABEL}/month · AI from {AI_PRICE_LABEL}/month
          </p>
        </div>

        <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {STACK.map((t) => (
            <span key={t} className="text-xs font-medium tracking-wide text-muted">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* What ownership means */}
      <section aria-label="What ownership means" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A product partner, not a handoff.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
              Apps, systems, and AI when that is the job — owned end-to-end: roadmap, build, ship,
              fix, and ongoing care. You talk to the person who builds it.
            </p>
          </div>

          <EvenGrid surface="software-pillars" maxCols={2} className="mt-12">
            {OWNERSHIP_PILLARS.map((p) => (
              <div key={p.title} className="tile p-7 sm:p-8">
                <h3 className="text-base font-semibold tracking-tight text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{p.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      {/* Builds + mockups */}
      <section id="services" aria-label="What I build" className="band-dark overflow-hidden px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <div className="hidden justify-end lg:flex">
            <WebMock className="[--mock-scale:0.82]" />
          </div>

          <div className="min-w-0 text-center">
            <h2 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Custom products people use — with the backend and tooling they need.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
              Proof is mobile-led. The work includes what makes products real: backend, web console,
              data, and AI when that is part of the product.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/my-work"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
              >
                Proof portfolio <span aria-hidden="true" className="ml-1.5 text-white/60">›</span>
              </Link>
              <Link
                href="/ai-tooling"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
              >
                AI package <span aria-hidden="true" className="ml-1.5 text-white/60">›</span>
              </Link>
            </div>
          </div>

          <div className="hidden justify-start lg:flex">
            <PhoneMock className="[--mock-scale:0.82]" />
          </div>

          <div className="flex min-w-0 flex-col items-center gap-8 [--mock-scale:0.78] lg:hidden">
            <WebMock />
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* Complexity tiers summary */}
      <section aria-label="Ownership tiers" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Focused, Full, or Intensive — after a call.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
              Typical monthly averages. I place your product on a band from complexity — roles,
              data, integrations, velocity, AI, surfaces — not a self-serve menu.
            </p>
          </div>

          <EvenGrid surface="software-tiers" maxCols={3} className="mt-12">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`tile flex flex-col p-7 sm:p-8 ${
                  tier.featured ? 'border-2 border-accent' : ''
                }`}
              >
                {tier.featured && (
                  <span className="mb-3 self-start rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                    Common starting band
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">
                  {tier.tagline}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{tier.name}</h3>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                  ~${tier.priceAround.toLocaleString()}
                  <span className="text-base font-medium text-muted">/month</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-body">{tier.promise}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{tier.bestFor}</p>
              </div>
            ))}
          </EvenGrid>

          <p className="mt-8 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            {PREPAY_LINE} {NOTICE_LINE}
          </p>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            {PRICING_ASTERISK}
          </p>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            {INTENSIVE_DESIGN_NOTE}
          </p>
          <div className="mt-8">
            <Link href="/pricing" className="btn-primary">
              Full pricing on the home page
            </Link>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section aria-label="Shipped proof" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Work that shows how I own a product.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
              These are shipped examples — the kind of depth you hire for under a product ownership
              retainer. They are not Kingdom Sites products you buy off the shelf.
            </p>
          </div>

          <EvenGrid surface="software-proof" maxCols={3} className="mt-12">
            {PROOF.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="tile flex flex-col p-7 transition-colors hover:border-accent"
              >
                <h3 className="text-lg font-semibold tracking-tight text-ink">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{p.what}</p>
                <span className="link-accent mt-5 text-sm">
                  See the product page <span aria-hidden="true">›</span>
                </span>
              </Link>
            ))}
          </EvenGrid>

          <div className="mt-8">
            <Link href="/my-work" className="link-accent text-sm">
              Full proof portfolio <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* AI package callout */}
      <section aria-label="AI package" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="tile-elevated mx-auto flex max-w-5xl flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-2xl">
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {AI_PACKAGE.name}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">{AI_PACKAGE.promise}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {AI_PACKAGE.freeConsult} {AI_PACKAGE.apiNote}
            </p>
          </div>
          <Link href="/ai-tooling" className="btn-primary shrink-0">
            AI tooling details
          </Link>
        </div>
      </section>

      {/* My tools */}
      <section aria-label="My tools" className="overflow-hidden border-t border-line py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              The kit I build with.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
              Languages and platforms, the cloud services behind them, and the AI work that goes into
              real products — not demos.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <ToolTicker />
        </div>
      </section>

      {/* Purpose */}
      <section aria-label="Built with purpose" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="tile-elevated mx-auto w-full max-w-sm lg:mx-0">
            <Image
              src={aboutImage}
              alt="Thomas and Monisha"
              quality={75}
              placeholder="blur"
              sizes="(max-width: 1024px) 90vw, 420px"
              className="h-auto w-full object-cover"
            />
          </div>

          <div>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Your product becomes part of a bigger story.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              Kingdom Sites is more than a business. Client work also supports the long-term mission
              work my wife Monisha and I are part of. You get serious product ownership — and it goes
              further than your next release.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <Link href="/about" className="link-accent text-sm">
                Team <span aria-hidden="true">›</span>
              </Link>
              <Link href="/mission" className="link-accent text-sm">
                Our mission <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MissionPreview />

      {/* Contact */}
      <section id="contact" aria-label="Contact" className="px-5 pb-24 pt-24 sm:px-8">
        <div className="tile-elevated mx-auto max-w-4xl px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Tell me about product ownership.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-body">
            Tell me what you are building, who uses it, and how much product work is ahead. Honest
            either way about whether I am the right owner for it.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <Link href="/pricing" className="text-sm text-muted underline underline-offset-4">
              Or see ownership pricing first
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
