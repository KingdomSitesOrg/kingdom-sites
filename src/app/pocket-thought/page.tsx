import AppAnimation from "./_components/AppAnimation";
import BuyQuestion from "./_components/BuyQuestion";
import ContributeBox from "./_components/ContributeBox";
import { CONTACT_EMAIL, GOAL_USD, PRICE_USD } from "./_lib/config";
import { paymentSettings, raisedUsd } from "./_lib/server";

export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

type Tone = "teal" | "blue" | "amber" | "indigo";

const tone = (t: Tone) => ({
  color: `var(--${t})`,
  background: `var(--${t}-tint)`,
});

const KEYS: [string, Tone][] = [
  ["General", "teal"],
  ["Reminders", "blue"],
  ["Ideas", "amber"],
  ["Journal", "indigo"],
];

const FEATURES: [string, string, Tone, string][] = [
  [
    "Four keys, four places",
    "General, Reminders, Ideas and Journal. Raised dots let you find each key by feel.",
    "teal",
    "M5 4h10M5 8h10M5 12h10M5 16h10",
  ],
  [
    "Hold to record",
    "Speak while you hold a key, let go to save. The microphone only gets power while a key is held.",
    "blue",
    "M10 3a2 2 0 012 2v5a2 2 0 01-4 0V5a2 2 0 012-2zM6 10a4 4 0 008 0M10 14v3",
  ],
  [
    "Precision finding",
    "Ultra-wideband inside, so your iPhone shows the distance and direction to your Pocket Thought.",
    "indigo",
    "M10 3l2.5 7.5L10 17l-2.5-6.5zM10 10h0",
  ],
  [
    "Find your phone",
    "Press a key combination and your phone rings.",
    "amber",
    "M7 3h6a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM9 14h2",
  ],
  [
    "Works without your phone",
    "Records on its own and passes notes to your phone the next time it’s nearby.",
    "teal",
    "M4 10a6 6 0 0110.4-4M16 10a6 6 0 01-10.4 4M14 3v3h-3M6 17v-3h3",
  ],
  [
    "Private, no subscription",
    "Speech becomes text on your phone. No account, no monthly fee, no server of ours.",
    "blue",
    "M6 9V7a4 4 0 018 0v2M5 9h10v8H5z",
  ],
  [
    "Sends to your apps",
    "Reminders go to Apple Reminders. Notes are searchable and can go to Shortcuts or Todoist.",
    "amber",
    "M4 10h11M11 6l4 4-4 4",
  ],
  [
    "Lives on your keys",
    "Aluminum, 7.6 mm thin, keychain loop, months per charge (estimate), with a flashlight and camera shutter.",
    "indigo",
    "M7 7a3 3 0 106 0 3 3 0 00-6 0zM10 10v7M10 14h3M10 17h2",
  ],
];

const OTHERS: [string, string, string, Tone][] = [
  [
    "Wearables",
    "Rings and pins you put on every morning.",
    "Pebble Index 01, Sandbar Stream",
    "teal",
  ],
  [
    "All-day recorders",
    "Built to capture meetings and conversations, often with a monthly plan.",
    "Plaud NotePin, Bee",
    "amber",
  ],
  [
    "Action buttons",
    "Your words go to an app or AI agent to get a task done.",
    "Flic Cue",
    "blue",
  ],
];

const FAQ: [string, string][] = [
  [
    "Is it on sale?",
    `Not yet. The planned price is $${PRICE_USD}, one model with precision finding built in and no subscription. Prototypes are being built now; dates are targets, not promises.`,
  ],
  [
    "Which iPhones show precision finding?",
    "iPhones with an ultra-wideband chip show distance and direction. Every iPhone gets a last-seen map and a nearer/farther meter.",
  ],
  [
    "Is a contribution a pre-order?",
    "No. Support is a non-refundable gift toward building the prototypes. It is not a purchase, not a pre-order and not a stake in the business. If the prototypes succeed, supporters may receive one as a thank-you, but that is not guaranteed.",
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

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const thanked = (await searchParams).thanks === "1";
  const raised = await raisedUsd();
  const pct = Math.min(100, (raised / GOAL_USD) * 100);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--page)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <a href="#top" className="text-base font-semibold tracking-tight">
            Pocket Thought
          </a>
          <a
            href="#buy"
            className="inline-flex min-h-[36px] items-center rounded-full bg-[var(--ink)] px-4 text-sm font-medium text-white hover:bg-black"
          >
            Would you buy it?
          </a>
        </div>
      </header>

      <div id="top">
        {/* Hero */}
        <section className="bg-[linear-gradient(180deg,var(--indigo-tint)_0%,var(--page)_70%)] px-5 pt-10 pb-4 text-center sm:pt-14">
          <p className="text-sm font-medium text-[var(--indigo)]">
            A thought partner for your pocket
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl">
            Capture the thought. Keep the moment.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            Hold a key, say what’s on your mind, let go. No phone in your hand.
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {KEYS.map(([k, t]) => (
              <li
                key={k}
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={tone(t)}
              >
                {k}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#buy"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--ink)] px-7 text-base font-medium text-white hover:bg-black"
            >
              Would you buy it?
            </a>
            <a
              href="#features"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full px-7 text-base font-medium ring-1 ring-black/20 hover:ring-black/50"
            >
              See what it does
            </a>
          </div>
          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-[24px]">
            <Render
              name="01-hero-front-three-quarter"
              wide
              priority
              sizes="(min-width: 896px) 896px, 100vw"
              alt="Pocket Thought concept render: a slim aluminum device with four keys in a column"
            />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-5 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              What it does
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {FEATURES.map(([title, body, t, d]) => (
                <li key={title} className="flex gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={tone(t)}
                  >
                    <Icon d={d} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-[var(--muted)]">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center text-sm text-[var(--muted)]">
              This describes the planned device. The prototype is being built
              now.
            </p>
            <div className="mt-10 rounded-[24px] bg-[var(--panel)] py-8 sm:px-8">
              <AppAnimation />
            </div>
          </div>
        </section>

        {/* Others */}
        <section className="bg-[var(--panel)] px-5 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              Others are building voice gadgets too.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[var(--muted)]">
              Most of them are one of these three.
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {OTHERS.map(([title, body, examples, t]) => (
                <li
                  key={title}
                  className="rounded-3xl bg-white p-6 ring-1 ring-black/5"
                >
                  <span
                    className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                    style={tone(t)}
                  >
                    {title}
                  </span>
                  <p className="mt-4 text-base leading-relaxed">{body}</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    For example: {examples}
                  </p>
                </li>
              ))}
            </ul>
            <div
              className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 text-center sm:p-8"
              style={tone("indigo")}
            >
              <p className="text-xl leading-snug font-semibold sm:text-2xl">
                Pocket Thought is a thought partner.
              </p>
              <p className="mt-3 text-base leading-relaxed text-[var(--ink)]">
                Nothing to wear, nothing listening all day, nothing acting on
                your behalf. It lives on your keys, records only while you hold
                a key, and keeps your thoughts sorted and searchable on your
                phone, ready when you want to look back.
              </p>
            </div>
          </div>
        </section>

        {/* Demand question */}
        <section
          id="buy"
          className="bg-[linear-gradient(180deg,var(--page)_0%,var(--blue-tint)_100%)] px-5 py-14 sm:py-20"
        >
          <BuyQuestion />
        </section>

        {/* Support */}
        <section id="support" className="px-5 py-14 sm:py-20">
          <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Want to help build it?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
                Gifts pay for the first prototypes: parts, circuit boards and
                cases.
              </p>
              <div className="mt-6 flex items-baseline justify-between text-base">
                <span>
                  <strong className="text-2xl font-semibold">
                    {usd(raised)}
                  </strong>{" "}
                  <span className="text-[var(--muted)]">raised</span>
                </span>
                <span className="text-[var(--muted)]">
                  Goal {usd(GOAL_USD)}
                </span>
              </div>
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--panel)] ring-1 ring-black/5"
                role="progressbar"
                aria-label={`Raised towards the ${usd(GOAL_USD)} goal`}
                aria-valuemin={0}
                aria-valuemax={GOAL_USD}
                aria-valuenow={raised}
              >
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--teal),var(--blue),var(--indigo))]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
                Support is a non-refundable gift toward building the prototypes.
                It is not a purchase, not a pre-order and not a stake in the
                business. Dates are targets, features may change, and a finished
                product or thank-you unit is not guaranteed.
              </p>
            </div>
            <ContributeBox payments={paymentSettings()} thanked={thanked} />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--panel)] px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
            <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-1">
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden
                      className="text-2xl leading-none text-[var(--muted)] transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-4 text-base leading-relaxed text-[var(--muted)]">
                    {a}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-6 text-base">
              Questions or ideas?{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-[var(--blue)] underline underline-offset-4"
              >
                Email me
              </a>
              .
            </p>
          </div>
        </section>
      </div>

      <footer className="px-5 py-8 text-center text-sm text-[var(--muted)]">
        Pocket Thought
      </footer>
    </>
  );
}
