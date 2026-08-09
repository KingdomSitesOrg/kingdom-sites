import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import ToolTicker from '@/components/ToolTicker'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import shotOverview from '../../../public/tap-to-tick/overview.jpg'
import shotLog from '../../../public/tap-to-tick/log.jpg'
import jwlHome from '../../../public/latin-game/home.jpg'
import jwlMap from '../../../public/latin-game/map.jpg'
import rutaQueue from '../../../public/ruta/crew-queue.jpg'
import rutaVisit from '../../../public/ruta/crew-visit.jpg'

export const metadata: Metadata = {
 title: 'Proof portfolio — shipped work for product ownership',
 description:
  'Ruta, Jam with Latin, Tap to Tick, and AI in production — proof of product ownership work for founders and product owners hiring a long-term product partner, not products for sale.',
 alternates: { canonical: '/my-work' },
}

const TTT_STACK = ['Swift', 'SwiftUI', 'WidgetKit', 'watchOS', 'CloudKit']

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
  title: 'Free, all of it',
  desc: 'Every feature is free, including the shared budget for two people.',
 },
]

const JWL_STACK = ['React Native', 'Expo', 'Expo Router', 'TypeScript', 'Supabase', 'PostgreSQL', 'EAS']

const JWL_HIGHLIGHTS = [
 {
  title: 'A curriculum, not a word list',
  desc: 'Twelve stops teach declensions, then verbs, then sentences — the order classical teachers use — with camp-outs along the way that review everything so far.',
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

/* AI work shipped in products. Tap to Tick’s coach is disabled and not listed. */
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

/* Detail pages for each proof project — not products Kingdom Sites sells. */
const PRODUCT_PAGES = [
 {
  name: 'Tap to Tick',
  href: '/tap-to-tick',
  desc: 'An expense tracker for iPhone and Apple Watch that logs a purchase in one tap, from the Lock Screen or your wrist.',
 },
 {
  name: 'Latin practice game',
  href: '/latin-game',
  desc: 'A Latin course for homeschool and classical students, played as a Roman-legion march from Rōma to Gallia.',
 },
 {
  name: 'Ruta',
  href: '/ruta',
  desc: 'Service management for landscaping and maintenance businesses, carrying a job from the first quote to the final payment.',
 },
]

/* A website and an app, drawn in CSS — no screenshots, since these stand for the
  kind of thing rather than any one project. */

function WebsiteView() {
 return (
  <div
   className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
   aria-hidden="true"
  >
   <div className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-3 py-2">
    <span className="h-2 w-2 rounded-full bg-ink/15" />
    <span className="h-2 w-2 rounded-full bg-ink/15" />
    <span className="h-2 w-2 rounded-full bg-ink/15" />
    <span className="ml-2 h-3 w-24 rounded-full bg-ink/[0.07]" />
   </div>
   <div className="p-4">
    <div className="flex items-center justify-between">
     <span className="h-2.5 w-16 rounded-full bg-ink/25" />
     <span className="flex gap-2">
      <span className="h-2 w-8 rounded-full bg-ink/12" />
      <span className="h-2 w-8 rounded-full bg-ink/12" />
      <span className="h-4 w-12 rounded-full bg-accent" />
     </span>
    </div>
    <div className="mt-4 rounded-lg bg-surface-2 p-5">
     <span className="block h-3.5 w-3/5 rounded-full bg-ink/25" />
     <span className="mt-2.5 block h-2 w-4/5 rounded-full bg-ink/12" />
     <span className="mt-1.5 block h-2 w-2/3 rounded-full bg-ink/12" />
     <span className="mt-4 block h-4 w-20 rounded-full bg-accent" />
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
     {[0, 1, 2].map((i) => (
      <span key={i} className="rounded-md border border-line p-2.5">
       <span className="block h-8 w-full rounded bg-ink/[0.07]" />
       <span className="mt-2 block h-2 w-full rounded-full bg-ink/15" />
       <span className="mt-1.5 block h-2 w-2/3 rounded-full bg-ink/10" />
      </span>
     ))}
    </div>
    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
     <span className="h-2 w-16 rounded-full bg-ink/12" />
     <span className="flex gap-2">
      <span className="h-2 w-6 rounded-full bg-ink/10" />
      <span className="h-2 w-6 rounded-full bg-ink/10" />
     </span>
    </div>
   </div>
  </div>
 )
}

function AppView() {
 return (
  <div
   className="mx-auto flex w-[148px] flex-col overflow-hidden rounded-[30px] border-[3px] border-ink/85 bg-surface shadow-md"
   aria-hidden="true"
  >
   <div className="relative bg-surface-2 px-3.5 pb-2.5 pt-4">
    <span className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink/80" />
    <span className="mt-2.5 block h-2.5 w-16 rounded-full bg-ink/25" />
   </div>
   <div className="flex-1 px-3.5 py-3.5">
    <div className="rounded-lg bg-accent p-3">
     <span className="block h-2 w-10 rounded-full bg-white/50" />
     <span className="mt-2 block h-3 w-16 rounded-full bg-white/85" />
     <span className="mt-2 block h-2 w-12 rounded-full bg-white/40" />
    </div>
    <div className="mt-3 space-y-2.5">
     {[0, 1, 2, 3, 4].map((i) => (
      <span key={i} className="flex items-center gap-2">
       <span className="h-5 w-5 shrink-0 rounded-md bg-ink/10" />
       <span className="flex-1">
        <span className="block h-1.5 w-full rounded-full bg-ink/18" />
        <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-ink/10" />
       </span>
      </span>
     ))}
    </div>
   </div>
   <div className="flex justify-around border-t border-line px-3 py-2.5">
    <span className="h-2 w-2 rounded-full bg-accent" />
    <span className="h-2 w-2 rounded-full bg-ink/15" />
    <span className="h-2 w-2 rounded-full bg-ink/15" />
   </div>
  </div>
 )
}

export default function MyWork() {
 return (
  <div className="w-full overflow-x-hidden">
   {/* Hero */}
   <section className="hero-wash px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
    <p className="eyebrow">Proof for product ownership</p>
    <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
     Shipped work you can <span className="text-accent">judge me by</span>
    </h1>
    <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
     These projects show how I own custom products — mobile, systems, and AI. They are proof for
     hiring a product ownership partner, not Kingdom Sites products you buy off the shelf.
    </p>
    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
     <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
     <Link href="/#pricing" className="btn-ghost">
      See ownership pricing
     </Link>
    </div>
    <p className="mt-4 text-sm text-muted">
     <Link href="/software" className="underline underline-offset-4">
      How product ownership works
     </Link>
    </p>
   </section>

   {/* Featured project — Ruta */}
   <section id="platforms" aria-label="Ruta" className="scroll-mt-20 bg-[#0a1f0a] px-5 py-16 text-white sm:px-8 sm:py-24">
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

   {/* Featured project — the Latin practice game */}
   <section id="apps" aria-label="Latin practice game" className="scroll-mt-20 border-t border-line px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <div className="tile-elevated grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
      {/* Screens */}
      <div className="flex items-end justify-center gap-4 sm:gap-6 lg:order-2">
       <div className="w-[44%] max-w-[180px] translate-y-4 overflow-hidden rounded-[26px] border border-line shadow-[0_18px_44px_rgba(16,23,37,0.16)]">
        <Image src={jwlMap} alt="The campaign map of Italy from the Latin practice game" sizes="180px" className="h-auto w-full" />
       </div>
       <div className="w-[50%] max-w-[210px] overflow-hidden rounded-[30px] border border-line shadow-[0_24px_56px_rgba(16,23,37,0.2)]">
        <Image src={jwlHome} alt="The home screen of the Latin practice game" sizes="210px" className="h-auto w-full" />
       </div>
      </div>

      <div className="lg:order-1">
       <p className="eyebrow eyebrow-blue">iPhone, iPad &amp; Android · Client project</p>
       <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Latin practice game
       </h2>
       <p className="mt-2 text-base text-ink/80">
        Classical Latin as a Roman-legion quest.
       </p>
       <p className="mt-4 text-[15px] leading-relaxed text-body">
        Homeschool and classical students march north from Rōma to Gallia, learning real
        vocabulary, verb endings, and sentences at every stop. A curriculum wrapped in a game,
        with a leaderboard that keeps students drilling on their own initiative.
       </p>

       <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
        {JWL_STACK.map((t) => (
         <span key={t} className="text-xs font-medium tracking-wide text-muted">{t}</span>
        ))}
       </div>

       <div className="mt-7">
        <Link href="/latin-game" className="btn-primary">See the product page</Link>
       </div>

       {/* The client's brand, named once, as credit. */}
       <p className="mt-5 text-xs text-muted">
        Built for{' '}
        <a
         href="https://www.jamwithlatin.com/"
         target="_blank"
         rel="noopener noreferrer"
         className="link-accent"
        >
         Jam with Latin
        </a>
        .
       </p>
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
        A frictionless expense tracker.
       </p>
       <p className="mt-4 text-[15px] leading-relaxed text-white/65">
        Most expense trackers fail for the same reason: logging a purchase is more work than
        making one. Tap to Tick puts the whole thing on your Lock Screen, your wrist, and your
        Apple Pay — one shared budget for two people when you want it.
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
     <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
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
      I have shipped this in production on Ruta: an assistant inside a platform businesses run
      on. It answers from the company&apos;s own data, and it can take actions — with a person
      in the loop — not just talk about them.
     </p>

     <div className="mt-10 grid gap-5">
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
        Consultation for developers and teams new to it: learning to use AI properly, or
        getting it into the product you are building. Loops that run on their own, tools an
        agent can actually use, your codebase&apos;s rules written down, prompting, and
        context engineering.
       </p>
      </div>
      <Link href="/ai-tooling" className="btn-primary shrink-0">See the AI tooling</Link>
     </div>

     <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link href="/ruta" className="btn-primary">See the AI work in Ruta</Link>
     </div>
    </div>
   </section>

   {/* Websites */}
   <section id="websites" aria-label="Websites" className="scroll-mt-20 border-t border-line px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <p className="eyebrow eyebrow-blue">Websites</p>
     <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
      Sites built the way I build them for clients
     </h2>

     {/* 3 site cards → sm:3 so no orphan between 2-col and 3-col. */}
     <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
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
       <h3 className="text-xl font-semibold tracking-tight text-ink">Prayer</h3>
       <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
        This site · Romans 10:14 prayer meetings
       </p>
       <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
        A casual mini-site for a weekly prayer-meeting initiative for the unreached world —
        how a night runs, sample guides to download, a leader brief, and links to pray and
        give. Its own look and navigation, built as a small self-contained site inside this
        one.
       </p>
       <Link href="/prayer" className="link-accent mt-6 self-start text-sm">
        Visit the site <span aria-hidden="true">›</span>
       </Link>
      </div>

      <div className="tile flex flex-col p-7 sm:p-9">
       <h3 className="text-xl font-semibold tracking-tight text-ink">Ministry</h3>
       <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
        This site · video pages in two languages
       </p>
       <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
        Short hand-drawn walkthroughs of books of the Bible, in English and Bangla. Its own
        look and navigation, a custom video player with a language switch, and the Bengali
        script shipped with the page so it reads the same on every device.
       </p>
       <Link href="/ministry" className="link-accent mt-6 self-start text-sm">
        Visit the site <span aria-hidden="true">›</span>
       </Link>
      </div>
     </div>

     {/* The pages for the products above are site work in their own right —
       two of them with a look of their own, nothing like this site. */}
     <h3 className="mt-14 text-2xl font-semibold tracking-tight text-ink">
      Detail pages for each proof project
     </h3>
     <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-body">
      Deeper write-ups of the work above — still portfolio context, not a product store.
     </p>
     {/* 3 product pages → one full row of 3 from sm up (no 2-col intermediate). */}
     <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {PRODUCT_PAGES.map((p) => (
       <Link
        key={p.name}
        href={p.href}
        className="tile flex flex-col p-7 transition-colors hover:border-accent"
       >
        <h4 className="text-base font-semibold tracking-tight text-ink">{p.name}</h4>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{p.desc}</p>
        <span className="link-accent mt-5 text-sm">
         Visit the page <span aria-hidden="true">›</span>
        </span>
       </Link>
      ))}
     </div>
    </div>
   </section>

   {/* How long it takes — the question every client asks. */}
   <section aria-label="How long it takes" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-5xl">
     <div className="text-center">
      <p className="eyebrow eyebrow-blue">How long it usually takes</p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
       From first email to launched.
      </h2>
     </div>

     <div className="mt-12 grid gap-5 sm:grid-cols-2">
      <div className="tile flex flex-col p-7 sm:p-8">
       <div className="flex flex-1 items-center justify-center py-2">
        <WebsiteView />
       </div>
       <div className="mt-7 border-t border-line pt-6 text-center">
        <p className="text-sm font-medium text-body">A website</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
         About 2 weeks<span className="align-super text-[0.55em] text-accent">*</span>
        </p>
       </div>
      </div>

      <div className="tile flex flex-col p-7 sm:p-8">
       <div className="flex flex-1 items-center justify-center py-2">
        <AppView />
       </div>
       <div className="mt-7 border-t border-line pt-6 text-center">
        <p className="text-sm font-medium text-body">An app</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
         30 days<span className="align-super text-[0.55em] text-accent">*</span>
        </p>
       </div>
      </div>
     </div>

     <p className="mx-auto mt-10 max-w-2xl text-center text-[13.5px] leading-relaxed text-muted">
      <span className="text-accent">*</span> Assuming the direction, graphics, and content come
      from you before the build starts, or reach me as it goes. Time spent waiting on those
      pushes the date out with it — and it depends on how complex the app is.
     </p>
    </div>
   </section>

   {/* My tools — the rotating strips */}
   <section aria-label="My tools" className="overflow-hidden border-t border-line py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
     <div className="max-w-2xl">
      <p className="eyebrow eyebrow-blue">My tools</p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
       The kit I build with.
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
       Languages and platforms, the cloud services behind them, and the AI work — for
       developers, and just as much for anyone doing marketing, email, SEO, or day-to-day
       task management who wants a hand getting AI genuinely useful.
      </p>
     </div>
    </div>

    <div className="mt-10">
     <ToolTicker />
    </div>
   </section>

   {/* CTA */}
   <section aria-label="Contact" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-3xl text-center">
     <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
      Want this kind of ownership <span className="text-accent">on your product?</span>
     </h2>
     <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-body">
      Product ownership retainers for custom products — apps, systems, and AI when that is the
      job. Month to month is fine. Send an enquiry about what you are building, or read how ownership
      works first.
     </p>
     <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
      <Link href="/#pricing" className="btn-ghost">
       See ownership pricing
      </Link>
     </div>
     <p className="mt-5 text-sm text-body">
      <Link href="/software" className="link-accent">
       How product ownership works
      </Link>
      {' · '}
      <Link href={INQUIRE_PATH} className="link-accent">{INQUIRE_CTA}</Link>
     </p>
    </div>
   </section>
  </div>
 )
}
