import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../public/Photos/about.jpg'
import MissionPreview from '@/components/MissionPreview'
import LeadMock from '@/components/LeadMock'
import { WebMock, PhoneMock } from '@/components/BuildMocks'
import PricingTiers from '@/components/PricingTiers'
import WorkScenes from '@/components/WorkScenes'
import EvenGrid from '@/components/EvenGrid'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import {
  ENTRY_PRICE_LABEL,
  FIRST_MONTH_FREE_SHORT,
  PILLARS,
  SEO_EXPLAINER,
  SOFTWARE_ANGLE,
  STEPS,
} from '@/lib/partnership'

/* Proof that the person doing this builds serious software, not just brochures. */
const PROOF = [
  {
    name: 'Ruta',
    what: 'Software that runs landscaping and maintenance companies',
    desc: 'Quoting, scheduling, crews in the field, and billing — used daily by a real service business. I know this trade from the inside, not from a marketing course.',
    href: '/ruta',
  },
  {
    name: 'Jam with Latin',
    what: 'A learning app on iPhone, iPad and Android',
    desc: 'Built front to back for a small business owner who had an idea and no technical team. Same relationship, different problem.',
    href: '/latin-game',
  },
]

export const metadata: Metadata = {
  title: 'Kingdom Sites — grow your local business',
  description:
    'Websites, Google listings and local search for pressure washing, window cleaning, cafés, salons and any small business — one monthly fee, first month free, no contract. Custom software too.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* The opening screen: seven trades quietly at work, one lit at a time. */}
      <section
        aria-label="Grow your business"
        className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-14 text-center sm:px-8"
      >
        {/* Simple headline. Location targeting lives in blog and place pages —
            not on the first screen. */}
        <WorkScenes>
          <h1 className="max-w-full text-balance text-[2.4rem] font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[4.25rem]">
            Grow your <span className="text-accent">business</span>
          </h1>
        </WorkScenes>

        <p className="relative z-10 mt-7 max-w-xl text-pretty text-[15px] leading-relaxed text-body sm:text-base">
          {'Websites, Google listings and local search for small businesses — so customers find you when they need what you do.'}
        </p>

        <a
          href="#start"
          className="absolute bottom-8 z-10 flex flex-col items-center gap-1.5 text-[13px] font-medium text-body transition-colors hover:text-ink"
        >
          <span>See how</span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="scroll-nudge">
            <path d="M10 4v11M5 11l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* The other half of the business, straight after the opening screen: most
          visitors want the local work, but anyone here for software should not
          have to hunt for it. */}
      <section
        id="start"
        aria-label="Custom software"
        className="band-dark scroll-mt-14 px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="eyebrow">For teams and founders</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl">
              {'Need custom software '}
              <span className="text-[#f0b48c]">built?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/65 sm:text-base lg:mx-0">
              {'Websites, mobile apps, the internal system your company runs on, and AI built into the product. Scoped, built and supported by one developer. That is the other half of what I do — if it is what brought you here, start there instead.'}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/software" className="btn-primary">
                See what I build
              </Link>
              <Link href="/my-work" className="text-sm font-medium text-white/75 underline underline-offset-4 hover:text-white">
                My work
              </Link>
            </div>

            <p className="mt-5 text-[13px] text-white/45">
              Web · iOS &amp; Android · Internal platforms · AI
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 [--mock-scale:0.64] sm:gap-5 sm:[--mock-scale:0.82] lg:[--mock-scale:0.94]">
            <WebMock />
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="hero-wash px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="eyebrow">For local businesses</p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              You do the work. I make sure <span className="text-accent">the phone rings.</span>
            </h2>
            <p className="mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {'I am Thomas, and I work with owners of local businesses — pressure washers, window cleaners, or any small business customers find by searching. One monthly fee, and I run everything that gets you found and called. Not a website you buy once and never hear about again.'}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/get-started" className="btn-primary">
                See how you look online — free
              </Link>
              <Link href="/local-business#pricing" className="btn-ghost">
                {'Plans from ' + ENTRY_PRICE_LABEL + '/month'}
              </Link>
            </div>

            <p className="mt-6 text-[13.5px] leading-relaxed text-muted">
              {FIRST_MONTH_FREE_SHORT + ' · The build is included · No contract'}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[400px] lg:mx-0">
            <LeadMock />
          </div>
        </div>
      </section>

      {/* The offer */}
      <section id="included" aria-label="What is included" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The partnership</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {'One fee. I handle the whole of it.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/65">
              {'Think of me less as a website company and more as the person on your team who looks after everything on the internet — so you never have to think about it again.'}
            </p>
          </div>

          <EvenGrid surface="home-pillars" maxCols={2} className="mt-12">
            {PILLARS.map((item) => (
              <div key={item.title} className="tile-dark p-7">
                <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/60">{item.desc}</p>
              </div>
            ))}
          </EvenGrid>

          <div className="mt-10 text-center">
            <Link href="/local-business" className="btn-primary">
              See exactly what each plan delivers
            </Link>
          </div>
        </div>
      </section>

      {/* Why the page and post counts matter */}
      <section aria-label="How getting found works" className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">In plain English</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'Why pages and posts are what you are really buying.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              {'Every plan below counts pages and posts, and most people have no idea why that should matter to a pressure washing business. Here is the whole thing, without the jargon.'}
            </p>
          </div>

          <EvenGrid surface="home-seo-explainer" maxCols={2} className="mt-12">
            {SEO_EXPLAINER.map((item) => (
              <div key={item.title} className="tile flex flex-col p-7 sm:p-8">
                <h3 className="text-lg font-semibold tracking-tight text-ink">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{item.desc}</p>
              </div>
            ))}
          </EvenGrid>

          <p className="mt-8 text-center text-sm">
            <Link href="/local-business#how-it-works" className="link-accent">
              The rest of how this works <span aria-hidden="true">›</span>
            </Link>
          </p>
        </div>
      </section>

      {/* The plans */}
      <section id="pricing" aria-label="Plans and pricing" className="scroll-mt-20 border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow eyebrow-blue">What it costs</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'Three plans. Counted work, not vague promises.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              {'Every plan says exactly how many pages, posts and changes you get, so you can hold me to it. The build is free on all three and nothing is owed until your site is live.'}
            </p>
          </div>

          <div className="mt-12">
            <PricingTiers />
          </div>

          <p className="mt-8 text-center text-[13.5px] text-muted">
            {'Ministries, churches and missionaries: the site is free. '}
            <Link href="/mission" className="link-accent">
              Here is why <span aria-hidden="true">›</span>
            </Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section aria-label="How it works" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'Four steps, and only one of them is yours.'}
            </h2>
          </div>

          <EvenGrid surface="home-steps" maxCols={4} className="mt-12">
            {STEPS.map((s) => (
              <div key={s.step} className="tile flex flex-col p-7">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {s.step}
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{s.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      {/* Proof — the person behind it builds real software */}
      <section aria-label="Who you are working with" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          {/* items-start: cards hug content — never stretch to match a tall sibling column. */}
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-blue">Who you are working with</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {'Software and search — the two halves of growing a business online.'}
              </h2>
              <p className="mt-5 text-pretty text-base leading-relaxed text-body">
                {'I am a software engineer who also does the search work, and I sell both as a partnership rather than by the hour. An agency can market you but cannot build you anything. A developer can build you something but has no interest in whether anyone finds it. You need both, from someone whose own income depends on your business getting bigger.'}
              </p>
              <p className="mt-4 text-pretty text-base leading-relaxed text-body">
                {'I have also worked behind the counter at a local bike shop here in Rochester, so I know what running a small business actually looks like — thin margins, long days, and no spare hour to spend working out what Google wants from you.'}
              </p>

              <div className="mt-8 space-y-4">
                {SOFTWARE_ANGLE.map((s) => (
                  <div key={s.title}>
                    <h3 className="text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-body">{s.desc}</p>
                  </div>
                ))}
              </div>

              <Link href="/my-work" className="link-accent mt-7 inline-block text-sm">
                See everything I have built <span aria-hidden="true">›</span>
              </Link>
            </div>

            <div className="grid gap-4 self-start sm:gap-5">
              {PROOF.map((p) => (
                <Link
                  key={p.name}
                  href={p.href}
                  className="tile flex flex-col p-7 transition-colors hover:border-accent"
                >
                  <h3 className="text-lg font-semibold tracking-tight text-ink">{p.name}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-warm">{p.what}</p>
                  <p className="mt-3 text-sm leading-relaxed text-body">{p.desc}</p>
                  <span className="link-accent mt-5 text-sm">
                    Have a look <span aria-hidden="true">›</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
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
            <p className="eyebrow">Built with purpose</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {'Your growing business helps support mission work.'}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              {'Kingdom Sites is more than a business. What you pay each month also supports the long-term mission work my wife Monisha and I are part of — and it is why churches and ministries get their sites from us for free. You get more customers, and it goes further than your own books.'}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <Link href="/about" className="link-accent text-sm">
                About us <span aria-hidden="true">›</span>
              </Link>
              <Link href="/mission" className="link-accent text-sm">
                Our mission <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission — the countries cycle through, drawn one at a time */}
      <MissionPreview />

      {/* Contact */}
      <section id="contact" aria-label="Contact" className="px-5 pb-24 pt-24 sm:px-8">
        <div className="tile-elevated mx-auto max-w-4xl px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {'Let me look at your business, free.'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-body">
            {'Tell me your trade and the towns you cover. I will check how you show up on Google against the businesses beating you, and send you what I find — whether or not you ever hire me.'}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link href="/get-started" className="btn-primary">
              Get my free look
            </Link>
            <a href={CONTACT_MAILTO} className="link-accent text-sm">{CONTACT_EMAIL}</a>
          </div>
        </div>
      </section>
    </div>
  )
}
