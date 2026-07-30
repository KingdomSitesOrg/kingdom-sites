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

/* Small CSS-drawn views of the four apps — no image files, no icon font: each
   one is a handful of divs shaped to suggest the interface it stands for. */

const FRAME = 'relative h-14 w-[86px] shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2 p-1.5'

/* Rows of running agents, one of them waiting on me. */
function AgentsView() {
  return (
    <div className={FRAME} aria-hidden="true">
      <div className="flex h-full flex-col justify-between">
        {[
          'w-[70%] bg-[#0a63c9]',
          'w-[46%] bg-ink/25',
          'w-[58%] bg-ink/25',
        ].map((bar, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#0a63c9]' : 'bg-ink/20'}`} />
            <span className={`h-1.5 rounded-full ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* The notch pill, with something happening inside it. */
function IslandView() {
  return (
    <div className={FRAME} aria-hidden="true">
      <div className="flex h-full items-start justify-center">
        <div className="flex items-center gap-1 rounded-full bg-ink px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          <span className="h-1 w-4 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  )
}

/* A reminder arriving: stand up, do a set. */
function MoveView() {
  return (
    <div className={FRAME} aria-hidden="true">
      <div className="flex h-full items-center">
        <div className="flex w-full items-center gap-1.5 rounded-md border border-line bg-surface px-1.5 py-1.5 shadow-sm">
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#16a34a]">
            <svg viewBox="0 0 10 10" className="h-2 w-2">
              <path d="M5 8V2.4M2.6 4.8 5 2.2l2.4 2.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="h-1.5 w-9 rounded-full bg-ink/30" />
            <span className="h-1 w-6 rounded-full bg-ink/15" />
          </span>
        </div>
      </div>
    </div>
  )
}

/* Loose ends, two of them caught. */
function TodoView() {
  return (
    <div className={FRAME} aria-hidden="true">
      <div className="flex h-full flex-col justify-between">
        {[true, true, false].map((done, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className={`grid h-2.5 w-2.5 place-items-center rounded-[3px] border ${
                done ? 'border-[#0a63c9] bg-[#0a63c9]' : 'border-ink/25'
              }`}
            >
              {done && (
                <svg viewBox="0 0 10 10" className="h-1.5 w-1.5">
                  <path d="M2 5.4 4 7.5 8 3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={`h-1.5 rounded-full ${done ? 'w-[46%] bg-ink/20' : 'w-[62%] bg-ink/30'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* The tooling I run on my own machine. Proof that this is a daily practice
   rather than a service line. */
const MY_OWN = [
  {
    View: AgentsView,
    title: 'A control room for my agents',
    desc: 'I run several coding agents at once, so I built the place that keeps track of them: what each one is working on, what it produced, and which ones are waiting on me.',
  },
  {
    View: IslandView,
    title: 'A dynamic island for my Mac',
    desc: 'The little status strip Apple gives the iPhone, rebuilt for my desktop — what is building, what just finished, and what needs a decision, glanceable without switching windows.',
  },
  {
    View: MoveView,
    title: 'A nudge to get up and do push-ups',
    desc: 'The job is sitting down, which is bad for you, so this one interrupts it — a reminder to stand up and knock out a set. Small thing, but it is the difference between moving during the day and not.',
  },
  {
    View: TodoView,
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
            {MY_OWN.map(({ View, title, desc }) => (
              <div key={title} className="tile flex flex-col gap-4 p-7 sm:flex-row sm:items-start sm:gap-5">
                <View />
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{desc}</p>
                </div>
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
