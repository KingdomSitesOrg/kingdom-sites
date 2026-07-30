import Image from 'next/image'
import Link from 'next/link'
import aboutImage from '../../public/Photos/about.jpg'
import ToolTicker from '@/components/ToolTicker'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

const STACK = ['Next.js', 'React', 'TypeScript', 'React Native', 'Swift', 'Node.js', 'PostgreSQL', 'AWS', 'Vercel']

const SERVICES = [
  {
    eyebrow: 'Websites',
    title: 'Fast, beautiful, built to convert.',
    desc: 'Landing pages, marketing sites, and full multi-page builds that load instantly and turn visitors into customers.',
  },
  {
    eyebrow: 'Mobile Apps',
    title: 'iOS and Android, done right.',
    desc: 'Mobile apps for your customers or your team — from first idea to the App Store.',
  },
  {
    eyebrow: 'AI Consultation',
    title: 'Learn it, or build it in.',
    desc: 'Sitting down with your developers to use AI properly, or getting it inside the product you are building. Built for teams who are new to it.',
    href: '/ai-tooling',
    cta: 'See what that covers',
  },
  {
    eyebrow: 'APIs & Backends',
    title: 'The engine behind it all.',
    desc: 'Reliable backend systems, integrations, and APIs that scale with you.',
  },
]

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

          <p className="mt-5 text-sm text-muted">
            Free scoped quote, no obligation · <a href={CONTACT_MAILTO} className="link-accent">{CONTACT_EMAIL}</a>
          </p>
        </div>

        {/* Stack strip */}
        <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {STACK.map((t) => (
            <span key={t} className="text-xs font-medium tracking-wide text-muted">{t}</span>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" aria-label="What I build" className="border-t border-line px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-blue">What I build</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Whatever your project needs.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {SERVICES.map((s) => (
              <div key={s.eyebrow} className="tile flex flex-col p-7 sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{s.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-body">{s.desc}</p>
                {/* Only the AI card leads anywhere; the rest just describe the work. */}
                {s.href && (
                  <Link href={s.href} className="link-accent mt-5 self-start text-sm">
                    {s.cta} <span aria-hidden="true">›</span>
                  </Link>
                )}
              </div>
            ))}
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
              Languages and platforms, the cloud services behind them, and the AI work — including
              AI tooling for developers and teams who are new to it and want a hand getting started.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <ToolTicker />
        </div>
      </section>

      {/* One way on from here: the work itself. */}
      <section aria-label="My work" className="band-dark px-5 py-20 text-center sm:px-8 sm:py-24">
        <Link
          href="/my-work"
          className="inline-flex min-h-[64px] items-center justify-center rounded-full bg-white px-12 py-4 text-xl font-semibold tracking-tight text-dark transition-transform hover:-translate-y-0.5 sm:min-h-[72px] sm:px-16 sm:text-2xl"
        >
          My work
        </Link>
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

      {/* Contact */}
      <section id="contact" aria-label="Contact" className="px-5 pb-24 sm:px-8">
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
