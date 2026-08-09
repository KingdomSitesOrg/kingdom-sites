import Image from 'next/image'
import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { BrowserMockup, PhonePortalMockup } from './Mockups'
import shotQueue from '../../../public/ruta/crew-queue.jpg'
import shotVisit from '../../../public/ruta/crew-visit.jpg'
import shotTime from '../../../public/ruta/crew-time.jpg'

const APP_STORE_URL = 'https://apps.apple.com/us/app/ruta-crew/id6749279335'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.getruta.mobile'
const RUTA_SITE_URL = 'https://getruta.com'

/* What the platform is, kept short — this page is about the work, not the pitch. */
const SURFACES = [
 {
  title: 'Office web app',
  who: 'Owners and dispatchers',
  desc: 'Where the day gets run: customers, the schedule, billing, and messaging in one place.',
 },
 {
  title: 'Crew app',
  who: 'Field crews, iPhone and Android',
  desc: 'Published as Ruta Crew. The day’s work and the time clock — and it keeps working when the signal drops.',
 },
 {
  title: 'Customer portal',
  who: 'Homeowners and property managers',
  desc: 'Self-service: approve work, settle a balance, and look back over past visits.',
 },
 {
  title: 'Admin console',
  who: 'The Ruta team',
  desc: 'The internal side — onboarding new companies and supporting live accounts.',
 },
]

/* The work, grouped by area and deliberately kept at a level a client can read.
  Product specifics stay with the client. */
const WORK = [
 {
  area: 'Billing and money',
  lede: 'The part of the product where a bug costs someone real money, so it gets the most care.',
  items: [
   'Automated recurring billing, so the money collects itself instead of being chased',
   'Flexible payment arrangements a customer can follow and settle on their own',
   'Revenue forecasting from the live schedule, so an owner knows what next month is worth',
  ],
 },
 {
  area: 'The crew app in the field',
  lede: 'A crew will abandon an app that loses their work. Most of this is reliability, not features.',
  items: [
   'Offline that feels no different from online, syncing the moment signal comes back',
   'Time tracking dependable enough to run payroll from',
   'A verifiable record of every visit, captured on the job rather than written up later',
  ],
 },
 {
  area: 'The office web app',
  lede: 'Where owners and dispatchers spend their day, and where most of my changes land.',
  items: [
   'Customer messaging brought inside the platform, so the conversation lives with the job',
   'A live map of the day — every property being served, and every crew out working',
   'An approval step between the work being finished and the customer being billed',
  ],
 },
 {
  area: 'The customer portal',
  lede: 'Self-service that has to be understandable by someone who has never seen the product.',
  items: [
   'Customers settle up themselves instead of calling the office',
   'Requests for more work come in through the portal and land straight in the schedule',
  ],
 },
 {
  area: 'Backend and platform',
  lede: 'The AWS side: the data model, the scheduled jobs, and the plumbing everything else sits on.',
  items: [
   'Location and job-site intelligence handled once on the backend, shared by every app',
   'The scheduled automation the whole platform leans on, made dependable',
  ],
 },
]

/* The AI work, which is a big enough piece to stand on its own. */
const AI_BUILT = [
 'Answers grounded in the company’s own records, found by natural phrasing rather than exact keywords',
 'It acts as well as answers, and can take a user straight to the right place in the app',
 'Draft replies written from real history, which a person edits or regenerates before anything is sent',
 'Available everywhere people already work — the office app and the app in the field',
]

const AI_FOR_YOU = [
 {
  title: 'Grounded in your data, not the internet',
  desc: 'The useful version of this reads your own records and answers from them. That is a retrieval problem before it is a model problem, and it is most of the work.',
 },
 {
  title: 'Actions, with a person in the loop',
  desc: 'Drafting, sending, approving, scheduling — the model proposes and a human confirms. Nothing irreversible happens on its own.',
 },
 {
  title: 'Built to fail politely',
  desc: 'Timeouts, a model chosen per task rather than the most expensive one everywhere, and errors a member of staff can understand and act on.',
 },
 {
  title: 'AI in the workflow, not just the product',
  desc: 'The team’s own way of working, too: production problems explained in plain language, and internal tooling that saves engineering time.',
 },
]

const STACK = [
 'TypeScript',
 'React',
 'React Native',
 'Expo',
 'AWS',
 'Amazon Bedrock',
 'Infrastructure as code',
]

const CREW_SHOTS = [
 { src: shotQueue, alt: 'The Ruta Crew queue of today’s visits with a clock-in button', cap: 'The day’s queue' },
 { src: shotVisit, alt: 'A Ruta Crew visit screen with the crew, an admin note, and an aerial view of the property', cap: 'A visit in detail' },
 { src: shotTime, alt: 'The Ruta Crew time clock showing hours logged this week', cap: 'The time clock' },
]

/* Ruta's brand green stands in for the site's blue on this page — Ruta's accent
  without Ruta's full dark-green pages. Two shades: one for the light canvas,
  one for the dark bands. */
const GREEN = 'text-[#15803d]'
const GREEN_ON_DARK = 'text-[#4ade80]'
const EYEBROW = `text-xs font-semibold uppercase tracking-[0.1em] ${GREEN}`
const EYEBROW_ON_DARK = `text-xs font-semibold uppercase tracking-[0.1em] ${GREEN_ON_DARK}`

/* The store links read as buttons rather than stray text. */
const STORE_PILL =
 'inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[#15803d]/25 bg-[#16a34a]/10 px-5 py-2.5 text-sm font-medium text-[#15803d] transition-colors hover:border-[#15803d]/45 hover:bg-[#16a34a]/16'

function AppStoreIcon() {
 return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
   <path d="M17.05 12.54c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.77 2.28-1.61 2.79-.41 6.92 1.15 9.19.76 1.11 1.67 2.35 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.24.87-1.28 1.23-2.53 1.25-2.59-.03-.01-2.4-.92-2.42-3.65zM14.9 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.52 2.69-1.28z" />
  </svg>
 )
}

function PlayStoreIcon() {
 return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
   <path d="M3.6 2.3a1 1 0 0 0-.35.76v17.88a1 1 0 0 0 .35.76l9.24-9.7L3.6 2.3zm10.4 8.02 2.6-2.73-8.9-5.06a.98.98 0 0 0-.35-.12l6.65 7.91zm0 3.36-6.65 7.9c.12-.02.24-.06.35-.12l8.9-5.05-2.6-2.73zm1.13-1.68 3.02 3.17 2.6-1.48c.79-.45.79-1.93 0-2.38l-2.6-1.48-3.02 3.17z" />
  </svg>
 )
}

export default function Ruta() {
 return (
  <div className="w-full overflow-x-hidden">
   {/* ---------- hero ---------- */}
   <section className="relative overflow-hidden px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
    {/* Ruta green in place of the site's blue wash. */}
    <div
     className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[620px]"
     style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(22, 163, 74, 0.12), transparent 70%)' }}
     aria-hidden="true"
    />
    <div className="mx-auto max-w-4xl">
     <p className={EYEBROW}>Case study · Ruta</p>
     <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
      What I&apos;ve built inside <span className={GREEN}>Ruta.</span>
     </h1>
     <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
      Ruta is service-management software for landscaping and maintenance businesses — one
      platform carrying a job from the first rate request to the final payment. I did not start
      it, and it is not my company. I helped build it: since April 2026 I have shipped across
      all four of its apps and the AWS backend they share.
     </p>

     <div className="mt-9 flex flex-wrap items-center gap-3">
      <a
       href={RUTA_SITE_URL}
       target="_blank"
       rel="noopener noreferrer"
       className="inline-flex min-h-[42px] items-center rounded-full bg-[#15803d] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#166534]"
      >
       getruta.com
      </a>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={STORE_PILL}>
       <AppStoreIcon />
       Ruta Crew on the App Store
      </a>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={STORE_PILL}>
       <PlayStoreIcon />
       On Google Play
      </a>
     </div>
    </div>
   </section>

   {/* ---------- what the platform is ---------- */}
   <section aria-label="What Ruta is" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
      Four apps over one backend
     </h2>
     <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-body sm:text-base">
      An owner, a crew member, and a homeowner want completely different things from the same
      job, so each has their own app over shared data. I work in all four, which is the reason
      a single change of mine often touches the backend, the office screen, and the field
      screen in one pull request.
     </p>

     <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {SURFACES.map((s) => (
       <div key={s.title} className="tile p-7">
        <h3 className="text-base font-semibold tracking-tight text-ink">{s.title}</h3>
        <p className={`mt-1 text-xs font-medium uppercase tracking-wider ${GREEN}`}>{s.who}</p>
        <p className="mt-3 text-sm leading-relaxed text-body">{s.desc}</p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* ---------- the two web surfaces ---------- */}
   <section aria-label="The web surfaces" className="band-dark px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <p className={EYEBROW_ON_DARK}>The screens I work in</p>
     <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
      The office app and the customer portal
     </h2>
     <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
      Two React apps over the same data: the dispatcher&apos;s control room, and the
      self-service view a customer gets. Sketched here rather than screenshotted, because
      real customer data sits on every live screen.
     </p>

     <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-14">
      <div>
       <BrowserMockup />
       <p className="mt-4 text-[13px] text-white/45">
        The office home screen — the day&apos;s visits, revenue, who is clocked in, and what
        needs a decision now.
       </p>
      </div>
      <div>
       <PhonePortalMockup />
       <p className="mt-4 text-center text-[13px] text-white/45">
        The customer portal — active services, a balance to pay, and more work to request.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* ---------- the work ---------- */}
   <section aria-label="What I've shipped" className="px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <p className={EYEBROW}>The work</p>
     <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
      What I&apos;ve shipped, by area
     </h2>
     <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-body sm:text-base">
      Everything below went into production. It is a summary rather than a list — years of
      changes do not fit on a page, and the details of a client&apos;s product stay with the
      client.
     </p>

     <div className="mt-10 space-y-5">
      {WORK.map((group) => (
       <div key={group.area} className="tile p-7 sm:p-9">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.7fr] lg:gap-10">
         <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">{group.area}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{group.lede}</p>
         </div>
         <ul className="space-y-2.5">
          {group.items.map((item) => (
           <li key={item} className="flex gap-3 text-sm leading-relaxed text-body">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" aria-hidden="true" />
            <span>{item}</span>
           </li>
          ))}
         </ul>
        </div>

        {/* The field app is the one surface with public screenshots. */}
        {group.area === 'The crew app in the field' && (
         <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {CREW_SHOTS.map((shot) => (
           <figure key={shot.cap} className="overflow-hidden rounded-2xl border border-line bg-surface-2">
            <Image src={shot.src} alt={shot.alt} sizes="(min-width: 640px) 30vw, 90vw" className="h-auto w-full" />
            <figcaption className="px-4 py-3 text-[12.5px] text-muted">{shot.cap}</figcaption>
           </figure>
          ))}
         </div>
        )}
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* ---------- AI ---------- */}
   <section aria-label="AI" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <p className={EYEBROW}>AI, in production</p>
     <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
      I built Ruta AI into the product — and it does the work, not just the talking
     </h2>
     <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-body sm:text-base">
      Ruta AI runs on Amazon Bedrock and I shipped it across the web app, the backend, and the
      crew app. The point was never a chat box bolted to the corner of the screen: it answers
      from the company&apos;s own records, and it can act on what it finds.
     </p>

     <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      <div className="tile p-7 sm:p-9">
       <h3 className="text-lg font-semibold tracking-tight text-ink">What I shipped</h3>
       <ul className="mt-5 space-y-2.5">
        {AI_BUILT.map((item) => (
         <li key={item} className="flex gap-3 text-sm leading-relaxed text-body">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" aria-hidden="true" />
          <span>{item}</span>
         </li>
        ))}
       </ul>
      </div>

      <div className="tile p-7 sm:p-9">
       <h3 className="text-lg font-semibold tracking-tight text-ink">
        What that means for your software
       </h3>
       <p className="mt-2 text-sm leading-relaxed text-muted">
        The same work, pointed at your product — grounded answers, actions with a person in
        the loop, and cost/failure handling built in from the start.
       </p>
       <div className="mt-6 space-y-5">
        {AI_FOR_YOU.map((a) => (
         <div key={a.title}>
          <h4 className="text-[15px] font-semibold tracking-tight text-ink">{a.title}</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-body">{a.desc}</p>
         </div>
        ))}
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* ---------- stack ---------- */}
   <section aria-label="Technology" className="px-5 py-16 sm:px-8 sm:py-20">
    <div className="mx-auto max-w-6xl">
     <div className="tile p-7 sm:p-10">
      <p className={`text-xs font-semibold uppercase tracking-widest ${GREEN}`}>Built with</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
       A TypeScript monorepo on AWS
      </h2>
      <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-body sm:text-base">
       One language end to end: React on the web, React Native through Expo on phones, and a
       serverless AWS backend behind them, with the infrastructure itself defined in code. The
       assistant runs on Amazon Bedrock. Payments, maps, and search go through managed
       services rather than anything hand-rolled.
      </p>
      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
       {STACK.map((tech) => (
        <span key={tech} className="text-xs font-medium tracking-wide text-muted">{tech}</span>
       ))}
      </div>
     </div>
    </div>
   </section>

   {/* ---------- CTA ---------- */}
   <section aria-label="Contact" className="border-t border-line px-5 py-16 text-center sm:px-8 sm:py-20">
    <div className="mx-auto max-w-3xl">
     <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
      Need product ownership <span className={GREEN}>like this?</span>
     </h2>
     <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
      Ruta is proof of depth — not a product Kingdom Sites sells. Hire me to own your custom
      product the same way.
     </p>
     <div className="mt-9">
      <a
       href={CONTACT_MAILTO}
       className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#15803d] px-7 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#166534]"
      >
       Email me about product ownership
      </a>
      <p className="mt-3 text-sm text-muted">
       <a href={CONTACT_MAILTO} className={`font-medium ${GREEN} hover:underline hover:underline-offset-4`}>
        {CONTACT_EMAIL}
       </a>
      </p>
     </div>
     <p className="mt-8 text-sm text-body">
      <Link href="/my-work" className={`font-medium ${GREEN} hover:underline hover:underline-offset-4`}>
       Proof portfolio
      </Link>
      {' · '}
      <Link href="/#services" className={`font-medium ${GREEN} hover:underline hover:underline-offset-4`}>
       Ownership pricing
      </Link>
     </p>
    </div>
   </section>
  </div>
 )
}
