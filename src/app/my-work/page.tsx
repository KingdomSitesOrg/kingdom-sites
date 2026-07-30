import Image from 'next/image'
import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import shotOverview from '../../../public/tap-to-tick/overview.png'
import shotLog from '../../../public/tap-to-tick/log.png'
import jwlHome from '../../../public/jam-with-latin/home.jpg'
import jwlMap from '../../../public/jam-with-latin/map.jpg'
import rutaQueue from '../../../public/ruta/crew-queue.jpg'
import rutaVisit from '../../../public/ruta/crew-visit.jpg'

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
    desc: 'A username and a six-digit PIN — no email address, no ads, no tracking, and account deletion built into the app.',
  },
  {
    title: 'A reason to come back',
    desc: 'XP, ranks, and a global arena leaderboard turn solitary vocabulary drilling into a friendly contest, with progress synced across devices.',
  },
]

const RUTA_STACK = ['TypeScript', 'React', 'React Native', 'Expo', 'AWS', 'Infrastructure as code']

const RUTA_HIGHLIGHTS = [
  {
    title: 'Four apps over one backend',
    desc: 'An office web app, a field crew app on iPhone and Android, a self-service customer portal, and an internal admin console — all working off the same shared data.',
  },
  {
    title: 'Money that moves on its own',
    desc: 'Billing is the area I spend most care on: charges that run on schedule without anyone chasing them, and an owner who can see what the book of business is worth.',
  },
  {
    title: 'Built for a truck with no signal',
    desc: 'Crews work in places with no coverage, so the field app has to feel no different offline than online and sync the moment signal returns. Making that true is a large part of my work on it.',
  },
  {
    title: 'An integral part of a team product',
    desc: 'Ruta is built by a team, and I have been an integral part of it — shipping across all four apps and the backend they share. It is the best example of what I do inside a live product with other engineers around it.',
  },
]

/* AI work, across both products. Kept together because clients ask about it as
   its own thing rather than as a feature of one app. */
const AI_SHIPPED = [
  {
    product: 'Ruta AI',
    where: 'Service-management platform · web, backend, crew app',
    points: [
      'Answers built from the company’s own records, found by natural phrasing rather than exact keywords',
      'It acts as well as answers, and can take a user straight to the right place in the app',
      'Draft replies from a customer’s real history, which a person edits or regenerates before sending',
      'Available everywhere people already work — the office app and the app in the field',
    ],
  },
  {
    product: 'The Tap to Tick money coach',
    where: 'iPhone budgeting app · my own product',
    points: [
      'Ask a question in plain English, get an answer from your own entries, budgets and balances',
      'The app decides which of your numbers bear on the question and sends only those',
      'Replies lead with the one thing worth changing, not a page of generic advice',
      'No account and no copy of your budget on a server — the question is the only thing that leaves',
    ],
  },
]

const AI_OFFER = [
  {
    title: 'Grounded in your data',
    desc: 'Answers from your own records rather than the open internet. That is a retrieval problem before it is a model problem, and it is where most of the work goes.',
  },
  {
    title: 'Actions with a person in the loop',
    desc: 'Draft, send, approve, schedule — the model proposes and someone confirms. Nothing irreversible happens on its own.',
  },
  {
    title: 'Costs and failures handled',
    desc: 'A model chosen per task instead of the priciest one everywhere, timeouts, and errors your staff can actually act on.',
  },
  {
    title: 'AI in the workflow too',
    desc: 'Not only in the product: production errors explained into Slack, plain-language summaries on every code change, and internal tooling that saves your team time.',
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
          Some of these I scoped, designed, built, and shipped front to back — my own products and
          client projects. One, Ruta, is a live platform I helped build with a team.
        </p>
      </section>

      {/* Featured project — Ruta */}
      <section aria-label="Ruta" className="bg-[#0a1f0a] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400/80">
                Web · iOS + Android · Team product · In production
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ruta</h2>
              <p className="mt-2 text-base text-white/80">
                Service management for landscaping and maintenance businesses.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/60">
                One platform that carries a job from the first rate request to the final payment —
                quoting, scheduling and dispatch, the crew in the field, and billing. I helped build
                it, and work across the web app, the AWS backend, the crew app on iPhone and Android,
                and the customer portal.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {RUTA_STACK.map((t) => (
                  <span key={t} className="text-xs font-medium tracking-wide text-white/45">{t}</span>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/ruta"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-6 py-3 text-[15px] font-medium text-[#0a1f0a] transition-colors hover:bg-white/90"
                >
                  See the product page
                </Link>
                <a
                  href="https://apps.apple.com/us/app/ruta-crew/id6749279335"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 underline underline-offset-4 hover:text-white sm:ml-2"
                >
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.getruta.mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                  Google Play
                </a>
                <a
                  href="https://getruta.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                  getruta.com
                </a>
              </div>
            </div>

            {/* Screens */}
            <div className="flex items-end justify-center gap-4 sm:gap-6">
              <div className="w-[42%] max-w-[180px] translate-y-4 overflow-hidden rounded-[22px] border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <Image src={rutaVisit} alt="A Ruta Crew visit screen with the crew, an admin note, and the property" sizes="180px" className="h-auto w-full" />
              </div>
              <div className="w-[48%] max-w-[210px] overflow-hidden rounded-[26px] border border-white/12 shadow-[0_28px_64px_rgba(0,0,0,0.55)]">
                <Image src={rutaQueue} alt="The Ruta Crew queue of today's visits with a clock-in button" sizes="210px" className="h-auto w-full" />
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {RUTA_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="rounded-[22px] border border-white/12 bg-white/[0.05] p-7">
                <h3 className="text-base font-semibold tracking-tight text-white">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{h.desc}</p>
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
              <p className="eyebrow eyebrow-blue">iPhone, iPad &amp; Android · Client project</p>
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

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/tap-to-tick" className="btn-primary">See the product page</Link>
                <a
                  href="https://apps.apple.com/us/app/tap-to-tick/id6791948663"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 underline underline-offset-4 hover:text-white sm:ml-2"
                >
                  On the App Store
                </a>
                <Link href="/tap-to-tick/privacy" className="text-sm text-white/70 underline underline-offset-4 hover:text-white">
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

      {/* AI */}
      <section aria-label="AI" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow eyebrow-blue">AI</p>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            AI that does the work, not just the talking
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-body">
            I have shipped this twice, in two very different products: an assistant inside a platform
            businesses run on, and a money coach inside a consumer app. Both answer from the user&apos;s
            own data, and one of them takes actions on it.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {AI_SHIPPED.map((item) => (
              <div key={item.product} className="tile-elevated p-7 sm:p-9">
                <h3 className="text-xl font-semibold tracking-tight text-ink">{item.product}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-warm">{item.where}</p>
                <ul className="mt-5 space-y-2.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed text-body">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="mt-14 text-2xl font-semibold tracking-tight text-ink">
            What I would build into yours
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {AI_OFFER.map((a) => (
              <div key={a.title} className="tile p-7">
                <h4 className="text-base font-semibold tracking-tight text-ink">{a.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-body">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* The AI work I do for other developers, rather than inside a product. */}
          <div className="tile-elevated mt-8 flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold tracking-tight text-ink">
                I also set other developers up with AI
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-body sm:text-[15px]">
                Loops that run on their own, tools an agent can actually use, your codebase&apos;s
                rules written down, prompting, and context engineering — installed around your
                repository and handed over working. Built for teams who are new to it.
              </p>
            </div>
            <Link href="/ai-tooling" className="btn-primary shrink-0">See the AI tooling</Link>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/ruta" className="btn-primary">See the AI work in Ruta</Link>
            <Link href="/tap-to-tick#ai" className="text-sm text-body underline underline-offset-4 hover:text-ink sm:ml-2">
              How the Tap to Tick coach works
            </Link>
          </div>
        </div>
      </section>

      {/* Websites */}
      <section aria-label="Websites" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow eyebrow-blue">Websites</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Sites built the way I build them for clients
          </h2>

          <div className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-2">
            <div className="tile flex flex-col p-7 sm:p-9">
              <h3 className="text-xl font-semibold tracking-tight text-ink">kingdom-sites.com</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                This site · marketing site
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
                Server-rendered for speed, scored on real visitor performance, deliberately kept to
                static pages with no database behind it. The same setup I build client marketing sites
                on.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {SITE_STACK.map((t) => (
                  <span key={t} className="text-xs font-medium tracking-wide text-muted">{t}</span>
                ))}
              </div>
            </div>

            <div className="tile flex flex-col p-7 sm:p-9">
              <h3 className="text-xl font-semibold tracking-tight text-ink">Hazletts For The Kingdom</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                Ministry site · support raising
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
                A site for a family on mission with e3 Partners among South Asian communities in
                Kansas City. Their story, their work, and a clear way to partner with them — the kind
                of small site that has one job and has to do it on the first scroll.
              </p>
              <a
                href="https://hazletts-for-the-kingdom.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent mt-6 self-start text-sm"
              >
                Visit the site <span aria-hidden="true">›</span>
              </a>
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
