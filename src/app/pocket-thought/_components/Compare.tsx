// Facts from research/competitors.md (T-489, 7 Nov 2026), section 4. Items it marks "not verified" are left as "—".

const DIFFERENT: [string, string][] = [
  [
    "Four keys, four places.",
    "Press and hold General, To-do, Ideas or Journal, speak, and let go. The note is filed the moment you record it. You can rename each key in the app.",
  ],
  [
    "No subscription to transcribe.",
    "Your phone turns speech into text on the phone itself, so there is no monthly fee for transcription and your recordings are not sent to our servers.",
  ],
  [
    "The microphone only works while you hold a key.",
    "It is designed so the key itself switches the microphone on. Let go and it is off.",
  ],
  [
    "Your phone can stay in your pocket.",
    "Pocket Thought records on its own, even offline, and passes notes to your phone the next time it is nearby.",
  ],
  [
    "Sends notes where they belong.",
    "To-dos can go to Apple Reminders, and notes to Notion and other apps you choose.",
  ],
  [
    "Find it from the app.",
    "See where your phone last saw it, follow a nearer/farther meter, and on the newest iPhones see the distance and direction.",
  ],
  [
    "A battery measured in months, not hours.",
    "Rechargeable over USB-C. Our early estimate is months between charges with light daily use. We’ll publish real numbers once the first boards are tested.",
  ],
  [
    "$99, the planned price.",
    "With no subscription for the basics. It is not on sale yet, and supporting the prototype is not a pre-order.",
  ],
];

const PRODUCTS = ["Pocket Thought", "Pebble Index 01", "Plaud NotePin S", "Bee Frontier", "Voice Memos on iPhone"];

const ROWS: [string, string[]][] = [
  ["Price", ["$99 (planned)", "$99", "$179", "$74.99", "Free"]],
  [
    "Subscription to keep transcribing",
    ["None (planned)", "None", "300 free minutes a month; Pro $99.99 a year", "Pro $11.99 a month for full features", "None"],
  ],
  ["Where speech becomes text", ["On your phone", "On your phone", "Cloud", "Cloud", "On your phone"]],
  ["Records with the phone away", ["Yes", "Yes (5-minute notes)", "Yes", "—", "It is the phone"]],
  ["Category buttons", ["4 keys, renamable", "No (1 button)", "No (1 button)", "No", "No (folders)"]],
  [
    "Battery",
    [
      "Rechargeable; months of light use (estimate, not yet measured)",
      "Not rechargeable; about 12–15 hours of recording in its life",
      "20 hours of recording",
      "7 days",
      "Your phone’s",
    ],
  ],
  [
    "Find a lost one",
    [
      "In the app: last-seen map, nearer/farther meter; distance and direction on the newest iPhones",
      "—",
      "Yes",
      "—",
      "Your phone’s",
    ],
  ],
  [
    "Records only when you press",
    ["Yes; the key powers the microphone", "Yes", "Yes (press to start and stop)", "Press to start a session", "Yes"],
  ],
  ["Available", ["Prototype", "Shipping", "On sale", "On sale", "Built in"]],
];

const SOURCES = [
  ["Pebble", "https://repebble.com/index"],
  ["Plaud", "https://www.plaud.ai/blogs/articles/plaud-notepin-vs-plaud-notepin-s"],
  ["Bee", "https://www.engadget.com/2287245/bee-frontier-bee-eclipse-bee-pro-launch/"],
  ["Apple", "https://support.apple.com/guide/voice-memos/vm4a03609f0d"],
] as const;

function Planned() {
  return (
    <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase ring-1 ring-black/10">
      Planned
    </span>
  );
}

function Tick() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-[var(--ink)]">
      <path d="M4 10.5l3.5 3.5L16 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Compare() {
  return (
    <section id="different" className="px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-3xl text-center text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          How Pocket Thought is different
        </h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENT.map(([title, body]) => (
            <li key={title} className="rounded-3xl bg-[var(--panel)] p-6">
              <p className="text-lg leading-snug font-semibold tracking-tight">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-[var(--muted)]">{body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Pocket Thought is a prototype; the figures on this page are plans and estimates.
        </p>

        <p className="mt-16 text-center text-sm font-medium tracking-wide text-[var(--muted)] uppercase">
          How it compares
        </p>

        {/* Phone: one card per product */}
        <div className="mt-6 space-y-4 md:hidden">
          {PRODUCTS.map((name, p) => (
            <div key={name} className={`rounded-3xl p-6 ${p === 0 ? "bg-[var(--ink)] text-white" : "bg-[var(--panel)]"}`}>
              <p className="text-xl font-semibold tracking-tight">{name}</p>
              <dl className="mt-4 space-y-3 text-base">
                {ROWS.map(([label, values]) => (
                  <div key={label}>
                    <dt className={`text-sm ${p === 0 ? "text-white/60" : "text-[var(--muted)]"}`}>{label}</dt>
                    <dd>{values[p]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Tablet and desktop: one table */}
        <div className="mt-6 hidden overflow-hidden rounded-3xl ring-1 ring-black/10 md:block">
          <table className="w-full table-fixed text-left text-[15px]">
            <thead>
              <tr>
                <th scope="col" className="w-[15%] bg-[var(--panel)] p-4">
                  <span className="sr-only">Feature</span>
                </th>
                {PRODUCTS.map((name, p) => (
                  <th
                    key={name}
                    scope="col"
                    className={`p-4 text-base font-semibold ${p === 0 ? "bg-[var(--ink)] text-white" : "bg-[var(--panel)]"}`}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, values]) => (
                <tr key={label} className="border-t border-[var(--line)] align-top">
                  <th scope="row" className="p-4 text-sm font-medium text-[var(--muted)]">
                    {label}
                  </th>
                  {values.map((v, p) => (
                    <td key={PRODUCTS[p]} className={`p-4 leading-snug ${p === 0 ? "bg-white font-medium" : ""}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-[var(--muted)]">
          Compared with devices on sale in November 2026. Prices from each maker’s site or major retailers that month, and
          they can change. Pocket Thought figures are plans and estimates for a prototype. “—” means the maker doesn’t list
          it, or we couldn’t confirm it. Sources:{" "}
          {SOURCES.map(([name, href], i) => (
            <span key={name}>
              <a href={href} className="underline underline-offset-2 hover:text-[var(--ink)]" rel="noreferrer">
                {name}
              </a>
              {i < SOURCES.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

const APPS: { name: string; icon: React.ReactNode }[] = [
  { name: "Apple Reminders", icon: <path d="M3 4.5h.5M3 8h.5M3 11.5h.5M6 4.5h7M6 8h7M6 11.5h7" /> },
  { name: "Notion", icon: <path d="M3.5 2.5h9v11h-9zM6 5.5v5M6 5.5l4 5M10 5.5v5" /> },
  { name: "Todoist", icon: <path d="M2.5 8a5.5 5.5 0 1011 0 5.5 5.5 0 00-11 0zM5.5 8.3l1.8 1.8 3.4-3.8" /> },
  { name: "Apple Notes, via Shortcuts", icon: <path d="M4 2.5h8v11H4zM6 5.5h4M6 8h4M6 10.5h2.5" /> },
  { name: "Shortcuts", icon: <path d="M5 3l6 0 2 2v6l-2 2H5l-2-2V5zM6 8h4" /> },
  { name: "Share sheet", icon: <path d="M8 2.5v7M5.5 5L8 2.5 10.5 5M4 7.5v6h8v-6" /> },
];

export function WorksWith() {
  return (
    <section id="apps" className="bg-[var(--panel)] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Planned />
        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Works with the apps you already use
        </h2>
        <ul className="mx-auto mt-10 max-w-xl space-y-3 text-left text-lg">
          {[
            "Your to-dos go to Apple Reminders automatically.",
            "Your notes go to Notion or Todoist.",
            "Anything else, Apple Notes included, through Shortcuts or the share sheet.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <Tick />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Planned">
          {APPS.map((d) => (
            <li
              key={d.name}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[var(--muted)] ring-1 ring-black/10"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {d.icon}
              </svg>
              {d.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PrivateByDesign() {
  return (
    <section id="private" className="px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Planned />
        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">Private by design</h2>
        <ul className="mx-auto mt-10 max-w-xl space-y-3 text-left text-lg">
          {[
            "Speech becomes text on your phone, with NVIDIA’s Parakeet speech model.",
            "If your phone can’t run it, Apple’s on-device speech recognition takes over.",
            "On iPhones with Apple Intelligence, the phone itself writes a title for each note and finds your to-dos.",
            "Nothing goes to a server unless you choose to send it.",
            "The microphone only gets power while a key is held.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <Tick />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-[var(--muted)]">The app is being built; these are planned features.</p>
      </div>
    </section>
  );
}
