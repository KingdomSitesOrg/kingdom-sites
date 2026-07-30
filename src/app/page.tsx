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
    eyebrow: 'Platforms & Dashboards',
    title: 'Your operations, organized.',
    desc: 'Customer portals, admin dashboards, and internal tools that make running your business easier.',
  },
  {
    eyebrow: 'APIs & Backends',
    title: 'The engine behind it all.',
    desc: 'Reliable backend systems, integrations, and APIs that scale with you.',
  },
]

const PROCESS = [
  {
    step: '01',
    title: 'Tell me about your project',
    desc: 'A short email is enough. We hop on a call or keep it async — whatever works for you.',
  },
  {
    step: '02',
    title: 'Get a scoped quote',
    desc: 'I scope the work and send you a clear, competitive quote. Free, no obligation, no inflated agency rates.',
  },
  {
    step: '03',
    title: 'I design and build',
    desc: 'One developer, end to end — no handoffs, no telephone game. You get regular updates and working previews.',
  },
  {
    step: '04',
    title: 'Launch and beyond',
    desc: 'I stick around after launch: updates, new features, support. A partner, not a one-off transaction.',
  },
]

const WHY = [
  {
    title: 'One developer, end to end',
    desc: 'You talk directly to the person building your software. Decisions are fast, context never gets lost, and quality stays consistent from design to deployment.',
  },
  {
    title: 'Competitive quotes, no packages',
    desc: "I'm not the cheapest, and I don't try to be. Every project is scoped individually and priced competitively — you pay for exactly what you need, and you know the price up front.",
  },
  {
    title: 'Built to last',
    desc: 'Modern stack, clean code, real performance. Software you can build on for years — not a template you outgrow in six months.',
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
            <a href="#process" className="btn-ghost">See how it works</a>
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
                <a href={CONTACT_MAILTO} className="link-accent mt-5 self-start text-sm">
                  Get a quote <span aria-hidden="true">›</span>
                </a>
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

      {/* Why work with me — the dark band */}
      <section aria-label="Why Kingdom Sites" className="band-dark px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why work with me</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              A developer, not an agency queue.
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-white/70">
              Every project is scoped, quoted, and built around your goals — never dropped into a template.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {WHY.map((item) => (
              <div key={item.title} className="tile-dark p-7">
                <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/65">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/my-work" className="btn-primary">See my work</Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" aria-label="How it works" className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-blue">How it works</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Simple, from first email to launch.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {PROCESS.map((p) => (
              <div key={p.step} className="tile p-7">
                <p className="text-sm font-semibold tracking-widest text-accent">{p.step}</p>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{p.desc}</p>
              </div>
            ))}
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
