import Image from 'next/image'
import Link from 'next/link'
import ContactCta from '@/components/ContactCta'
import { BrowserMockup, PhonePortalMockup } from './Mockups'
import shotQueue from '../../../public/ruta/crew-queue.jpg'
import shotVisit from '../../../public/ruta/crew-visit.jpg'
import shotTime from '../../../public/ruta/crew-time.jpg'

const APP_STORE_URL = 'https://apps.apple.com/us/app/ruta-crew/id6749279335'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.getruta.mobile'
const RUTA_SITE_URL = 'https://getruta.com'

/* Plain facts about the engagement, not claims about the product. */
const FACTS = [
  { label: 'Merged pull requests', value: '350+' },
  { label: 'Working on it since', value: 'April 2026' },
  { label: 'Apps I ship in', value: 'Four' },
  { label: 'Platforms', value: 'Web, iOS + Android' },
]

/* What the platform is, kept short — this page is about the work, not the pitch. */
const SURFACES = [
  {
    title: 'Office web app',
    who: 'Owners and dispatchers',
    desc: 'Customers, services, the schedule, dispatch, revenue, messaging, and a map of every property being served today.',
  },
  {
    title: 'Crew app',
    who: 'Field crews, iPhone and Android',
    desc: 'Published as Ruta Crew. The day’s queue, the time clock, visit notes and photos — and it keeps working when the signal drops.',
  },
  {
    title: 'Customer portal',
    who: 'Homeowners and property managers',
    desc: 'Approve a rate, pay a balance, follow a payment plan, review past visits, and ask for more work.',
  },
  {
    title: 'Admin console',
    who: 'The Ruta team',
    desc: 'Onboarding new companies, payment provisioning, and the internal tooling that keeps accounts healthy.',
  },
]

/* The work itself, grouped the way I actually worked on it. Every line below is
   something that shipped. */
const WORK = [
  {
    area: 'Billing and money',
    lede: 'The part of the product where a bug costs someone real money, so it gets the most care.',
    items: [
      'Payment plans that charge their installments automatically on the due date, with the plan and balance visible to the customer in the portal',
      'Failed card charges retried instead of quietly left unpaid',
      'Account credits that stop re-applying once they are exhausted',
      'Collecting a payment now marks every visit that contributed to it as paid',
      'One bundle price charged once, rather than per visit',
      'Projected revenue built from live service schedules, so an owner can see what the book of business is worth next month',
    ],
  },
  {
    area: 'The crew app in the field',
    lede: 'A crew will abandon an app that loses their work. Most of this is reliability, not features.',
    items: [
      'The clock survives network blips, and a visit timer survives the app being resumed',
      'Photo capture times and distances that tell the truth, and an undo for a photo deleted by mistake',
      'Failed visit moves reported to error monitoring instead of being swallowed',
      'Crew leaders can remove a clocked-in member, and dispatch a service from the field',
      'Services, options, and requested work visible on the visit screen, in plain text',
    ],
  },
  {
    area: 'The office web app',
    lede: 'Where owners and dispatchers spend their day, and where most of my changes land.',
    items: [
      'A messages inbox with unread and needs-response filters, drafts that survive a reload, and reusable message templates',
      'Visits placed on their actual property on the map, with customer detail on hover and every clocked-in crew member’s trail',
      'A review queue that recognizes skipped visits and clears an approved visit immediately',
      'The AI assistant reachable from anywhere in the app, able to send a customer their existing rate, and failing in plain English instead of raw error codes',
      'Dozens of smaller repairs: a dashboard that stays usable on a narrow window, a close button Safari would not show, counts that agree with the page they link to',
    ],
  },
  {
    area: 'The customer portal',
    lede: 'Self-service that has to be understandable by someone who has never seen the product.',
    items: [
      'Payment plan and outstanding balance shown to the customer',
      'Service inquiries with selectable reasons, and an optional note when modifying a service',
      'Deactivated services with past visits stay reachable instead of disappearing',
      'Accurate visit counts for unlimited plans, and correct labels for one-time and seasonal work',
    ],
  },
  {
    area: 'Backend and platform',
    lede: 'The AWS side: the data model, the scheduled jobs, and the plumbing everything else sits on.',
    items: [
      'Job-site geofences and work zones precomputed on the backend, and an alert to the office when a crew member stops sharing location mid-visit',
      'Employee STOP texts honoured as an SMS opt-out',
      'Scheduled service deactivations that actually run on their date',
      'Whole-property measurement from the customer profile, so area-based services are priced off real square footage',
      'Maintenance scripts that stop reporting success when they processed nothing, and endpoints that return the right status instead of a 500',
    ],
  },
]

/* How I work when the codebase is not mine. */
const APPROACH = [
  {
    title: 'Read first, then ship in its grain',
    desc: 'I follow the conventions already in the repo rather than importing my own. A reviewer should not be able to tell which files are mine.',
  },
  {
    title: 'Small, reviewable changes',
    desc: 'One ticket, one pull request, described in plain language. 350+ of them merged, which only works if each is easy to review.',
  },
  {
    title: 'Errors that say something',
    desc: 'A lot of my work is turning silent failures and raw error codes into messages a dispatcher or a crew member can act on.',
  },
  {
    title: 'Careful around money and time',
    desc: 'Billing, clock-ins, and scheduled jobs get the most scrutiny, because those are the bugs a business actually feels.',
  },
]

const STACK = [
  'TypeScript',
  'React',
  'Vite',
  'React Native',
  'Expo',
  'AWS Lambda',
  'DynamoDB',
  'Cognito',
  'Amazon Bedrock',
  'Pulumi',
  'Mapbox',
  'Typesense',
  'Justifi payments',
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
      <section className="hero-wash px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
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

          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.label} className="tile p-5">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{f.label}</dt>
                <dd className="mt-1.5 text-lg font-semibold tracking-tight text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={RUTA_SITE_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              getruta.com
            </a>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-body hover:text-ink">
              <AppStoreIcon />
              Ruta Crew on the App Store
            </a>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-body hover:text-ink">
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
            Every line below went into production. It is a sample, not the full list — three hundred
            and fifty-odd merged pull requests do not fit on a page.
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

      {/* ---------- how I work ---------- */}
      <section aria-label="How I work" className="band-dark px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className={EYEBROW_ON_DARK}>How I work</p>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Coming into a codebase someone else started
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
            Ruta is the long-running example of what I do inside an existing product with a team
            around it — which is most client work. The habits matter more than the features.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {APPROACH.map((a) => (
              <div key={a.title} className="tile-dark p-7">
                <h3 className="text-base font-semibold tracking-tight text-white">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{a.desc}</p>
              </div>
            ))}
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
              One language end to end: React on the web, React Native through Expo on phones, and
              Lambda functions over DynamoDB behind them, with the infrastructure itself defined in
              code. Payments run through Justifi, maps through Mapbox, search through Typesense, and
              the assistant through Amazon Bedrock.
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
            Have software that needs <span className={GREEN}>another pair of hands?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-body">
            This is the work I do most: joining a live product and shipping in it without breaking
            what already works. Tell me what yours needs to do next and I&apos;ll scope it and send a
            quote.
          </p>
          <ContactCta className="mt-8" />
          <p className="mt-8 text-sm text-body">
            <Link href="/my-work" className="link-accent">See my other work</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
