import ContributeBox from "./_components/ContributeBox";
import AppAnimation, { ComingSoon } from "./_components/AppAnimation";
import DeviceModel from "./_components/DeviceModel";
import EmailCapture from "./_components/EmailCapture";
import Compare from "./_components/Compare";
import { CONTACT_EMAIL, GOAL_USD } from "./_lib/config";
import { paymentSettings, raisedUsd } from "./_lib/server";

export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const BREAKDOWN = [
  ["Electronics & parts", 400],
  ["PCB prototypes", 350],
  ["Enclosure prototyping", 400],
  ["Batteries / controls / spares", 250],
  ["App / testing / assembly", 300],
  ["Contingency", 300],
] as const;

const USE_OF_FUNDS = [
  "Prototype electronics",
  "PCB design and test boards",
  "Batteries, switches, microphones, and parts",
  "Enclosure prototyping",
  "App development and testing",
  "Iteration and assembly",
];

const FAQ: [string, React.ReactNode][] = [
  [
    "What is Pocket Thought?",
    "A small, premium, distraction-free thought capture device with an aluminum body inspired by the iPod nano. Scroll the wheel to choose one of four modes (General, To-do, Ideas, Thoughts), then press and hold the center button to record and release to stop. One small light glows red only while it is recording. Recordings sync to your phone automatically, with a native iPhone app first and Android later.",
  ],
  [
    "Is this a finished product?",
    "No. This is an early-stage prototype effort. Final features may evolve, and a finished product is not guaranteed.",
  ],
  [
    "What does my contribution fund?",
    "The first prototype: electronics and parts, PCB prototypes, enclosure prototyping, batteries, controls and spares, app development, testing and assembly, plus a contingency. The full breakdown is in the funding goal above.",
  ],
  [
    "Is my contribution refundable?",
    "No. All contributions to this project are non-refundable and are used to support early prototype development.",
  ],
  [
    "Will I get a device?",
    "Original supporters will be prioritized for early prototype or early production access if development succeeds. A finished product is not guaranteed, and a contribution is not a guaranteed retail order.",
  ],
  ["When will the prototype be built?", "There is no set date yet. Timelines may change."],
  [
    "Is this an investment?",
    "No. This is not an investment opportunity and does not provide ownership or financial return. Contributions are support for development, not a purchase of equity.",
  ],
];

function Render({
  name,
  alt,
  sizes,
  wide,
  priority,
  className = "",
}: {
  name: string;
  alt: string;
  sizes: string;
  wide?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const [s, l] = wide ? [1200, 2400] : [800, 1600];
  return (
    <img
      src={`/pocket-thought/renders/${name}-${s}.webp`}
      srcSet={`/pocket-thought/renders/${name}-${s}.webp ${s}w, /pocket-thought/renders/${name}-${l}.webp ${l}w`}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`block h-auto w-full ${className}`}
    />
  );
}

function Primary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--ink)] px-7 text-base font-medium text-white transition hover:bg-black"
    >
      {children}
    </a>
  );
}

function Secondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-full px-7 text-base font-medium text-[var(--ink)] ring-1 ring-black/20 transition hover:ring-black/50"
    >
      {children}
    </a>
  );
}

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-[var(--ink)]">
      <path d="M4 10.5l3.5 3.5L16 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const thanked = (await searchParams).thanks === "1";
  const raised = await raisedUsd();
  const pct = Math.min(100, (raised / GOAL_USD) * 100);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--page)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="text-[17px] font-semibold tracking-tight">
            Pocket Thought
          </a>
          <a
            href="#support"
            className="inline-flex min-h-[36px] items-center rounded-full bg-[var(--ink)] px-4 text-sm font-medium text-white hover:bg-black"
          >
            Support
          </a>
        </div>
      </header>

      <div id="top">
        {/* 1 Hero */}
        <section className="px-5 pt-12 pb-6 text-center sm:pt-20">
          <h1 className="mx-auto max-w-4xl text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-7xl">
            Capture the thought. Keep the moment.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
            A distraction-free pocket device for recording ideas, tasks, prayers, and lessons — without pulling out your
            phone.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Primary href="#support">Support the Prototype</Primary>
            <Secondary href="#vision">See the Vision</Secondary>
          </div>
          <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-[28px]">
            <Render
              name="01-hero-front-three-quarter"
              wide
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              alt="Pocket Thought concept render: a slim brushed-aluminum device with a scroll wheel and a center record button"
            />
          </div>
        </section>

        {/* 2 The Problem */}
        <section id="vision" className="px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Phones capture thoughts — but also destroy focus.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
              The best ideas often come while walking, praying, working, or lying in bed at night. But pulling out a phone
              opens the door to distraction. Notifications, apps, messages, and mental clutter get in the way. Pocket
              Thought is built to solve that.
            </p>
          </div>
        </section>

        {/* 3 The Solution */}
        <section className="bg-[var(--panel)] px-5 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                A dedicated device for your thoughts.
              </h2>
              <ul className="mt-8 space-y-3 text-lg">
                {[
                  "Select a mode with the scroll wheel",
                  "Press and hold to record",
                  "Release to save",
                  "Sync to your phone automatically",
                  "Review everything later in a clean app",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-black/5">
                <p className="leading-relaxed">
                  <strong className="font-semibold">Privacy-first recording:</strong> Pocket Thought only records while the
                  button is physically held down. No hidden recording. No passive listening.
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-[28px]">
              <Render
                name="04-scroll-wheel-close-up"
                sizes="(min-width: 768px) 560px, 100vw"
                alt="Close-up of the scroll wheel with its four modes: General, To-do, Ideas and Thoughts"
              />
            </div>
          </div>
        </section>

        {/* 4 How it works */}
        <section className="px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-medium tracking-wide text-[var(--muted)] uppercase">How it works</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-center text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Scroll the wheel. Hold the button. Speak. Release. That’s it.
            </h2>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Scroll the wheel to a mode",
                "Hold the center button with your thumb",
                "Speak your thought",
                "Release and let it sync later",
              ].map((t, i) => (
                <li key={t} className="flex h-full flex-col rounded-3xl bg-[var(--panel)] p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold ring-1 ring-black/10">
                    {i + 1}
                  </span>
                  <span className="mt-5 text-lg leading-snug font-medium">{t}</span>
                </li>
              ))}
            </ol>
            <div className="mt-12 grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
              <div className="overflow-hidden rounded-[28px]">
                <Render
                  name="06-thumb-recording"
                  sizes="(min-width: 768px) 640px, 100vw"
                  alt="A thumb holding the center button while the small light shows red for recording"
                />
              </div>
              <ul className="flex flex-wrap gap-2 md:flex-col md:gap-3">
                {[
                  "No screen",
                  "One small light, red only while recording",
                  "No flashing",
                  "No distractions",
                  "No always-listening behavior",
                ].map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-[var(--panel)] px-4 py-2 text-base font-medium md:bg-transparent md:p-0 md:text-2xl md:tracking-tight"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-16 rounded-[28px] bg-[var(--panel)] px-0 py-10 sm:px-10 sm:py-14">
              <p className="mb-8 text-center text-sm font-medium tracking-wide text-[var(--muted)] uppercase">
                The iPhone app
              </p>
              <AppAnimation />
              <ComingSoon />
            </div>
          </div>
        </section>

        {/* 5 What makes it different */}
        <section className="bg-[var(--panel)] px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Built for intentional capture.
            </h2>
            <ul className="mx-auto mt-10 grid max-w-4xl gap-x-10 gap-y-3 text-lg sm:grid-cols-2">
              {[
                "Beautiful aluminum form factor",
                "Tactile physical controls",
                "Hold-to-record privacy",
                "Four modes: General, To-do, Ideas, Thoughts",
                "Phone sync + future integrations",
                "Focused on personal thought capture, not meetings",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <DeviceModel />
              <div className="overflow-hidden rounded-[28px]">
                <Render
                  name="05-record-button-close-up"
                  sizes="(min-width: 1152px) 568px, (min-width: 768px) 50vw, 100vw"
                  className="aspect-square object-cover"
                  alt="Close-up of the center record button inside the scroll wheel"
                />
              </div>
              <div className="overflow-hidden rounded-[28px]">
                <Render
                  name="02-side-profile"
                  sizes="(min-width: 1152px) 568px, (min-width: 768px) 50vw, 100vw"
                  className="aspect-square object-cover"
                  alt="Side profile showing the slim aluminum body"
                />
              </div>
              <div className="overflow-hidden rounded-[28px]">
                <Render
                  name="03-back"
                  sizes="(min-width: 1152px) 568px, (min-width: 768px) 50vw, 100vw"
                  className="aspect-square object-cover"
                  alt="Back of the device in brushed aluminum"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5b Comparison */}
        <Compare />

        {/* 6 Funding goal */}
        <section id="support" className="px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Help fund the first prototype.
            </h2>
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="flex items-baseline justify-between text-base">
                <span>
                  <strong className="text-2xl font-semibold">{usd(raised)}</strong>{" "}
                  <span className="text-[var(--muted)]">raised</span>
                </span>
                <span className="text-[var(--muted)]">Goal {usd(GOAL_USD)}</span>
              </div>
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--panel)] ring-1 ring-black/5"
                role="progressbar"
                aria-label="Raised towards the $2,000 goal"
                aria-valuemin={0}
                aria-valuemax={GOAL_USD}
                aria-valuenow={raised}
              >
                <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-2">
              <div>
                <table className="w-full text-base">
                  <tbody>
                    {BREAKDOWN.map(([label, amount]) => (
                      <tr key={label} className="border-b border-[var(--line)]">
                        <td className="py-3">{label}</td>
                        <td className="py-3 text-right tabular-nums">{usd(amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-3 font-semibold">Goal</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{usd(GOAL_USD)}</td>
                    </tr>
                  </tbody>
                </table>
                <h3 className="mt-8 text-sm font-medium tracking-wide text-[var(--muted)] uppercase">Use of funds</h3>
                <ul className="mt-3 grid gap-x-6 gap-y-2 text-base sm:grid-cols-2">
                  {USE_OF_FUNDS.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 overflow-hidden rounded-[28px] bg-[var(--panel)]">
                  <Render
                    name="07-exploded"
                    sizes="(min-width: 1024px) 560px, 100vw"
                    alt="Exploded concept view: center button, scroll wheel, aluminum body, circuit board, battery and back plate"
                  />
                </div>
              </div>
              <div className="order-first lg:order-none lg:sticky lg:top-20 lg:self-start">
                <ContributeBox payments={paymentSettings()} thanked={thanked} />
              </div>
            </div>
          </div>
        </section>

        {/* 7 Supporter reward */}
        <section className="bg-[var(--panel)] px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Early supporters help make the prototype real.
            </h2>
            <p className="mt-6 text-lg leading-relaxed sm:text-xl">
              Original supporters will be prioritized for early prototype or early production access if development
              succeeds.
            </p>
            <p className="mt-4 text-base text-[var(--muted)]">
              This is not an investment opportunity and does not provide ownership or financial return.
            </p>
          </div>
        </section>

        {/* 8 Important funding terms */}
        <section className="px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Important funding terms</h2>
            <p className="mt-5 text-base leading-relaxed">
              All contributions to this project are non-refundable and are used to support early prototype development.
              By contributing, you understand that:
            </p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-base leading-relaxed">
              <li>this is an early-stage prototype effort;</li>
              <li>timelines may change;</li>
              <li>final features may evolve;</li>
              <li>a finished product is not guaranteed;</li>
              <li>contributions are support for development, not a purchase of equity or a guaranteed retail order.</li>
            </ul>
          </div>
        </section>

        {/* 9 About the founder */}
        <section className="bg-[var(--panel)] px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Built by a founder who can actually make it.
            </h2>
            <p className="mt-6 text-lg leading-relaxed">
              I’m a developer with experience in software, electronics, and product building. I’m designing the hardware,
              firmware, and native app stack myself to create the first real working version of Pocket Thought.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
            <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-1">
                  <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {q}
                    <span aria-hidden className="text-2xl leading-none text-[var(--muted)] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-base leading-relaxed text-[var(--muted)]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10 Final CTA */}
        <section className="bg-[var(--panel)] px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Help bring Pocket Thought to life.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Primary href="#support">Contribute Now</Primary>
              <Secondary href={`mailto:${CONTACT_EMAIL}`}>Contact Me</Secondary>
            </div>
            <div className="mt-14">
              <EmailCapture />
            </div>
          </div>
        </section>
      </div>

      <footer className="px-5 py-10 text-center text-sm text-[var(--muted)]">Pocket Thought</footer>
    </>
  );
}
