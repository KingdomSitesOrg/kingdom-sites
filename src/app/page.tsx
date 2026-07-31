import Image from 'next/image'
import Link from 'next/link'
import aboutImage from '../../public/Photos/about.jpg'
import ToolTicker from '@/components/ToolTicker'
import MissionPreview from '@/components/MissionPreview'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

const STACK = ['Next.js', 'React', 'TypeScript', 'React Native', 'Swift', 'Node.js', 'PostgreSQL', 'AWS', 'Vercel']

/* The four kinds of work, each pointing at the page that shows it. */
const BUILDS = [
  { label: 'Websites', href: '/my-work#websites' },
  { label: 'Apps', href: '/my-work#apps' },
  { label: 'Custom internal software', href: '/my-work#platforms' },
  { label: 'AI in your platform', href: '/ai-tooling' },
]

/* A site and an app, drawn in CSS and quietly animating: bars filling, rows
   arriving, a highlight sweeping the hero block, the active tab moving. */
function WebMock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-[300px] overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="ml-2 h-2.5 w-24 rounded-full bg-white/10" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="h-2 w-14 rounded-full bg-white/30" />
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-7 rounded-full bg-white/15" />
            <span className="h-1.5 w-7 rounded-full bg-white/15" />
            <span className="h-3.5 w-11 rounded-full bg-accent" />
          </span>
        </div>

        <div className="mock-sweep mt-3.5 rounded-lg bg-white/[0.06] p-4">
          <span className="mock-bar block h-2.5 w-3/5 rounded-full bg-white/35" />
          <span className="mock-bar mt-2 block h-1.5 w-4/5 rounded-full bg-white/18" style={{ animationDelay: '0.2s' }} />
          <span className="mock-bar mt-1.5 block h-1.5 w-2/3 rounded-full bg-white/18" style={{ animationDelay: '0.4s' }} />
          <span className="mt-3 block h-3.5 w-16 rounded-full bg-accent" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="rounded-md border border-white/10 p-2">
              <span className="block h-6 w-full rounded bg-white/[0.06]" />
              <span
                className="mock-bar mt-2 block h-1.5 w-full rounded-full bg-white/20"
                style={{ animationDelay: `${0.3 + i * 0.25}s` }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PhoneMock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex w-[136px] flex-col overflow-hidden rounded-[26px] border-[3px] border-white/25 bg-[#0f1626] shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${className}`}
      aria-hidden="true"
    >
      <div className="relative bg-white/[0.05] px-3 pb-2 pt-3.5">
        <span className="absolute left-1/2 top-1.5 h-1.5 w-9 -translate-x-1/2 rounded-full bg-black/60" />
        <span className="mt-2 block h-2 w-14 rounded-full bg-white/30" />
      </div>
      <div className="flex-1 px-3 py-3">
        <div className="mock-sweep rounded-lg bg-accent p-2.5">
          <span className="block h-1.5 w-9 rounded-full bg-white/50" />
          <span className="mt-1.5 block h-2.5 w-14 rounded-full bg-white/85" />
        </div>
        <div className="mt-2.5 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="mock-row flex items-center gap-1.5"
              style={{ animationDelay: `${i * 0.45}s` }}
            >
              <span className="h-4 w-4 shrink-0 rounded-md bg-white/12" />
              <span className="flex-1">
                <span className="block h-1.5 w-full rounded-full bg-white/22" />
                <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-white/12" />
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-around border-t border-white/10 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="mock-tab h-1.5 w-1.5 rounded-full bg-accent"
            style={{ animationDelay: `${i * 2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="hero-wash px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Custom software, quoted to your project</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-6xl">
            Software that moves your business <span className="text-accent">forward.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            {"I'm Thomas — a full-stack developer building websites, mobile apps, and platforms. Designed, built, and supported by one person who actually cares how it turns out."}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={CONTACT_MAILTO} className="btn-primary">Email me about your project</a>
          </div>
        </div>

        {/* Stack strip */}
        <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {STACK.map((t) => (
            <span key={t} className="text-xs font-medium tracking-wide text-muted">{t}</span>
          ))}
        </div>
      </section>

      {/* What I build — a site and an app running quietly on either side of it,
          with a way through to each kind of work. */}
      <section id="services" aria-label="What I build" className="band-dark overflow-hidden px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <div className="hidden justify-end lg:flex">
            <WebMock />
          </div>

          <div className="min-w-0 text-center">
            <p className="eyebrow">Websites · Apps · Platforms</p>
            <h2 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              I build websites, apps, and custom internal software — and integrate AI into your
              platform.
            </h2>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {BUILDS.map((b) => (
                <Link
                  key={b.label}
                  href={b.href}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
                >
                  {b.label} <span aria-hidden="true" className="ml-1.5 text-white/60">›</span>
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/my-work"
                className="inline-flex min-h-[64px] items-center justify-center rounded-full bg-white px-12 py-4 text-xl font-semibold tracking-tight text-dark transition-transform hover:-translate-y-0.5 sm:min-h-[72px] sm:px-16 sm:text-2xl"
              >
                My work
              </Link>
            </div>
          </div>

          <div className="hidden justify-start lg:flex">
            <PhoneMock />
          </div>

          {/* On a phone there is no room for a column either side, so the site
              sits above the app rather than beside it. */}
          <div className="flex min-w-0 flex-col items-center gap-8 lg:hidden">
            <WebMock className="w-full max-w-[300px]" />
            <PhoneMock />
          </div>
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
              Your project becomes part of a bigger story.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-body">
              Kingdom Sites is more than a business. Every project also helps support the long-term
              mission work my wife Monisha and I are part of. You get great software — and it goes
              further than your launch day.
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
            {"Let's talk about your project."}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-body">
            {"Email me what you're building and I'll put together a quote. Free, fast, no obligation."}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <a href={CONTACT_MAILTO} className="btn-primary">Email me</a>
            <a href={CONTACT_MAILTO} className="link-accent text-sm">{CONTACT_EMAIL}</a>
          </div>
        </div>
      </section>
    </div>
  )
}
