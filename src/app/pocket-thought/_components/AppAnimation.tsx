"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import s from "./AppAnimation.module.css";

type Mode = "General" | "To-do" | "Ideas" | "Thoughts";

// Clockwise order on the wheel, so each step scrolls a quarter turn.
const STEPS: { mode: Mode; length: string; text: string }[] = [
  { mode: "General", length: "0:05", text: "Remember the book Sam mentioned." },
  { mode: "To-do", length: "0:06", text: "Pick up the parts order before Friday." },
  { mode: "Thoughts", length: "0:09", text: "Grateful for a quiet walk this morning." },
  { mode: "Ideas", length: "0:12", text: "A wheel that clicks softly at each mode." },
];

const ANGLE: Record<Mode, number> = { General: 0, "To-do": 90, Thoughts: 180, Ideas: 270 };

const TINT: Record<Mode, string> = {
  General: "#6e6e73",
  "To-do": "#0a7aff",
  Ideas: "#c77700",
  Thoughts: "#5e5ce6",
};

const SELECT_MS = 900;
const RECORD_MS = 2300;
const SYNC_MS = 800;
const STEP_MS = 7000;

type Row = { id: number; mode: Mode; length: string; text: string; when: string };

const START_ROWS: Row[] = [
  { id: -1, mode: "Ideas", length: "0:08", text: "Morning walk route past the river.", when: "9:12 AM" },
  { id: -2, mode: "To-do", length: "0:04", text: "Call about the workshop booking.", when: "Yesterday" },
];

const STILL_ROWS: Row[] = [{ id: 0, ...STEPS[0], when: "Just now" }, ...START_ROWS];

type Phase = "select" | "record" | "sync" | "rest";

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export default function AppAnimation() {
  const root = useRef<HTMLDivElement>(null);
  const still = useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [angle, setAngle] = useState(0);
  const [phase, setPhase] = useState<Phase>("rest");
  const [rows, setRows] = useState<Row[]>(START_ROWS);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = false;
    const update = () => setRunning(seen && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (still || !running) return;
    const cur = STEPS[step % STEPS.length];
    const timers = [
      setTimeout(() => {
        setPhase("select");
        setAngle((a) => (step === 0 && a === 0 ? 0 : a + 90));
      }, 0),
      setTimeout(() => setPhase("record"), SELECT_MS),
      setTimeout(() => setPhase("sync"), SELECT_MS + RECORD_MS),
      setTimeout(() => {
        setPhase("rest");
        setRows((r) => [{ id: step, ...cur, when: "Just now" }, ...r.map((x) => ({ ...x, when: x.when === "Just now" ? "1 min ago" : x.when }))].slice(0, 3));
      }, SELECT_MS + RECORD_MS + SYNC_MS),
      setTimeout(() => setStep((n) => n + 1), STEP_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [running, still, step]);

  const mode = STEPS[step % STEPS.length].mode;
  const shownMode = still ? STEPS[0].mode : mode;
  const recording = !still && phase === "record";
  const syncing = !still && phase === "sync";

  return (
    <div ref={root} className={s.stage} data-still={still || undefined}>
      <p className="sr-only">
        Animation: the device records a thought in one of its four modes, and the recording appears in the Pocket Thought
        iPhone app under that mode.
      </p>
      <div className={s.pair} aria-hidden>
        <Device angle={still ? ANGLE[shownMode] : angle} mode={shownMode} recording={recording} />
        <div className={s.link} data-on={syncing || undefined}>
          <span />
        </div>
        <Phone rows={still ? STILL_ROWS : rows} />
      </div>
    </div>
  );
}

function Device({ angle, mode, recording }: { angle: number; mode: Mode; recording: boolean }) {
  const labels: [Mode, number, number, string][] = [
    ["General", 50, 147.5, "GENERAL"],
    ["To-do", 73, 170.3, "TO-DO"],
    ["Thoughts", 50, 193, "THOUGHTS"],
    ["Ideas", 27, 170.3, "IDEAS"],
  ];
  return (
    <svg viewBox="0 0 100 225" className={s.device} role="presentation">
      <defs>
        <linearGradient id="pt-alu" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#c9ccd0" />
          <stop offset="0.18" stopColor="#e4e6e8" />
          <stop offset="0.55" stopColor="#d3d6d9" />
          <stop offset="0.85" stopColor="#e9ebed" />
          <stop offset="1" stopColor="#bfc2c6" />
        </linearGradient>
        <radialGradient id="pt-ring" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f1f2f3" />
          <stop offset="1" stopColor="#dcdfe2" />
        </radialGradient>
        <radialGradient id="pt-led" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff3b2f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff3b2f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="98" height="223" rx="14" fill="url(#pt-alu)" stroke="#b3b6ba" strokeWidth="0.8" />
      <circle cx="50" cy="9" r="1" fill="#8d9195" />
      <circle cx="50" cy="22" r="7" fill="url(#pt-led)" className={s.ledGlow} data-on={recording || undefined} />
      <circle cx="50" cy="22" r="2" className={s.led} data-on={recording || undefined} />
      <circle cx="50" cy="170" r="34" fill="url(#pt-ring)" stroke="#c3c6ca" strokeWidth="0.8" />
      <g className={s.pointer} style={{ transform: `rotate(${angle}deg)` }}>
        <circle cx="50" cy="139.5" r="1.6" fill="#1d1d1f" />
      </g>
      {labels.map(([m, x, y, t]) => (
        <text
          key={m}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className={s.label}
          data-on={m === mode || undefined}
        >
          {t}
        </text>
      ))}
      <g className={s.button} data-on={recording || undefined}>
        <circle cx="50" cy="170" r="12.5" fill="#d9dcdf" stroke="#b9bcc0" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function ModeIcon({ mode }: { mode: Mode }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 16 16" className={s.modeIcon}>
      {mode === "General" && <path d="M3 8h1.5M6 5v6M8.5 3v10M11 6v4M13 8h0" {...p} />}
      {mode === "To-do" && <path d="M3.5 8.5l3 3 6-7" {...p} />}
      {mode === "Ideas" && <path d="M6 13h4M6.5 10.5c-1.5-1-2.5-2.3-2.5-4a4 4 0 018 0c0 1.7-1 3-2.5 4z" {...p} />}
      {mode === "Thoughts" && <path d="M3 5.5a2.5 2.5 0 012.5-2.5h5A2.5 2.5 0 0113 5.5v2.5a2.5 2.5 0 01-2.5 2.5H7l-3 2.5v-2.8A2.5 2.5 0 013 8z" {...p} />}
    </svg>
  );
}

function Phone({ rows }: { rows: Row[] }) {
  return (
    <div className={s.phone}>
      <div className={s.screen}>
        <div className={s.status}>
          <span>9:41</span>
          <span className={s.island} />
          <span className={s.battery} />
        </div>
        <div className={s.title}>Pocket Thought</div>
        <div className={s.synced}>
          <span className={s.dot} />
          <span>
            <b>Connected</b>
            <br />
            Syncs automatically while the app is on
          </span>
        </div>
        <div className={s.list}>
          {rows.map((r) => (
            <div key={r.id} className={s.row} data-new={r.when === "Just now" || undefined}>
              <div className={s.rowTop}>
                <span className={s.chip} style={{ color: TINT[r.mode] }}>
                  <ModeIcon mode={r.mode} />
                  {r.mode}
                </span>
                <span className={s.meta}>
                  {r.length} · {r.when}
                </span>
              </div>
              <div className={s.text}>{r.text}</div>
            </div>
          ))}
        </div>
        <div className={s.soon}>
          <div className={s.soonHead}>
            <span>Send to</span>
            <span className={s.badge}>Coming soon</span>
          </div>
          <div className={s.soonRow}>
            <span style={{ color: TINT["To-do"] }}>To-do</span>
            <span className={s.arrow}>→</span>
            <span>Reminders</span>
          </div>
          <div className={s.soonRow}>
            <span style={{ color: TINT.Ideas }}>Ideas</span>
            <span className={s.arrow}>→</span>
            <span>Notes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DESTINATIONS: { name: string; icon: React.ReactNode }[] = [
  { name: "Apple Notes", icon: <path d="M4 2.5h8v11H4zM6 5.5h4M6 8h4M6 10.5h2.5" /> },
  { name: "Reminders", icon: <path d="M3 4.5h.5M3 8h.5M3 11.5h.5M6 4.5h7M6 8h7M6 11.5h7" /> },
  { name: "Google Keep", icon: <path d="M6 13h4M6.5 10.5c-1.5-1-2.5-2.3-2.5-4a4 4 0 018 0c0 1.7-1 3-2.5 4z" /> },
  { name: "Google Tasks", icon: <path d="M2.5 8a5.5 5.5 0 1011 0 5.5 5.5 0 00-11 0zM5.5 8.3l1.8 1.8 3.4-3.8" /> },
  { name: "Google Calendar", icon: <path d="M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2.5v3M10.5 2.5v3" /> },
  { name: "Google Docs", icon: <path d="M4 2.5h5.5L12 5v8.5H4zM9.5 2.5V5H12M6 8h4M6 10.5h4" /> },
];

export function ComingSoon() {
  return (
    <div className="mt-10 px-4 text-center">
      <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase ring-1 ring-black/10">
        Coming soon
      </span>
      <ul className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Coming soon">
        {DESTINATIONS.map((d) => (
          <li
            key={d.name}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--muted)] ring-1 ring-black/10"
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
  );
}
