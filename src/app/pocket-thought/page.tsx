import AppAnimation from "./_components/AppAnimation";
import BuyQuestion from "./_components/BuyQuestion";
import { CONTACT_EMAIL } from "./_lib/config";

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
    "M10 16.5V4M4.5 9.5L10 4l5.5 5.5",
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

// [kind of gadget, what that kind does, what Pocket Thought does instead, tone]
const OTHERS: [string, string, string, Tone][] = [
  [
    "Wearables",
    "Something you put on every morning.",
    "Lives on your keys. Nothing to wear.",
    "teal",
  ],
  [
    "All-day recorders",
    "Listen to meetings and conversations, often for a monthly fee.",
    "Records only while you hold a key. No subscription.",
    "amber",
  ],
  [
    "Action buttons",
    "Send your words off to an app or AI agent to get a task done.",
    "Keeps your thoughts, sorted and searchable, for you to come back to.",
    "blue",
  ],
];

const FAQ: [string, string][] = [
  [
    "Which iPhones show precision finding?",
    "iPhones with an ultra-wideband chip show distance and direction. Every iPhone gets a last-seen map and a nearer/farther meter.",
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

export default function Page() {
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

        {/* Build: the device assembling itself, silent loop at double speed */}
        <section className="px-5 pb-14 sm:pb-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Built part by part.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-[var(--muted)]">
              Every piece of the planned device, from the circuit board to the
              last screw.
            </p>
            <video
              src="/pocket-thought/film/build-loop.mp4"
              poster="/pocket-thought/film/build-loop-poster.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              width={720}
              height={1280}
              aria-label="Pocket Thought assembling itself, part by part"
              className="mx-auto mt-8 block h-auto w-full max-w-[360px] rounded-[24px] ring-1 ring-black/5"
            />
          </div>
        </section>

        {/* Others */}
        <section className="bg-[var(--panel)] px-5 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              Here’s why Pocket Thought is different.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[var(--muted)]">
              Other voice gadgets are wearables, all-day recorders or action
              buttons. Ours is a thought partner.
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {OTHERS.map(([title, theirs, ours, t]) => (
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
                  <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                    {theirs}
                  </p>
                  <p className="mt-4 border-t border-[var(--line)] pt-4 text-sm font-semibold">
                    Pocket Thought
                  </p>
                  <p className="mt-1 text-base leading-relaxed">{ours}</p>
                </li>
              ))}
            </ul>
            <div
              className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 text-center sm:p-8"
              style={tone("indigo")}
            >
              <p className="text-xl leading-snug font-semibold sm:text-2xl">
                Ours is a thought partner.
              </p>
              <p className="mt-3 text-base leading-relaxed text-[var(--ink)]">
                Not something to wear, not a recorder, not a remote control. A
                place to put a thought the moment you have it, and find it again
                when you want to look back.
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
