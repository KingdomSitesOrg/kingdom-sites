import Image from 'next/image'
import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import shotOverview from '../../../public/tap-to-tick/overview.png'
import shotLog from '../../../public/tap-to-tick/log.png'
import jwlHome from '../../../public/jam-with-latin/home.jpg'
import jwlMap from '../../../public/jam-with-latin/map.jpg'

const TTT_STACK = ['Swift', 'SwiftUI', 'WidgetKit', 'watchOS', 'CloudKit', 'StoreKit', 'Cloudflare Workers', 'Claude API']

const TTT_HIGHLIGHTS = [
  {
    title: 'Two seconds to log a purchase',
    desc: 'A Lock Screen widget, an Apple Watch app, and a Siri phrase all write to the same ledger — so recording a purchase takes about as long as making it.',
  },
  {
    title: 'Your data stays yours',
    desc: 'No servers holding your budget and no account to create. Everything syncs through your own iCloud, including an optional shared budget for two people.',
  },
  {
    title: 'An AI coach on real numbers',
    desc: 'Ask a question in plain English and get an answer built from your own entries, budgets and balances — the specific thing worth changing this month, not generic advice.',
  },
  {
    title: 'Free tier plus a subscription',
    desc: 'Simple is free and complete on its own. Advanced, at $4.99 a month through Apple, adds shared budgets and the AI assistant.',
  },
]

const JWL_STACK = ['React Native', 'Expo', 'Expo Router', 'TypeScript', 'Supabase', 'PostgreSQL', 'EAS']

const JWL_HIGHLIGHTS = [
  {
    title: 'A curriculum, not a word list',
    desc: 'Twelve stops teach declensions, then verbs, then sentences — the order classical teachers use — with camp-outs along the way that review everything so far.',
  },
  {
    title: 'Wrong answers that still teach',
    desc: 'Every wrong option is a real, correctly-declined Latin form rather than nonsense, and macrons are correct throughout. A student who guesses still sees true grammar.',
  },
  {
    title: 'Sign-up a parent will accept',
    desc: 'A username and a six-digit PIN — no email address, no ads, no in-app purchases, no tracking, and account deletion built into the app.',
  },
  {
    title: 'A reason to come back',
    desc: 'XP, ranks, and a global arena leaderboard turn solitary vocabulary drilling into a friendly contest, with progress synced across devices.',
  },
]

const SITE_STACK = ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Vercel']

export default function MyWork() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <p className="eyebrow">My work</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
          Things I&apos;ve designed, built, and <span className="text-accent">shipped.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
          Each of these was scoped, designed, built, and shipped by me — front to back. Some are my own
          products, some were built for clients; most client work stays private unless I&apos;m asked to
          show it.
        </p>
      </section>

      {/* Featured project — Tap to Tick */}
      <section aria-label="Tap to Tick" className="band-dark px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
            <div>
              <p className="eyebrow">iPhone · Apple Watch · Widgets</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tap to Tick
              </h2>
              <p className="mt-2 text-base text-white/80">
                A budgeting app you can actually keep up with.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                Most budgeting apps fail for the same reason: logging a purchase is more work than making
                one. Tap to Tick puts the whole thing on your Lock Screen, your wrist, and your Apple Pay —
                and then explains your own numbers back to you with an AI money coach.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {TTT_STACK.map((t) => (
                  <span key={t} className="text-xs font-medium tracking-wide text-white/45">{t}</span>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/tap-to-tick" className="btn-primary">See the product page</Link>
                <Link href="/tap-to-tick/privacy" className="text-sm text-white/70 underline underline-offset-4 hover:text-white sm:ml-2">
                  Privacy policy
                </Link>
              </div>
            </div>

            {/* Screens */}
            <div className="flex items-end justify-center gap-4 sm:gap-6">
              <div className="w-[42%] max-w-[180px] translate-y-4 overflow-hidden rounded-[26px] border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                <Image src={shotLog} alt="Logging a purchase in Tap to Tick" sizes="180px" className="h-auto w-full" />
              </div>
              <div className="w-[48%] max-w-[210px] overflow-hidden rounded-[30px] border border-white/12 shadow-[0_28px_64px_rgba(0,0,0,0.5)]">
                <Image src={shotOverview} alt="The Tap to Tick overview screen" sizes="210px" className="h-auto w-full" priority />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* What makes it work */}
      <section aria-label="How Tap to Tick works" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {TTT_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="tile p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured project — Jam with Latin */}
      <section aria-label="Jam with Latin" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="tile-elevated grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
            {/* Screens */}
            <div className="flex items-end justify-center gap-4 sm:gap-6 lg:order-2">
              <div className="w-[44%] max-w-[180px] translate-y-4 overflow-hidden rounded-[26px] border border-line shadow-[0_18px_44px_rgba(16,23,37,0.16)]">
                <Image src={jwlMap} alt="The Jam with Latin campaign map of Italy" sizes="180px" className="h-auto w-full" />
              </div>
              <div className="w-[50%] max-w-[210px] overflow-hidden rounded-[30px] border border-line shadow-[0_24px_56px_rgba(16,23,37,0.2)]">
                <Image src={jwlHome} alt="The Jam with Latin home screen" sizes="210px" className="h-auto w-full" />
              </div>
            </div>

            <div className="lg:order-1">
              <p className="eyebrow eyebrow-blue">iPhone &amp; iPad · Client project</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Jam with Latin
              </h2>
              <p className="mt-2 text-base text-ink/80">
                First-year classical Latin as a Roman-legion quest.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-body">
                Built for the Jam with Latin brand: homeschool and classical students march north from
                Rōma to Gaul, learning real vocabulary, verb endings, and sentences at every stop. A
                curriculum wrapped in a game, with a leaderboard that keeps students drilling on their
                own initiative.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {JWL_STACK.map((t) => (
                  <span key={t} className="text-xs font-medium tracking-wide text-muted">{t}</span>
                ))}
              </div>

              <div className="mt-7">
                <Link href="/jam-with-latin" className="btn-primary">See the product page</Link>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {JWL_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="tile p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* This site */}
      <section aria-label="Kingdom Sites" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="tile p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Website</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              kingdom-sites.com
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-body sm:text-base">
              This site. Server-rendered for speed, scored on real visitor performance, deliberately kept
              to static pages with no database behind it. The same setup I build client marketing sites on.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {SITE_STACK.map((t) => (
                <span key={t} className="text-xs font-medium tracking-wide text-muted">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Contact" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Want something like this <span className="text-accent">for your business?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-body">
            Tell me what you have in mind and I&apos;ll scope it and send a quote. Free, fast, no obligation.
          </p>
          <div className="mt-8">
            <a href={CONTACT_MAILTO} className="btn-primary">Email me</a>
          </div>
          <p className="mt-4 text-sm text-body">
            <a href={CONTACT_MAILTO} className="link-accent">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </section>
    </div>
  )
}
