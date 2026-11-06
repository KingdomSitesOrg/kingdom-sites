const MOMENTS = [
  ["It’s 2 a.m.", "A thought wakes you. Reach, hold, speak. No screen to light up the room."],
  ["On a walk", "Keep your hands and eyes where they are. Hold the button and say it."],
  ["In the car", "Skip the phone. Hold the button, speak, release."],
] as const;

type Product = {
  name: string;
  highlight?: boolean;
  rows: [label: string, value: string][];
};

const PRODUCTS: Product[] = [
  {
    name: "Pocket Thought",
    highlight: true,
    rows: [
      ["Recording", "Only while you hold the button"],
      ["Built for", "Personal thoughts"],
      ["Pick a category first", "Yes, with the four-mode wheel"],
      ["Shape", "Brushed aluminum pocket device"],
      ["Battery", "Rechargeable, multi-day goal"],
      ["Connections", "Apple Reminders and Notion first"],
      ["Find My", "A future goal"],
      ["Price", "$69 target, not final"],
    ],
  },
  {
    name: "Plaud NotePin S",
    rows: [
      ["Recording", "Meeting-style sessions"],
      ["Built for", "Meetings and calls"],
      ["Pick a category first", "No, sorted afterwards"],
      ["Shape", "Clip-on pin"],
      ["Battery", "About 20 hours recording, 40 days standby"],
      ["Connections", "Notion, Google Drive and more, mostly through Zapier"],
      ["Find My", "Yes"],
      ["Price", "$179, plus paid plans for more transcription"],
    ],
  },
  {
    name: "Pebble Index 01",
    rows: [
      ["Recording", "Only while you hold the button"],
      ["Built for", "Short voice notes"],
      ["Pick a category first", "No, one button"],
      ["Shape", "Ring"],
      ["Battery", "Up to 2 years, not rechargeable"],
      ["Connections", "Apple Reminders, Notion, Google Tasks"],
      ["Find My", "Not listed"],
      ["Price", "$99"],
    ],
  },
  {
    name: "Omi",
    rows: [
      ["Recording", "Can listen all day"],
      ["Built for", "Conversations through the day"],
      ["Pick a category first", "No, sorted afterwards"],
      ["Shape", "Pendant"],
      ["Battery", "10 to 14 hours claimed"],
      ["Connections", "Apple Reminders, Google Tasks, Notion"],
      ["Find My", "Not listed"],
      ["Price", "$89 to $179"],
    ],
  },
];

const LABELS = PRODUCTS[0].rows.map(([l]) => l);

const SOURCES = [
  ["Plaud", "https://www.plaud.ai/pages/plaud-notepin-s"],
  ["Pebble", "https://repebble.com/index"],
  ["Omi", "https://www.omi.me/pages/product-v3"],
] as const;

export default function Compare() {
  return (
    <section id="compare" className="px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-3xl text-center text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Not an all-day recorder.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
          Many AI recorders capture your day and summarize it for you. Pocket Thought records only the moment you hold the
          button.
        </p>

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {MOMENTS.map(([title, body]) => (
            <li key={title} className="rounded-3xl bg-[var(--panel)] p-6">
              <p className="text-xl font-semibold tracking-tight">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-[var(--muted)]">{body}</p>
            </li>
          ))}
        </ul>

        <p className="mt-16 text-center text-sm font-medium tracking-wide text-[var(--muted)] uppercase">
          How it compares
        </p>

        {/* Phone: one card per product */}
        <div className="mt-6 space-y-4 md:hidden">
          {PRODUCTS.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl p-6 ${p.highlight ? "bg-[var(--ink)] text-white" : "bg-[var(--panel)]"}`}
            >
              <p className="text-xl font-semibold tracking-tight">{p.name}</p>
              <dl className="mt-4 space-y-3 text-base">
                {p.rows.map(([label, value]) => (
                  <div key={label}>
                    <dt className={`text-sm ${p.highlight ? "text-white/60" : "text-[var(--muted)]"}`}>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Tablet and desktop: one table */}
        <div className="mt-6 hidden overflow-hidden rounded-3xl ring-1 ring-black/10 md:block">
          <table className="w-full table-fixed text-left text-base">
            <thead>
              <tr>
                <th scope="col" className="w-[16%] bg-[var(--panel)] p-4">
                  <span className="sr-only">Feature</span>
                </th>
                {PRODUCTS.map((p) => (
                  <th
                    key={p.name}
                    scope="col"
                    className={`p-4 text-lg font-semibold ${p.highlight ? "bg-[var(--ink)] text-white" : "bg-[var(--panel)]"}`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LABELS.map((label, i) => (
                <tr key={label} className="border-t border-[var(--line)] align-top">
                  <th scope="row" className="p-4 text-sm font-medium text-[var(--muted)]">
                    {label}
                  </th>
                  {PRODUCTS.map((p) => (
                    <td key={p.name} className={`p-4 leading-snug ${p.highlight ? "bg-white font-medium" : ""}`}>
                      {p.rows[i][1]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-[var(--muted)]">
          Competitor details come from each maker’s public information in November 2026 and can change. Pocket Thought is
          a prototype: its battery, connections, price and Find My support are goals, not final specifications.{" "}
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
