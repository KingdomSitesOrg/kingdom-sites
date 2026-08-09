import type { Metadata } from 'next'
import Link from 'next/link'
import EvenGrid from '@/components/EvenGrid'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import {
 AI_PACKAGE,
 AI_PRICE_LABEL,
 ENTRY_PRICE_LABEL,
} from '@/lib/partnership'

export const metadata: Metadata = {
 title: 'AI package — tooling and implementation',
 description:
  'Optional AI package for real products and workflows: free one-time consult (about 1–2 hours), then $199/month if you want ongoing work. You pay your own model and API costs. Works with product ownership retainers.',
 alternates: { canonical: '/ai-tooling' },
 openGraph: {
  title: 'AI package — tooling and implementation',
  description:
   'Free one-time AI consult, optional $199/month package. AI wired into real products and workflows — not demos. Client pays model and API costs.',
  url: 'https://kingdom-sites.com/ai-tooling',
  siteName: 'Kingdom Sites',
  locale: 'en_US',
  type: 'website',
 },
}

/* Small CSS-drawn views — no image files, no icon font: each one is a handful
  of divs shaped to suggest the thing it stands for. */

const FRAME = 'relative h-14 w-[86px] shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2 p-1.5'

/* An inbox with one message handled and a reply drafted underneath. */
function EmailView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <div className="flex h-full flex-col justify-between">
    {['w-[72%] bg-[#0a63c9]', 'w-[54%] bg-ink/25', 'w-[64%] bg-ink/25'].map((bar, i) => (
     <div key={i} className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-[2px] border ${i === 0 ? 'border-[#0a63c9] bg-[#0a63c9]' : 'border-ink/25'}`} />
      <span className={`h-1.5 rounded-full ${bar}`} />
     </div>
    ))}
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

/* Numbers pulled together into the same report every week. */
function ReportView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <div className="flex h-full items-end gap-1.5">
    {['h-[38%]', 'h-[62%]', 'h-[48%]', 'h-full'].map((h, i) => (
     <span
      key={i}
      className={`w-full rounded-sm ${h} ${i === 3 ? 'bg-[#0a63c9]' : 'bg-ink/20'}`}
     />
    ))}
   </div>
  </div>
 )
}

/* A page of copy being written, with the headline settled. */
function ContentView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <div className="flex h-full flex-col justify-center gap-1.5">
    <span className="h-2 w-[64%] rounded-full bg-[#0a63c9]" />
    <span className="h-1.5 w-full rounded-full bg-ink/20" />
    <span className="h-1.5 w-[86%] rounded-full bg-ink/20" />
    <span className="h-1.5 w-[42%] rounded-full bg-ink/15" />
   </div>
  </div>
 )
}

/* A markdown file: a heading and the rules underneath it. */
function MarkdownView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <div className="flex h-full flex-col gap-1.5">
    <span className="flex items-center gap-1">
     <span className="text-[8px] font-bold leading-none text-[#0a63c9]">#</span>
     <span className="h-1.5 w-[52%] rounded-full bg-[#0a63c9]" />
    </span>
    <span className="h-1 w-full rounded-full bg-ink/20" />
    <span className="h-1 w-[88%] rounded-full bg-ink/20" />
    <span className="h-1 w-[70%] rounded-full bg-ink/15" />
    <span className="h-1 w-[80%] rounded-full bg-ink/15" />
   </div>
  </div>
 )
}

/* Rows of running agents, one of them waiting on me. */
function AgentsView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <div className="flex h-full flex-col justify-between">
    {['w-[70%] bg-[#0a63c9]', 'w-[46%] bg-ink/25', 'w-[58%] bg-ink/25'].map((bar, i) => (
     <div key={i} className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#0a63c9]' : 'bg-ink/20'}`} />
      <span className={`h-1.5 rounded-full ${bar}`} />
     </div>
    ))}
   </div>
  </div>
 )
}

/* A model wired to two systems it can actually act on. */
function ToolsView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <svg viewBox="0 0 74 44" className="h-full w-full">
    <circle cx="16" cy="22" r="7" fill="#0a63c9" fillOpacity="0.15" stroke="#0a63c9" strokeWidth="1.5" />
    <path d="M23 22h14M37 22V10h12M37 22v12h12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/25" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="49" y="5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/30" />
    <rect x="49" y="29" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/30" />
   </svg>
  </div>
 )
}

/* The same job, running again on its own. */
function LoopView() {
 return (
  <div className={FRAME} aria-hidden="true">
   <svg viewBox="0 0 44 44" className="mx-auto h-full">
    <path
     d="M33 16a13 13 0 1 0 1.6 10"
     fill="none"
     stroke="#0a63c9"
     strokeWidth="2.4"
     strokeLinecap="round"
    />
    <path d="M33 6.5V16h-9.5" fill="none" stroke="#0a63c9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
   </svg>
  </div>
 )
}

/* For business owners and anyone with a full week. No code involved. */
const EVERYDAY = [
 {
  View: EmailView,
  title: 'Your inbox, handled',
  desc: 'Mail sorted, summarised, and replies drafted in your own voice — you read the short version and approve anything that goes out.',
 },
 {
  View: TodoView,
  title: 'To-dos that catch themselves',
  desc: 'Calls, notes, and passing comments turned into a real task list, kept up to date, so follow-ups stop falling through the cracks.',
 },
 {
  View: ReportView,
  title: 'The weekly admin, done for you',
  desc: 'Spreadsheets read, numbers pulled together, and the same report or update produced the same way every week without you rebuilding it.',
 },
 {
  View: ContentView,
  title: 'Marketing, content, and research',
  desc: 'Campaigns, landing pages, and research drawn from your own brand and past results — first drafts you can actually use, not generic filler.',
 },
]

/* For people who ship software. This is the deeper end. */
const SOFTWARE = [
 {
  View: MarkdownView,
  title: 'Instruction files in your repository',
  desc: 'Plain markdown files (.md) that tell an AI assistant how your codebase works, the conventions, and what never to touch. Scattered knowledge becomes something every developer and every agent reads the same way.',
 },
 {
  View: AgentsView,
  title: 'Skills: your procedures, packaged',
  desc: 'The multi-step jobs your team does the same way every time — a release, a review, a new project — written down once so anyone, or any agent, runs them properly on the first try.',
 },
 {
  View: ToolsView,
  title: 'Custom tools, so the model can act',
  desc: 'A model that can only talk is a chat box. Wired to your own systems — the database, the ticket tracker, the deploy — it does the task instead of describing it. That wiring is where the value is.',
 },
 {
  View: LoopView,
  title: 'Loops that run without being asked',
  desc: 'An agent on a schedule or a trigger: sweeping the ticket queue overnight, watching a deploy, keeping a long job moving. Describe the job once and it runs on its own from then on.',
 },
]

/* Honest limits, stated up front — the part most AI pitches leave out. */
const HONEST = [
 'It will not replace your developers, and I will not pretend otherwise.',
 'Anything irreversible stays behind a person confirming it.',
 'If a job is better done by ordinary software, I will tell you that instead.',
 'You keep everything I set up, and I show you how it works rather than keeping it to myself.',
 AI_PACKAGE.apiNote,
]

export default function AiTooling() {
 return (
  <div className="w-full overflow-x-hidden">
   {/* Hero */}
   <section className="hero-wash px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
    <div className="mx-auto max-w-3xl text-center">
     <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
      AI that does the work, <span className="text-accent">not just the talking.</span>
     </h1>
     <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
      {AI_PACKAGE.promise} This is the second core capability of Kingdom Sites — and it pairs
      with product ownership retainers when AI is part of the product or how you operate.
     </p>
     <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
      <Link href="/pricing" className="btn-ghost">
       Product ownership on the home page
      </Link>
     </div>
    </div>
   </section>

   {/* Offer — free consult + package */}
   <section aria-label="AI package offer" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-6xl">
     <div className="max-w-2xl">
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
       Free consult. Optional package.
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
       Start with a free, one-time conversation. Continue only if ongoing AI work is worth it
       for your situation — including as an add-on on any ownership tier.
      </p>
     </div>

     <EvenGrid surface="ai-package-offer" maxCols={2} className="mt-12">
      <div className="tile-elevated flex flex-col p-7 sm:p-9">
       <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">Start here</p>
       <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        Free one-time consult
       </h3>
       <p className="mt-1 text-sm font-medium text-muted">About 1–2 hours · no charge</p>
       <p className="mt-4 flex-1 text-[15px] leading-relaxed text-body">
        {AI_PACKAGE.freeConsult} We look at your product or workflows and decide what is
        worth building — or whether ordinary software is the better answer.
       </p>
       <Link href={INQUIRE_PATH} className="btn-primary mt-7 w-full sm:w-auto">{INQUIRE_CTA}</Link>
      </div>

      <div className="tile-elevated flex flex-col border-2 border-accent p-7 sm:p-9">
       <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">
        If you want ongoing work
       </p>
       <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        {AI_PACKAGE.name}
       </h3>
       <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
        {AI_PRICE_LABEL}
        <span className="text-base font-medium text-muted">/month</span>
       </p>
       <p className="mt-4 flex-1 text-[15px] leading-relaxed text-body">
        Optional on any product ownership tier. Implementation and tooling wired into real
        products and workflows — not demos.
       </p>
       <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
        {AI_PACKAGE.features.map((f) => (
         <li key={f} className="flex gap-3 text-sm leading-relaxed text-body">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>{f}</span>
         </li>
        ))}
       </ul>
       <p className="mt-5 text-[13px] leading-relaxed text-muted">
        <span className="text-accent">*</span> {AI_PACKAGE.apiNote}
       </p>
      </div>
     </EvenGrid>

     <p className="mt-8 max-w-2xl text-sm leading-relaxed text-body">
      Main business is product ownership (from {ENTRY_PRICE_LABEL}/month). AI is optional on
      top — or a focused conversation if you only need help leveraging AI right now.{' '}
      <Link href="/software" className="link-accent">
       How product ownership works <span aria-hidden="true">›</span>
      </Link>
     </p>
    </div>
   </section>

   {/* One: everyday productivity */}
   <section aria-label="AI for your everyday work" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-6xl">
     <div className="max-w-2xl">
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
       AI for your everyday work.
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
       For founders and operators with a full week. No code required — we sit down with the
       work you actually do and get AI carrying a real part of it.
      </p>
     </div>

     <EvenGrid surface="ai-everyday" maxCols={2} className="mt-10">
      {EVERYDAY.map(({ View, title, desc }) => (
       <div key={title} className="tile flex flex-col gap-4 p-7 sm:flex-row sm:items-start sm:gap-5">
        <View />
        <div>
         <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
         <p className="mt-2 text-sm leading-relaxed text-body">{desc}</p>
        </div>
       </div>
      ))}
     </EvenGrid>
    </div>
   </section>

   {/* Two: software / product */}
   <section aria-label="AI in products and engineering" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
    <div className="mx-auto max-w-6xl">
     <div className="max-w-2xl">
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
       AI in products and engineering teams.
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-body sm:text-base">
       The deeper end, and where most of my own time goes: instruction files, packaged
       procedures, custom tools, and agents that carry real work in your repository or product.
       You keep all of it — it lives in your codebase, not in an account I control.
      </p>
     </div>

     <EvenGrid surface="ai-software" maxCols={2} className="mt-10">
      {SOFTWARE.map(({ View, title, desc }) => (
       <div key={title} className="tile flex flex-col gap-4 p-7 sm:flex-row sm:items-start sm:gap-5">
        <View />
        <div>
         <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
         <p className="mt-2 text-sm leading-relaxed text-body">{desc}</p>
        </div>
       </div>
      ))}
     </EvenGrid>

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
      Start with the free consult — <span className="text-accent">or ownership first.</span>
     </h2>
     <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
      {AI_PACKAGE.freeConsult} If you need a product owner who ships features every month,
      that is the main offer — AI is optional on any tier.
     </p>
     <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
      <Link href="/pricing" className="btn-ghost">
       See ownership retainers
      </Link>
     </div>
     <p className="mt-4 text-sm text-muted">
      <Link href={INQUIRE_PATH} className="link-accent font-medium">{INQUIRE_CTA}</Link>
     </p>
     <p className="mx-auto mt-8 max-w-xl text-[13px] leading-relaxed text-muted">
      <span className="text-accent">*</span> {AI_PACKAGE.apiNote} Package is{' '}
      {AI_PRICE_LABEL}/month for my work.
     </p>
    </div>
   </section>
  </div>
 )
}
