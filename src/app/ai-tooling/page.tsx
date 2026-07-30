import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'AI tooling consultation — learn it, or build it in',
  description:
    'AI tooling consultation: learning to use AI properly yourself, or getting it into your product. Agent loops that run on their own, custom tools, instruction files, prompting, and context engineering — for developers and teams new to AI.',
  alternates: { canonical: '/ai-tooling' },
  openGraph: {
    title: 'AI tooling consultation',
    description:
      'Learning to use AI properly, or getting it into your product. Loops, custom tools, instruction files, prompting, and context engineering.',
    url: 'https://kingdom-sites.com/ai-tooling',
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
  },
}

/* The pieces of the setup. Each is a thing I install and hand over, not a
   concept — the plain-language line matters more than the name. */
const PIECES = [
  {
    name: 'Loops',
    title: 'Work that runs without being asked',
    desc: 'An agent set on a schedule or a trigger: sweeping the ticket queue overnight, watching a deploy, keeping a long job moving. You describe the job once and it runs on its own from then on.',
  },
  {
    name: 'Tools',
    title: 'Giving the model hands',
    desc: 'A model that can only talk is a chat box. Wired to your own systems — the database, the ticket tracker, the deploy — it can do the task instead of describing it. That wiring is the work, and it is where the value is.',
  },
  {
    name: 'Instruction files',
    title: 'The written-down rules, in the repo',
    desc: 'Plain markdown files that tell an agent how this codebase works, what the conventions are, and what never to touch. They turn scattered tribal knowledge into something every developer and every agent reads the same way.',
  },
  {
    name: 'Skills',
    title: 'Your team’s procedures, packaged',
    desc: 'The multi-step jobs your team does the same way every time — a release, a review, a new project scaffold — written once so anyone, or any agent, can run them properly on the first try.',
  },
  {
    name: 'Prompting',
    title: 'Asking in a way that works',
    desc: 'Most disappointing AI output is a briefing problem, not a model problem. I show your developers what a good ask looks like, and where to stop trusting the answer.',
  },
  {
    name: 'Context engineering',
    title: 'Deciding what the model gets to see',
    desc: 'Quality comes from what you feed it: the right records, at the right size, from your own data. This is the difference between a demo and something a business can rely on.',
  },
]

/* The tooling I run on my own machine. Proof that this is a daily practice
   rather than a service line. */
const MY_OWN = [
  {
    title: 'A control room for my agents',
    desc: 'I run several coding agents at once, so I built the place that keeps track of them: what each one is working on, what it produced, and which ones are waiting on me.',
  },
  {
    title: 'A dynamic island for my Mac',
    desc: 'The little status strip Apple gives the iPhone, rebuilt for my desktop — what is building, what just finished, and what needs a decision, glanceable without switching windows.',
  },
  {
    title: 'A time tracker that fills itself in',
    desc: 'It records what I actually worked on instead of relying on me remembering to start a timer, so a day is accounted for honestly.',
  },
  {
    title: 'Somewhere for every loose end',
    desc: 'Tools that catch the things I mention in passing and hold onto them until they are done, so follow-ups stop falling through the cracks.',
  },
]

/* Honest limits, stated up front — the part most AI pitches leave out. */
const HONEST = [
  'It will not replace your developers, and I will not pretend otherwise.',
  'Anything irreversible stays behind a person confirming it.',
  'A cheaper model per task where a cheap model is enough, so the bill stays sane.',
  'If a job is better done by ordinary code, I will tell you that instead of selling you a model.',
]

export default function AiTooling() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="hero-wash px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow eyebrow-blue">AI tooling consultation</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            AI that does the work, <span className="text-accent">not just the talking.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Two things: learning to use AI properly yourself, and getting it into the product you
            are building. Loops that run on their own, tools an agent can actually use, the rules of
            your codebase written down, and your developers taught how to ask. Especially useful if
            AI has not clicked for your team yet.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={CONTACT_MAILTO} className="btn-primary">Email me about your team</a>
            <Link href="/my-work" className="btn-ghost">See what I&apos;ve shipped</Link>
          </div>
        </div>
      </section>

      {/* What I set up */}
      <section aria-label="What I set up" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-blue">What I set up</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              The pieces, in plain language.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
              Six things, installed around your codebase and handed over working. You keep all of it
              — it lives in your repository, not in an account I control.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {PIECES.map((p) => (
              <div key={p.name} className="tile flex flex-col p-7">
                <span className="self-start rounded-full border border-[#0a63c9]/20 bg-[#0a63c9]/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0a4e9e]">
                  {p.name}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* My own workflow — the worked example */}
      <section aria-label="My own workflow" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-blue">A worked example</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              I run my own day on this.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
              Several small apps I built for myself, each one built with AI and each one now part of
              how I work. None of them existed a year ago, and none of them would have been worth the
              hours by hand — that shift is the whole point, and it is what I set up for other
              people.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {MY_OWN.map((m) => (
              <div key={m.title} className="tile p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section aria-label="Where I have shipped this" className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-blue">In production, not in theory</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Two products with my AI work inside them.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="tile flex flex-col p-7 sm:p-9">
              <h3 className="text-lg font-semibold tracking-tight text-ink">Ruta AI</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                Service management platform · team product
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
                An assistant answering from the company&apos;s own records, taking actions with a
                person confirming them, and reachable from anywhere in the app — on the web and in
                the field.
              </p>
              <Link href="/ruta" className="link-accent mt-5 self-start text-sm">
                Read the case study <span aria-hidden="true">›</span>
              </Link>
            </div>

            <div className="tile flex flex-col p-7 sm:p-9">
              <h3 className="text-lg font-semibold tracking-tight text-ink">The Tap to Tick money coach</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
                iPhone expense tracker · my own product · coming soon
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
                Ask a question in plain English and get an answer built from your own numbers — and
                only the numbers that bear on the question ever leave the phone.
              </p>
              <Link href="/tap-to-tick" className="link-accent mt-5 self-start text-sm">
                See the app <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>

          <div className="tile mt-5 p-7 sm:p-9">
            <h3 className="text-lg font-semibold tracking-tight text-ink">What I will tell you straight</h3>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {HONEST.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-body">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Contact" className="border-t border-line px-5 py-16 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Want your team set up <span className="text-accent">properly?</span>
          </h2>
          <div className="mt-8">
            <a href={CONTACT_MAILTO} className="btn-primary">Email me</a>
            <p className="mt-3 text-sm text-muted">
              <a href={CONTACT_MAILTO} className="link-accent font-medium">{CONTACT_EMAIL}</a>
            </p>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-[13px] leading-relaxed text-muted">
            Consultation hourly fee: $75/hr, booked in two-hour blocks — over your choice of Zoom,
            Google Meet, FaceTime, or whatever you already use. Build work is scoped and quoted per
            project instead.
          </p>
        </div>
      </section>
    </div>
  )
}
