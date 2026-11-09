"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import s from "./AppAnimation.module.css";

type Mode = "General" | "Reminders" | "Ideas" | "Journal";

// One key per category, top to bottom; each step holds the next key.
const STEPS: { mode: Mode; length: string; text: string }[] = [
  { mode: "General", length: "0:05", text: "Remember the book Sam mentioned." },
  { mode: "Reminders", length: "0:06", text: "Pick up the parts order before Friday." },
  { mode: "Ideas", length: "0:12", text: "A pocket field guide for birdwatchers." },
  { mode: "Journal", length: "0:09", text: "Grateful for a quiet walk this morning." },
];

const MODES: Mode[] = ["General", "Reminders", "Ideas", "Journal"];

const TINT: Record<Mode, string> = {
  General: "#0b8577",
  Reminders: "#0a66d6",
  Ideas: "#c77700",
  Journal: "#5e5ce6",
};

const SELECT_MS = 900;
const RECORD_MS = 2300;
const SYNC_MS = 800;
const STEP_MS = 7000;

type Row = { id: number; mode: Mode; length: string; text: string; when: string };

const START_ROWS: Row[] = [
  { id: -1, mode: "Ideas", length: "0:08", text: "Morning walk route past the river.", when: "9:12 AM" },
  { id: -2, mode: "Reminders", length: "0:04", text: "Call about the workshop booking.", when: "Yesterday" },
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
      setTimeout(() => setPhase("select"), 0),
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
        Animation: a key on the device is held to record a thought into its category, and the recording appears in the
        Pocket Thought iPhone app under that category.
      </p>
      <div className={s.pair} aria-hidden>
        <Device mode={shownMode} recording={recording} />
        <div className={s.link} data-on={syncing || undefined}>
          <span />
        </div>
        <Phone rows={still ? STILL_ROWS : rows} />
      </div>
    </div>
  );
}

// Case v2: 38 x 90 mm, four 12 x 9 mm keys on an 11 mm pitch, 1-4 raised dots, a lighter radio window at the top.
// 1 mm = 100/38 units; the labels sit outside the body because the keys carry dots, not words.
const MM = 100 / 38;
const BODY_X = 58;
const KEY_Y = [16.5, 5.5, -5.5, -16.5].map((y) => 118.4 - y * MM);

function Device({ mode, recording }: { mode: Mode; recording: boolean }) {
  const kw = 12 * MM;
  const kh = 9 * MM;
  const cx = BODY_X + 50;
  return (
    <svg viewBox="0 0 160 237" className={s.device} role="presentation">
      <defs>
        <linearGradient id="pt-alu" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#c9ccd0" />
          <stop offset="0.18" stopColor="#e4e6e8" />
          <stop offset="0.55" stopColor="#d3d6d9" />
          <stop offset="0.85" stopColor="#e9ebed" />
          <stop offset="1" stopColor="#bfc2c6" />
        </linearGradient>
        <clipPath id="pt-body">
          <rect x={BODY_X + 1} y="1" width="98" height="235" rx={6 * MM} />
        </clipPath>
      </defs>
      <rect x={BODY_X + 1} y="1" width="98" height="235" rx={6 * MM} fill="url(#pt-alu)" />
      <rect x={BODY_X} y="0" width="100" height={12 * MM} fill="#ecece8" clipPath="url(#pt-body)" />
      <line x1={BODY_X + 1} x2={BODY_X + 99} y1={12 * MM} y2={12 * MM} stroke="#c4c6c9" strokeWidth="0.6" />
      <rect x={BODY_X + 1} y="1" width="98" height="235" rx={6 * MM} fill="none" stroke="#b3b6ba" strokeWidth="0.8" />
      {MODES.map((m, i) => {
        const on = recording && m === mode;
        const y = KEY_Y[i];
        return (
          <g key={m}>
            <rect x={cx - kw / 2 - 1} y={y - kh / 2 - 1} width={kw + 2} height={kh + 2} rx={2.6 * MM} fill="#a9adb2" opacity="0.55" />
            <g className={s.key} data-on={on || undefined} style={{ transformOrigin: `${cx}px ${y}px` }}>
              <rect x={cx - kw / 2} y={y - kh / 2} width={kw} height={kh} rx={2 * MM} fill="#e3e5e8" stroke="#bfc2c6" strokeWidth="0.6" />
              {Array.from({ length: i + 1 }, (_, d) => (
                <circle key={d} cx={cx + (d - i / 2) * 4.2} cy={y} r="1.15" fill="#b4b8bd" />
              ))}
            </g>
            <text x="51" y={y} textAnchor="end" dominantBaseline="middle" className={s.label} data-on={m === mode || undefined}>
              {m}
            </text>
            <g className={s.wave} data-on={on || undefined} transform={`translate(2 ${y})`}>
              {[0, 1, 2, 3].map((k) => (
                <rect key={k} x={k * 3} y="-3.5" width="1.6" height="7" rx="0.8" style={{ animationDelay: `${k * 110}ms` }} />
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function ModeIcon({ mode }: { mode: Mode }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 16 16" className={s.modeIcon}>
      {mode === "General" && <path d="M3 8h1.5M6 5v6M8.5 3v10M11 6v4M13 8h0" {...p} />}
      {mode === "Reminders" && <path d="M3.5 8.5l3 3 6-7" {...p} />}
      {mode === "Ideas" && <path d="M6 13h4M6.5 10.5c-1.5-1-2.5-2.3-2.5-4a4 4 0 018 0c0 1.7-1 3-2.5 4z" {...p} />}
      {mode === "Journal" && <path d="M4 2.5h7.5a1 1 0 011 1v10H5a1 1 0 01-1-1zM4 12.5a1 1 0 011-1h7.5M6.5 5.5h3.5" {...p} />}
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
            Syncs when nearby, while the app is on
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
            <span className={s.badge}>Planned</span>
          </div>
          <div className={s.soonRow}>
            <span style={{ color: TINT.Reminders }}>Reminders</span>
            <span className={s.arrow}>→</span>
            <span>Apple Reminders</span>
          </div>
          <div className={s.soonRow}>
            <span style={{ color: TINT.Ideas }}>Ideas</span>
            <span className={s.arrow}>→</span>
            <span>Notion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
