// Scene s02 (version 2): Stiff AI email. "Your team has more work than hours.
// And to most people, AI just writes stiff, buzzword-filled emails."
//
// First half: one day's calendar fills with overlapping meetings faster and
// faster until, on "hours", the last ones spill past 5 PM and out of the card,
// and a chip says how much is booked against the 8-hour day. Second half: an
// empty email arrives; on "AI" a grey "Written by AI" chip pops on and the
// draft types itself, stiff as a board; on "buzzword-filled" every buzzword
// gets a highlighter swipe and the count ticks up in the footer.
//
// Local, 0-based frames. Sounds: video/timeline/cues-v2/s02.json.

import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { Caret, clamp, pop, sceneT, t01, wordAt } from "../kit.tsx";
import { Card, Icon, T } from "../ui.tsx";

const ID = "s02";
const LEN = sceneT(ID).length; // 255

// ---------------------------------------------------------------- the beats

const W_HOURS = wordAt(ID, "hours."); // 67
const W_AND = wordAt(ID, "And"); // 95
const W_AI = wordAt(ID, "AI"); // 136
const W_BUZZ = wordAt(ID, "buzzword-filled"); // 182

const CAL_OUT = W_AND; // the calendar clears
const MAIL_IN = W_AND + 12; // the empty email arrives
const SUBJ0 = W_AI + 3; // the subject starts typing
const OUT = LEN - 11; // everything clears

// ---------------------------------------------------------------- icons not in icons.ts (Phosphor, MIT)

const CAL_ICON =
  "M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z";
const CARET_L = "M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z";
const CARET_R = "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z";
const ROBOT =
  "M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-24,16v24H116V152ZM80,164a12,12,0,0,1,12-12h8v24H92A12,12,0,0,1,80,164Zm84,12h-8V152h8a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z";
const WARNING =
  "M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z";

function PathIcon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      <path d={d} fill={color} />
    </svg>
  );
}

// ---------------------------------------------------------------- the calendar

type Tone = "teal" | "rasp" | "butter" | "plum";
const TONES: Record<Tone, { bg: string; bar: string; ink: string }> = {
  teal: { bg: "#E3F5F4", bar: T.a2, ink: "#12706E" },
  rasp: { bg: "#FCE4EA", bar: T.a1, ink: "#B23350" },
  butter: { bg: "#FFF1CC", bar: T.a3dark, ink: "#8A6206" },
  plum: { bg: "#ECE8F3", bar: T.side, ink: T.side },
};

// [title, start hour, end hour, column, tone, frame it lands]
type Ev = { title: string; s: number; e: number; col: number; tone: Tone; at: number };
const EVENTS: Ev[] = [
  { title: "Staff meeting", s: 8, e: 9, col: 0, tone: "teal", at: 8 },
  { title: "Budget review", s: 8.5, e: 10, col: 1, tone: "plum", at: 14 },
  { title: "Volunteer call", s: 9, e: 9.5, col: 0, tone: "rasp", at: 20 },
  { title: "Front desk cover", s: 9.5, e: 12, col: 0, tone: "butter", at: 25 },
  { title: "Family tour", s: 10, e: 11, col: 1, tone: "teal", at: 30 },
  { title: "Grant deadline", s: 10.5, e: 12.5, col: 2, tone: "rasp", at: 34 },
  { title: "Room setup", s: 11, e: 12, col: 1, tone: "butter", at: 38 },
  { title: "Lunch with donors", s: 12, e: 13.5, col: 0, tone: "plum", at: 42 },
  { title: "Board prep", s: 12.5, e: 14, col: 1, tone: "teal", at: 46 },
  { title: "Payroll", s: 13, e: 14, col: 2, tone: "butter", at: 49 },
  { title: "Supply run", s: 13.5, e: 14.5, col: 0, tone: "rasp", at: 52 },
  { title: "Interviews", s: 14, e: 15.5, col: 2, tone: "plum", at: 55 },
  { title: "Newsletter", s: 14.5, e: 16.5, col: 0, tone: "teal", at: 58 },
  { title: "Volunteer rota", s: 14.5, e: 16, col: 1, tone: "butter", at: 61 },
  // these spill past the end of the day, landing on "hours"
  { title: "Reports", s: 15.5, e: 17.5, col: 2, tone: "rasp", at: W_HOURS - 3 },
  { title: "Emails", s: 16, e: 18, col: 1, tone: "plum", at: W_HOURS },
  { title: "Inbox", s: 16.5, e: 19, col: 0, tone: "butter", at: W_HOURS + 3 },
];
const BOOKED = EVENTS.reduce((n, ev) => n + (ev.e - ev.s), 0);

const CAL = { left: 380, top: 66, w: 1160, head: 104 };
const HOUR = 84;
const GRID_TOP = CAL.head + 18; // inside the card
const DAY_END = 17; // 5 PM
const GUTTER = 128;
const COL_GAP = 8;
const COL_W = (CAL.w - GUTTER - 34 - 2 * COL_GAP) / 3;
const hourY = (h: number) => GRID_TOP + (h - 8) * HOUR;
const CAL_H = hourY(DAY_END) + 40;

function hourLabel(h: number) {
  const hh = h > 12 ? h - 12 : h;
  return `${hh} ${h >= 12 ? "PM" : "AM"}`;
}
function timeLabel(h: number) {
  const whole = Math.floor(h);
  const hh = whole > 12 ? whole - 12 : whole;
  return `${hh}:${h % 1 ? "30" : "00"}`;
}

function EventBlock({ ev, f }: { ev: Ev; f: number }) {
  const k = interpolate(f, [ev.at, ev.at + 7], [0, 1], { ...clamp, easing: pop });
  const o = t01(f, ev.at, ev.at + 4);
  const tone = TONES[ev.tone];
  const h = (ev.e - ev.s) * HOUR - 5;
  const spills = ev.e > DAY_END;
  return (
    <div
      style={{
        position: "absolute",
        left: GUTTER + ev.col * (COL_W + COL_GAP),
        top: hourY(ev.s) + 2,
        width: COL_W,
        height: h,
        background: tone.bg,
        borderRadius: 10,
        borderLeft: `5px solid ${tone.bar}`,
        padding: h < 60 ? "0 14px" : "9px 14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: h < 60 ? "center" : "flex-start",
        gap: 2,
        opacity: o,
        transform: `translateY(${(1 - k) * 12}px) scale(${0.94 + 0.06 * k})`,
        transformOrigin: "50% 0%",
        boxShadow: spills ? "0 1px 2px rgba(30,27,34,0.06), 0 10px 24px rgba(30,27,34,0.10)" : "0 0 0 2px #fff",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 650, color: tone.ink, whiteSpace: "nowrap" }}>{ev.title}</span>
      {h >= 70 ? (
        <span style={{ fontSize: 17, fontWeight: 500, color: tone.ink, opacity: 0.85 }}>
          {timeLabel(ev.s)} &ndash; {timeLabel(ev.e)}
        </span>
      ) : null}
    </div>
  );
}

function Calendar({ f }: { f: number }) {
  const k = t01(f, 0, 12);
  const out = t01(f, CAL_OUT, CAL_OUT + 9);
  const over = interpolate(f, [W_HOURS + 4, W_HOURS + 12], [0, 1], { ...clamp, easing: pop });
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
  return (
    <div
      style={{
        position: "absolute",
        left: CAL.left,
        top: CAL.top,
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 22 + out * 14}px) scale(${1 - out * 0.015})`,
      }}
    >
      <Card style={{ width: CAL.w, height: CAL_H, position: "relative" }}>
        {/* header */}
        <div style={{ height: CAL.head, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: `1.5px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <PathIcon d={CAL_ICON} size={32} color={T.ink} />
            <span style={{ fontSize: 30, fontWeight: 750, color: T.ink }}>Tuesday</span>
            <span style={{ fontSize: 30, fontWeight: 450, color: T.ink2 }}>May 12</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 14 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: T.ink2, border: `1.5px solid ${T.line}`, borderRadius: 8, padding: "4px 12px", marginRight: 6 }}>Today</span>
              <PathIcon d={CARET_L} size={22} color={T.ink2} />
              <PathIcon d={CARET_R} size={22} color={T.ink2} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 19, fontWeight: 600, color: T.ink2, background: "#F1EDE7", borderRadius: 999, padding: "6px 16px" }}>8 h workday</span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 19,
                fontWeight: 700,
                color: "#fff",
                background: T.a1,
                borderRadius: 999,
                padding: "6px 16px 6px 12px",
                opacity: t01(f, W_HOURS + 4, W_HOURS + 8),
                transform: `scale(${0.6 + 0.4 * over})`,
              }}
            >
              <PathIcon d={WARNING} size={20} color="#fff" /> {BOOKED} h booked
            </span>
          </div>
        </div>
        {/* hour grid */}
        {hours.map((h) => (
          <div key={h} style={{ position: "absolute", left: 0, right: 0, top: hourY(h) }}>
            <div style={{ position: "absolute", left: 30, width: GUTTER - 46, top: -12, textAlign: "right", fontSize: 17, fontWeight: 500, color: T.ink3 }}>{hourLabel(h)}</div>
            <div style={{ position: "absolute", left: GUTTER - 8, right: 26, top: 0, height: 1.5, background: T.line }} />
          </div>
        ))}
        {/* the end of the day */}
        <div style={{ position: "absolute", left: 0, right: 0, top: hourY(DAY_END) }}>
          <div style={{ position: "absolute", left: 30, width: GUTTER - 46, top: -12, textAlign: "right", fontSize: 17, fontWeight: 700, color: T.a1dark }}>5 PM</div>
          <div style={{ position: "absolute", left: GUTTER - 8, right: 26, top: -1, height: 2.5, background: T.a1, borderRadius: 2 }} />
        </div>
        {/* the meetings: the ones that run past 5 PM hang out of the card */}
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          {EVENTS.map((ev) => (f >= ev.at ? <EventBlock key={ev.title} ev={ev} f={f} /> : null))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- the stiff email

// a run of text; `hl` is the buzzword's place in the highlight order (or -1)
type Run = { t: string; hl: number };
const SUBJECT: Run[] = [
  { t: "Exciting synergies", hl: 0 },
  { t: " for our ", hl: -1 },
  { t: "vibrant", hl: 1 },
  { t: " community!", hl: -1 },
];
const GREETING: Run[] = [{ t: "Dear Valued Community Members,", hl: -1 }];
const BODY: Run[] = [
  { t: "We are ", hl: -1 },
  { t: "thrilled", hl: 2 },
  { t: " to ", hl: -1 },
  { t: "leverage", hl: 3 },
  { t: " ", hl: -1 },
  { t: "innovative", hl: 4 },
  { t: ", ", hl: -1 },
  { t: "holistic", hl: 5 },
  { t: " solutions to ", hl: -1 },
  { t: "empower", hl: 6 },
  { t: " all ", hl: -1 },
  { t: "stakeholders", hl: 7 },
  { t: " ", hl: -1 },
  { t: "going forward", hl: 8 },
  { t: ".", hl: -1 },
];
const SIGN1: Run[] = [{ t: "Best regards,", hl: -1 }];
const SIGN2: Run[] = [{ t: "The Leadership Team", hl: -1 }];
const BUZZ_N = 9;

const len = (runs: Run[]) => runs.reduce((n, r) => n + r.t.length, 0);

// when each part types, and how fast (frames per character): the machine is quick
const PARTS = (() => {
  const plan: { runs: Run[]; per: number }[] = [
    { runs: SUBJECT, per: 0.4 },
    { runs: GREETING, per: 0.2 },
    { runs: BODY, per: 0.18 },
    { runs: SIGN1, per: 0.2 },
    { runs: SIGN2, per: 0.2 },
  ];
  let at = SUBJ0;
  return plan.map((p, i) => {
    const start = at + (i === 1 ? 2 : 0);
    const end = start + Math.ceil(len(p.runs) * p.per);
    at = end + 1;
    return { ...p, start, end };
  });
})();
const HL_AT = (i: number) => W_BUZZ + i * 3; // each buzzword's highlighter swipe

function Highlight({ p, children }: { p: number; children: ReactNode }) {
  return (
    <span
      style={{
        backgroundImage: "linear-gradient(#FFDF85, #FFDF85)",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${p * 100}% 78%`,
        backgroundPosition: "0 65%",
        borderRadius: 4,
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        padding: "0 2px",
        margin: "0 -2px",
      }}
    >
      {children}
    </span>
  );
}

/** One part of the draft, typed up to this frame, with its caret while it is the one typing. */
function TypedRuns({ part, f }: { part: (typeof PARTS)[number]; f: number }) {
  const n = Math.max(0, Math.min(len(part.runs), Math.floor((f - part.start) / part.per)));
  const typing = f >= part.start && f <= part.end;
  const out: ReactNode[] = [];
  let idx = 0;
  part.runs.forEach((r, i) => {
    const shown = r.t.slice(0, Math.max(0, n - idx));
    idx += r.t.length;
    if (!shown) return;
    if (r.hl >= 0) {
      const p = interpolate(f, [HL_AT(r.hl), HL_AT(r.hl) + 5], [0, 1], clamp);
      out.push(
        <Highlight key={i} p={p}>
          {shown}
        </Highlight>,
      );
    } else out.push(<span key={i}>{shown}</span>);
  });
  return (
    <>
      {out}
      {typing ? <Caret f={f} from={part.start} height={30} /> : null}
    </>
  );
}

function FieldRow({ label, children, h = 64 }: { label: string; children: ReactNode; h?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, height: h, padding: "0 40px", borderTop: `1.5px solid ${T.line}` }}>
      <span style={{ width: 96, fontSize: 22, color: T.ink3, flex: "none" }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function Email({ f }: { f: number }) {
  const k = t01(f, MAIL_IN, MAIL_IN + 12);
  const out = t01(f, OUT, OUT + 9);
  const chip = interpolate(f, [W_AI, W_AI + 7], [0, 1], { ...clamp, easing: pop });
  const done = Array.from({ length: BUZZ_N }).filter((_, i) => f >= HL_AT(i) + 2).length;
  const counter = interpolate(f, [W_BUZZ, W_BUZZ + 7], [0, 1], { ...clamp, easing: pop });
  const lastHl = done > 0 ? HL_AT(done - 1) + 2 : -99;
  const bump = interpolate(f - lastHl, [0, 2, 7], [0, 1, 0], clamp);
  // before the AI starts, the subject field waits with a blinking caret
  const idle = f < SUBJ0;
  const [subj, greet, body, sign1, sign2] = PARTS;

  return (
    <div
      style={{
        position: "absolute",
        left: 340,
        top: 220,
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 22 + out * 14}px) scale(${1 - out * 0.015})`,
      }}
    >
      <Card style={{ width: 1240, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 78, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
          <span style={{ fontSize: 23, fontWeight: 700, color: T.ink }}>New message</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 18,
              fontWeight: 650,
              color: T.ink2,
              background: "#EEEAF0",
              borderRadius: 999,
              padding: "6px 15px 6px 11px",
              opacity: t01(f, W_AI, W_AI + 4),
              transform: `scale(${0.6 + 0.4 * chip})`,
              transformOrigin: "100% 50%",
            }}
          >
            <PathIcon d={ROBOT} size={22} color={T.ink2} /> Written by AI
          </span>
        </div>
        <FieldRow label="To">
          <span style={{ fontSize: 22, fontWeight: 520, color: T.ink }}>All members (230)</span>
        </FieldRow>
        <FieldRow label="Subject" h={70}>
          <span style={{ fontSize: 27, fontWeight: 700, color: T.ink, whiteSpace: "nowrap" }}>
            {idle ? <Caret f={f} from={MAIL_IN + 6} height={30} /> : <TypedRuns part={subj} f={f} />}
          </span>
        </FieldRow>
        <div style={{ borderTop: `1.5px solid ${T.line}`, padding: "26px 40px 6px", fontSize: 27, lineHeight: 1.55, color: T.ink, fontWeight: 420, minHeight: 330 }}>
          <div style={{ minHeight: 42 }}>{f >= greet.start ? <TypedRuns part={greet} f={f} /> : null}</div>
          <div style={{ minHeight: 84, marginTop: 14 }}>{f >= body.start ? <TypedRuns part={body} f={f} /> : null}</div>
          <div style={{ minHeight: 42, marginTop: 14 }}>{f >= sign1.start ? <TypedRuns part={sign1} f={f} /> : null}</div>
          <div style={{ minHeight: 42 }}>{f >= sign2.start ? <TypedRuns part={sign2} f={f} /> : null}</div>
        </div>
        <div style={{ height: 96, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px 8px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 19,
              fontWeight: 700,
              color: "#8A6206",
              background: "#FFF1CC",
              borderRadius: 999,
              padding: "6px 16px 6px 12px",
              opacity: t01(f, W_BUZZ, W_BUZZ + 4),
              transform: `scale(${(0.6 + 0.4 * counter) * (1 + 0.06 * bump)})`,
              transformOrigin: "0% 50%",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ width: 24, height: 13, borderRadius: 4, background: "#FFD66B", transform: "rotate(-8deg)", flex: "none" }} /> {done} buzzword{done === 1 ? "" : "s"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {["paperclip", "text-aa", "smiley"].map((n) => (
              <Icon key={n} name={n} size={25} color={T.ink3} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 56, padding: "0 28px", borderRadius: 999, background: T.ink, color: "#fff", fontSize: 22, fontWeight: 650, marginLeft: 8 }}>
              <Icon name="paper-plane-right:fill" size={21} color="#fff" /> Send
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- the scene

export function S02() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: T.sans }}>
      {f < CAL_OUT + 12 ? <Calendar f={f} /> : null}
      {f >= MAIL_IN ? <Email f={f} /> : null}
    </AbsoluteFill>
  );
}

