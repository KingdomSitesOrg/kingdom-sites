import Image from 'next/image'
import Link from 'next/link'
import { CONTACT_MAILTO } from '@/lib/contact'
import { BrowserMockup, PhoneCrewMockup, PhonePortalMockup } from './Mockups'
import shotQueue from '../../../public/ruta/crew-queue.jpg'
import shotVisit from '../../../public/ruta/crew-visit.jpg'
import shotTime from '../../../public/ruta/crew-time.jpg'

const APP_STORE_URL = 'https://apps.apple.com/us/app/ruta-crew/id6749279335'
const RUTA_SITE_URL = 'https://getruta.com'
const RUTA_FACEBOOK_URL = 'https://www.facebook.com/share/1EzdtfSCs3/'

/* The three stages of the platform, in the order a job actually moves. */
const STAGES = [
  {
    num: '01',
    eyebrow: 'Win the work',
    title: 'Rate sent. Rate accepted.',
    body:
      'A rate request goes out from the service catalog. The prospect reviews and signs it on their phone, and becomes a customer the moment they do — with approved visits landing straight on the schedule.',
    points: [
      'Rate requests drafted from the service catalog',
      'Customer accepts and signs from any device',
      'Approved services generate their own visits',
    ],
    mockup: <BrowserMockup />,
    width: 'max-w-[540px]',
  },
  {
    num: '02',
    eyebrow: 'Get it done',
    title: 'The crew shows up and does the work.',
    body:
      'Each visit is routed to a crew for the day. They clock in, work the queue stop by stop, and capture time and photos as proof — even when there is no signal in the field.',
    points: [
      'A stop-by-stop route for every crew, every day',
      'Time, photos, and location captured on each visit',
      'Offline-first — pending work syncs when signal returns',
    ],
    mockup: <PhoneCrewMockup />,
    width: 'max-w-[300px]',
  },
  {
    num: '03',
    eyebrow: 'Get paid',
    title: 'Invoice fires. Customer pays.',
    body:
      'Closing a visit raises the invoice on its own. Customers pay from their own portal, see their visit history, and can add more work without anyone picking up the phone.',
    points: [
      'Invoiced automatically once a visit is complete',
      'Card payment and payment plans in the portal',
      'Visit history that sells the next job',
    ],
    mockup: <PhonePortalMockup />,
    width: 'max-w-[300px]',
  },
]

/* Every audience the platform serves has its own app. */
const SURFACES = [
  {
    title: 'Office web app',
    who: 'Owners and dispatchers',
    desc: 'The control room: customers, services, the schedule, dispatch, revenue, team chat, and a map of every property being served today.',
  },
  {
    title: 'Crew app for iOS',
    who: 'Field crews',
    desc: 'Published on the App Store as Ruta Crew. Today’s queue, the time clock, visit notes and photos — built to keep working when the signal drops.',
  },
  {
    title: 'Customer portal',
    who: 'Homeowners and property managers',
    desc: 'Self-service: approve a rate, pay a balance, follow a payment plan, review past visits, and request more services.',
  },
  {
    title: 'Admin console',
    who: 'The Ruta team',
    desc: 'Onboarding new companies, payment provisioning, and the internal tooling that keeps accounts healthy.',
  },
]

/* Work of mine that shipped — drawn from real, merged changes. */
const SHIPPED = [
  {
    title: 'Payment plans that charge themselves',
    desc: 'Installments charge automatically on their due dates, and the customer can follow the plan and their balance from the portal.',
  },
  {
    title: 'Revenue you can see coming',
    desc: 'Projected revenue built from active service schedules, so an owner can see what the book of business is worth next month.',
  },
  {
    title: 'Geofences and work zones',
    desc: 'Job-site boundaries precomputed on the backend, and an alert to the office when a crew member stops sharing location mid-visit.',
  },
  {
    title: 'Whole-property assessment',
    desc: 'Measure a property from the customer profile and price area-based services off real square footage instead of a guess.',
  },
  {
    title: 'The AI assistant, wired in',
    desc: 'Ruta AI reachable from anywhere in the web app, able to send a customer their existing rate, and failing in plain English rather than raw error codes.',
  },
  {
    title: 'Field-app reliability',
    desc: 'Visit timers that survive a resume, photo capture times that tell the truth, undo for deleted photos, and failed visit moves reported instead of swallowed.',
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

function AppStoreIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.77 2.28-1.61 2.79-.41 6.92 1.15 9.19.76 1.11 1.67 2.35 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.24.87-1.28 1.23-2.53 1.25-2.59-.03-.01-2.4-.92-2.42-3.65zM14.9 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  )
}

function AppStoreButton({ tone = 'light' }: { tone?: 'light' | 'outline' }) {
  const base =
    'inline-flex min-h-[44px] items-center justify-center gap-2.5 whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold transition-colors'
  const skin =
    tone === 'light'
      ? 'bg-white text-[#0a1f0a] hover:bg-white/90'
      : 'border border-white/20 text-white hover:border-white/45'
  return (
    <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={`${base} ${skin}`}>
      <AppStoreIcon />
      Get Ruta Crew on the App Store
    </a>
  )
}

function Check() {
  return (
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-400">
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
        <path
          d="M2 6.4 4.7 9 10 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

const GALLERY = [
  { src: shotQueue, alt: 'The crew app queue: eleven visits today with a clock-in button', cap: 'The day’s queue — clock in and work down the list' },
  { src: shotVisit, alt: 'A visit detail screen with schedule, crew, an admin note, and an aerial view of the property', cap: 'A visit — crew, notes, and the property itself' },
  { src: shotTime, alt: 'The time clock screen showing 16.9 hours logged this week across sessions', cap: 'The time clock — hours logged, session by session' },
]

export default function Ruta() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* ---------- nav ---------- */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a1f0a]/85 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-green-500 text-[13px] font-extrabold text-[#0a1f0a]" aria-hidden="true">
              R
            </span>
            <span className="text-[15px] font-extrabold tracking-[0.14em]">RUTA</span>
          </div>
          <div className="flex items-center gap-6 text-[13.5px] text-white/60">
            <a href="#platform" className="hidden hover:text-white sm:inline">The platform</a>
            <a href="#crew" className="hidden hover:text-white sm:inline">Crew app</a>
            <a href="#my-part" className="hidden hover:text-white sm:inline">My part in it</a>
            <Link href="/my-work" className="hover:text-white">Kingdom Sites</Link>
          </div>
        </nav>
      </header>

      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-24 sm:pt-24">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[560px] -translate-x-1/2 rounded-full bg-green-500/[0.09] blur-[130px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400/80">
            Web &amp; iOS · Service management · In production
          </p>

          <h1 className="mt-6 text-[clamp(3.4rem,13vw,8rem)] font-extrabold leading-[0.9] tracking-[0.06em]">
            RUTA
          </h1>

          <h2 className="mt-6 text-2xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
            One platform.
            <br />
            <span className="text-white/60">Prospect to payment.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/55">
            Every step from the first rate request to the final invoice, for landscaping and
            maintenance businesses. Four apps over one backend: the office web app, the crew app in
            the field, the customer portal, and the admin console behind them.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AppStoreButton />
            <a
              href={RUTA_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/45"
            >
              getruta.com
            </a>
          </div>

          <p className="mt-5 text-[13px] text-white/40">
            Published by P163, LLC · on the App Store since March 2026
          </p>
        </div>
      </section>

      {/* ---------- the three stages ---------- */}
      <div id="platform">
        {STAGES.map((stage, i) => {
          const mockupFirst = i % 2 === 1
          return (
            <section
              key={stage.num}
              aria-label={stage.title}
              className="relative overflow-hidden border-t border-white/[0.06] px-5 py-16 sm:px-8 sm:py-24"
            >
              <div
                className={`pointer-events-none absolute top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full bg-green-500/[0.06] blur-[120px] ${
                  mockupFirst ? 'left-[-10%]' : 'right-[-10%]'
                }`}
                aria-hidden="true"
              />
              <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <div className={mockupFirst ? 'lg:order-2' : 'lg:order-1'}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-400">{stage.num}</span>
                    <span className="h-px w-8 bg-green-400/30" aria-hidden="true" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-400/70">
                      {stage.eyebrow}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                    {stage.title}
                  </h2>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">{stage.body}</p>
                  <ul className="mt-7 space-y-3">
                    {stage.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <Check />
                        <span className="text-sm leading-relaxed text-white/70">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`flex justify-center ${mockupFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className={`w-full ${stage.width}`}>{stage.mockup}</div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* ---------- the crew app ---------- */}
      <section id="crew" className="border-t border-white/[0.06] bg-[#08190a] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-400/70">
              On the App Store
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.6rem]">Ruta Crew</h2>
            <p className="mt-2 text-base text-white/70">The field crew companion app.</p>
            <p className="mt-5 text-[15px] leading-relaxed text-white/55">
              The half of the platform that lives in a truck. A crew member opens it, clocks in, and
              works down the queue — service details, gate codes, an aerial view of the property, and
              the hours they have logged this week. Free, and free of anything a crew would have to
              learn.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {GALLERY.map((shot, i) => (
              <figure key={shot.cap} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f0d]">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  sizes="(min-width: 640px) 33vw, 92vw"
                  className="h-auto w-full"
                  priority={i === 0}
                />
                <figcaption className="px-4 py-3 text-[12.5px] leading-relaxed text-white/45">
                  {shot.cap}
                </figcaption>
              </figure>
            ))}
          </div>

          <dl className="mt-10 grid gap-4 sm:grid-cols-4">
            {[
              ['Price', 'Free'],
              ['Devices', 'iPhone, iPad, Mac'],
              ['Requires', 'iOS 18 or later'],
              ['Category', 'Productivity · 4+'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <dt className="text-[11px] uppercase tracking-wider text-white/40">{label}</dt>
                <dd className="mt-1.5 text-[15px] font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <AppStoreButton />
          </div>
        </div>
      </section>

      {/* ---------- four surfaces ---------- */}
      <section aria-label="The apps" className="border-t border-white/[0.06] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-400/70">
              One backend, four front doors
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.6rem]">
              Everyone gets the app they need.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/55">
              An owner, a crew member, and a homeowner want completely different things from the same
              job. Each has their own app, and all of them read and write the same data.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {SURFACES.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                <h3 className="text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-[12.5px] uppercase tracking-wider text-green-400/60">{s.who}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- my part in it ---------- */}
      <section id="my-part" className="border-t border-white/[0.06] bg-[#08190a] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-400/70">
              My part in it
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.6rem]">
              I helped build Ruta.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/55">
              Ruta is a team product, and I have been an integral part of it — working across the
              whole of it: the office web app, the AWS backend and the shared data layer behind it,
              the iOS crew app, and the customer portal. Hundreds of merged changes: features owners
              asked for, billing that has to be right, and the unglamorous field-app fixes that
              decide whether a crew trusts the thing.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">
              It is the clearest example of how I work inside a live product with a team around it:
              read the codebase, ship in its grain, and leave it easier to work in than I found it.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHIPPED.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-wider text-white/40">What it is built with</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {STACK.map((tech) => (
                <span key={tech} className="text-xs font-medium tracking-wide text-white/45">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- closing ---------- */}
      <section aria-label="Contact" className="border-t border-white/[0.06] px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Need someone who can step into a real codebase and ship?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/55">
            Ruta is the long-running example. Tell me what your software needs to do next and I will
            scope it and send a quote.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={CONTACT_MAILTO}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0a1f0a] transition-colors hover:bg-white/90"
            >
              Email me
            </a>
            <Link
              href="/my-work"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/45"
            >
              See my other work
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-white/[0.07] bg-[#061405] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[13px] text-white/45">
          <span>Ruta is a product of P163, LLC · {new Date().getFullYear()}</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href={RUTA_SITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              getruta.com
            </a>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              App Store
            </a>
            <a href={RUTA_FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Facebook
            </a>
            <Link href="/my-work" className="hover:text-white">
              Kingdom Sites
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
