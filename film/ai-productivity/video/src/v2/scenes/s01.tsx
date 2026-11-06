// Scene s01 (version 2): Overload. "Running an organization means a thousand
// moving parts... and many of them still run on paper."
//
// The inbox arrives centred and mail keeps landing at the top (the unread count
// climbs to 128). On "thousand" it slides left to make room for a to-do list
// that keeps growing until it runs off the bottom of the frame. On "and many"
// both clear, and paper forms drop onto a loose pile, the last one ("Volunteer
// sign-up", the form scene 5 photographs) landing on "paper".
//
// Local, 0-based frames. Sounds: video/timeline/cues-v2/s01.json.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { clamp, sceneT, t01, wordAt } from "../kit.tsx";
import { Card, Face, Icon, T } from "../ui.tsx";

const ID = "s01";
const LEN = sceneT(ID).length; // 225

// ---------------------------------------------------------------- the beats

const W_THOUSAND = wordAt(ID, "thousand"); // 73
const W_AND = wordAt(ID, "and"); // 131
const W_PAPER = wordAt(ID, "paper."); // 180

const MAIL_AT = [18, 28, 37, 45, 52, 59, 65, 71, 77, 83, 88, 93, 98, 103, 108]; // each new mail lands
const SLIDE = W_THOUSAND - 9; // the inbox slides left to make room
const TODO_IN = W_THOUSAND - 3; // the to-do card arrives
const TODO_AT = [80, 86, 91, 96, 100, 104, 108, 111, 114, 117, 120, 123]; // each new task
const CLEAR = W_AND - 15; // inbox and to-do clear
const SHEET_LAND = [wordAt(ID, "many"), wordAt(ID, "them") + 1, wordAt(ID, "still") + 2, wordAt(ID, "run") + 2, W_PAPER + 1];
const FALL = 11; // frames a sheet takes to drop and settle
const OUT = LEN - 9; // everything clears

// ---------------------------------------------------------------- icons not in icons.ts (Phosphor, MIT)

const TRAY =
  "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,16V152h-28.7A15.86,15.86,0,0,0,168,156.69L148.69,176H107.31L88,156.69A15.86,15.86,0,0,0,76.69,152H48V48Zm0,160H48V168H76.69L96,187.31A15.86,15.86,0,0,0,107.31,192h41.38A15.86,15.86,0,0,0,160,187.31L179.31,168H208v40Z";
const LIST_CHECKS =
  "M224,128a8,8,0,0,1-8,8H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128ZM128,72h88a8,8,0,0,0,0-16H128a8,8,0,0,0,0,16Zm88,112H128a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM82.34,42.34,56,68.69,45.66,58.34A8,8,0,0,0,34.34,69.66l16,16a8,8,0,0,0,11.32,0l32-32A8,8,0,0,0,82.34,42.34Zm0,64L56,132.69,45.66,122.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Zm0,64L56,196.69,45.66,186.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Z";

function PathIcon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      <path d={d} fill={color} />
    </svg>
  );
}

// ---------------------------------------------------------------- the inbox

type Mail = { from: string; ini: string; color: string; subject: string; time: string };

const TEAM = "#5C5762";
// already there when the inbox opens (newest first)
const OLD_MAIL: Mail[] = [
  { from: "Ana Kim", ini: "AK", color: T.a3dark, subject: "Room B is double-booked Thursday", time: "8:52 AM" },
  { from: "Facilities", ini: "F", color: TEAM, subject: "Boiler check moved to Monday", time: "8:47 AM" },
  { from: "Jun Lee", ini: "JL", color: T.a1, subject: "Re: Saturday cleanup signs", time: "8:40 AM" },
  { from: "Grace Lin", ini: "GL", color: T.a2, subject: "Invoice #2041 is overdue", time: "8:31 AM" },
  { from: "Tom Okafor", ini: "TO", color: T.side, subject: "Receipts from the bake sale", time: "8:25 AM" },
  { from: "Board", ini: "B", color: TEAM, subject: "Agenda for the 14th", time: "8:12 AM" },
  { from: "Lena Ortiz", ini: "LO", color: T.a1, subject: "Who has the van keys?", time: "8:03 AM" },
  { from: "Sam Patel", ini: "SP", color: T.a2, subject: "Volunteer hours for March", time: "7:58 AM" },
  { from: "Office", ini: "O", color: TEAM, subject: "Fire drill next week", time: "7:51 AM" },
];
// landing one after another, in MAIL_AT order
const NEW_MAIL: Mail[] = [
  { from: "Maria Reyes", ini: "MR", color: T.a2, subject: "When does summer registration close?", time: "9:02 AM" },
  { from: "Priya Shah", ini: "PS", color: T.a1, subject: "Can someone cover the front desk?", time: "9:05 AM" },
  { from: "David Cho", ini: "DC", color: T.side, subject: "A new family wants a tour", time: "9:09 AM" },
  { from: "Events", ini: "E", color: TEAM, subject: "Gala chairs: 120 or 150?", time: "9:12 AM" },
  { from: "Nora Bell", ini: "NB", color: T.a3dark, subject: "Re: Re: Parking on Sunday", time: "9:14 AM" },
  { from: "Payroll", ini: "P", color: TEAM, subject: "Timesheets are due today", time: "9:18 AM" },
  { from: "Ken Ito", ini: "KI", color: T.a2, subject: "The hall projector is broken", time: "9:21 AM" },
  { from: "Ruth Adams", ini: "RA", color: T.a1, subject: "Donation receipt, please", time: "9:23 AM" },
  { from: "Leo Martin", ini: "LM", color: T.side, subject: "Can I swap my Saturday shift?", time: "9:26 AM" },
  { from: "Ana Kim", ini: "AK", color: T.a3dark, subject: "Re: Room B is double-booked", time: "9:28 AM" },
  { from: "Office", ini: "O", color: TEAM, subject: "The printer is out of toner", time: "9:30 AM" },
  { from: "Ivy Chen", ini: "IC", color: T.a2, subject: "Newsletter draft attached", time: "9:33 AM" },
  { from: "Max Romero", ini: "MR", color: T.a1, subject: "Key for the side door?", time: "9:35 AM" },
  { from: "Jun Lee", ini: "JL", color: T.a1, subject: "Re: Re: Saturday cleanup signs", time: "9:38 AM" },
  { from: "Sara Diaz", ini: "SD", color: T.side, subject: "Insurance renewal: action needed", time: "9:41 AM" },
];
const UNREAD_START = 128 - NEW_MAIL.length; // 113

const ROW_H = 92;
const INBOX = { w: 900, h: 880, top: 100, xCentre: (1920 - 900) / 2, xLeft: 140 };

function MailRow({ m, k, flash }: { m: Mail; k: number; flash: number }) {
  return (
    <div style={{ height: ROW_H * k, overflow: "hidden", flex: "none", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: ROW_H,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 34px 0 22px",
          borderBottom: `1.5px solid ${T.line}`,
          background: `rgba(252,228,234,${0.7 * flash})`,
          opacity: interpolate(k, [0.35, 1], [0, 1], clamp),
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: 99, background: T.a1, flex: "none" }} />
        <Face initials={m.ini} color={m.color} size={46} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>{m.from}</span>
            <span style={{ fontSize: 17, fontWeight: 550, color: T.ink2, fontVariantNumeric: "tabular-nums" }}>{m.time}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 450, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.subject}</div>
        </div>
      </div>
    </div>
  );
}

function Inbox({ f }: { f: number }) {
  const arrived = MAIL_AT.filter((a) => f >= a + 3).length;
  const count = UNREAD_START + arrived;
  // the count pill nudges up a little each time it changes
  const last = arrived > 0 ? MAIL_AT[arrived - 1] + 3 : -99;
  const bump = interpolate(f - last, [0, 2, 8], [0, 1, 0], clamp);
  const k = t01(f, 0, 12);
  const slide = t01(f, SLIDE, SLIDE + 18);
  const x = INBOX.xCentre + (INBOX.xLeft - INBOX.xCentre) * slide;
  const out = t01(f, CLEAR, CLEAR + 9);

  const newest = NEW_MAIL.map((m, i) => ({ m, at: MAIL_AT[i] })).reverse();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: INBOX.top,
        opacity: k * (1 - out),
        transform: `translateY(${(1 - k) * 22 + out * 14}px) scale(${1 - out * 0.015})`,
      }}
    >
      <Card style={{ width: INBOX.w, height: INBOX.h, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ height: 92, flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: `1.5px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <PathIcon d={TRAY} size={30} color={T.ink} />
            <span style={{ fontSize: 30, fontWeight: 750, color: T.ink }}>Inbox</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                background: T.a1,
                borderRadius: 999,
                padding: "3px 13px",
                fontVariantNumeric: "tabular-nums",
                transform: `scale(${1 + 0.12 * bump})`,
                display: "inline-block",
              }}
            >
              {count}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: T.ink2, border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "4px 14px" }}>Unread</span>
            <Icon name="magnifying-glass" size={26} color={T.ink2} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {newest.map(({ m, at }) =>
            f >= at ? <MailRow key={`n${at}`} m={m} k={t01(f, at, at + 7)} flash={1 - t01(f, at + 6, at + 24)} /> : null,
          )}
          {OLD_MAIL.map((m, i) => (
            <MailRow key={`o${i}`} m={m} k={1} flash={0} />
          ))}
        </div>
        {/* the list scrolls on below: a soft fade at the card's foot */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(rgba(255,255,255,0), #fff 85%)" }} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- the to-do list

type Task = { text: string; due: string };
const TASKS: Task[] = [
  { text: "Book the hall for May 3", due: "Today" },
  { text: "Print the sign-up sheets", due: "Today" },
  { text: "Reply to the board", due: "Overdue" },
  // then they keep coming (TODO_AT)
  { text: "Order 40 chairs", due: "Fri" },
  { text: "Call the plumber", due: "Today" },
  { text: "Update the volunteer list", due: "Fri" },
  { text: "Approve March expenses", due: "Overdue" },
  { text: "Send the newsletter", due: "Mon" },
  { text: "Renew the insurance", due: "Overdue" },
  { text: "Plan the summer camp", due: "May 1" },
  { text: "Thank-you cards for donors", due: "Fri" },
  { text: "Count the cash box", due: "Today" },
  { text: "Schedule the fire drill", due: "Mon" },
  { text: "Collect the room keys", due: "Fri" },
  { text: "Post the weekend rota", due: "Today" },
];
const TASK_H = 66;
const TODO = { w: 690, left: 1090, top: 168 };
const OPEN_START = 31;

function DueChip({ due }: { due: string }) {
  const hot = due === "Overdue";
  const today = due === "Today";
  const style: CSSProperties = hot
    ? { color: T.a1dark, background: T.tint }
    : today
      ? { color: "#9A6B05", background: "#FFF1CC" }
      : { color: T.ink2, background: "#F1EDE7" };
  return <span style={{ fontSize: 17, fontWeight: 650, borderRadius: 7, padding: "3px 10px", flex: "none", ...style }}>{due}</span>;
}

function TaskRow({ t, k }: { t: Task; k: number }) {
  return (
    <div style={{ height: TASK_H * k, overflow: "hidden", flex: "none", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: TASK_H,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 30px",
          opacity: interpolate(k, [0.3, 1], [0, 1], clamp),
          transform: `translateY(${(1 - k) * 10}px)`,
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 99, border: `2px solid #C9C2B8`, flex: "none" }} />
        <span style={{ flex: 1, fontSize: 22, fontWeight: 450, color: T.ink, whiteSpace: "nowrap" }}>{t.text}</span>
        <DueChip due={t.due} />
      </div>
    </div>
  );
}

function Todo({ f }: { f: number }) {
  const k = t01(f, TODO_IN, TODO_IN + 12);
  const out = t01(f, CLEAR + 2, CLEAR + 11);
  const ks = TASKS.map((_, i) => (i < 3 ? 1 : t01(f, TODO_AT[i - 3], TODO_AT[i - 3] + 6)));
  const added = TODO_AT.filter((a) => f >= a + 2).length;
  return (
    <div
      style={{
        position: "absolute",
        left: TODO.left,
        top: TODO.top,
        opacity: k * (1 - out),
        transform: `translate(${(1 - k) * 40}px, ${out * 14}px)`,
      }}
    >
      <Card style={{ width: TODO.w, overflow: "hidden", display: "flex", flexDirection: "column", paddingBottom: 10 }}>
        <div style={{ height: 92, flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", borderBottom: `1.5px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <PathIcon d={LIST_CHECKS} size={30} color={T.ink} />
            <span style={{ fontSize: 30, fontWeight: 750, color: T.ink }}>To do</span>
            <span style={{ fontSize: 20, fontWeight: 650, color: T.ink2, fontVariantNumeric: "tabular-nums" }}>{OPEN_START + added} open</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: T.ink2, border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "4px 14px" }}>This week</span>
        </div>
        <div style={{ height: 8 }} />
        {TASKS.map((t, i) => (ks[i] > 0 ? <TaskRow key={i} t={t} k={ks[i]} /> : null))}
        <div style={{ height: 60, display: "flex", alignItems: "center", gap: 18, padding: "0 30px", color: T.ink3, fontSize: 21, fontWeight: 500 }}>
          <Icon name="plus" size={24} color={T.ink3} /> Add a task
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- the paper forms

const PAPER_W = 520;
const PAPER_H = 672;

function Rule({ label, w = "100%", style }: { label: string; w?: number | string; style?: CSSProperties }) {
  return (
    <div style={{ width: w, ...style }}>
      <div style={{ fontSize: 17, color: T.ink2, fontWeight: 500 }}>{label}</div>
      <div style={{ height: 1.5, background: "#CFC7BC", marginTop: 26 }} />
    </div>
  );
}

function Grid({ cols, rows }: { cols: string[]; rows: number }) {
  return (
    <div style={{ border: `1.5px solid #CFC7BC`, borderRadius: 2 }}>
      <div style={{ display: "flex", background: "#F4F0E9", borderBottom: `1.5px solid #CFC7BC` }}>
        {cols.map((c, i) => (
          <div key={c} style={{ flex: i === 0 ? 1.4 : 1, fontSize: 17, fontWeight: 650, color: T.ink2, padding: "7px 10px", borderLeft: i ? `1.5px solid #CFC7BC` : "none" }}>
            {c}
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", height: 38, borderTop: r ? `1px solid #E2DBD1` : "none" }}>
          {cols.map((c, i) => (
            <div key={c} style={{ flex: i === 0 ? 1.4 : 1, borderLeft: i ? `1.5px solid #E2DBD1` : "none" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Box({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 18, color: T.ink, marginRight: 22 }}>
      <span style={{ width: 18, height: 18, border: `1.5px solid #9C958C`, borderRadius: 2 }} />
      {label}
    </span>
  );
}

type Sheet = { title: string; form: string; body: ReactNode; clip?: boolean };

const SHEETS: Sheet[] = [
  {
    title: "Supply order",
    form: "Form 21",
    body: (
      <>
        <div style={{ display: "flex", gap: 22 }}>
          <Rule label="Requested by" w="60%" />
          <Rule label="Date" w="40%" />
        </div>
        <div style={{ marginTop: 22 }}>
          <Grid cols={["Item", "Qty", "Cost"]} rows={6} />
        </div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", fontSize: 18, fontWeight: 650, color: T.ink2 }}>Total $ ________</div>
      </>
    ),
  },
  {
    title: "Attendance sheet",
    form: "Form 04",
    body: (
      <>
        <div style={{ display: "flex", gap: 22 }}>
          <Rule label="Group" w="55%" />
          <Rule label="Date" w="45%" />
        </div>
        <div style={{ marginTop: 22 }}>
          <Grid cols={["Name", "In", "Out"]} rows={7} />
        </div>
      </>
    ),
  },
  {
    title: "Room booking",
    form: "Form 09",
    body: (
      <>
        <Rule label="Your name" />
        <div style={{ marginTop: 20, fontSize: 17, color: T.ink2, fontWeight: 500 }}>Room</div>
        <div style={{ marginTop: 10 }}>
          <Box label="Hall" />
          <Box label="Room B" />
          <Box label="Kitchen" />
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 22 }}>
          <Rule label="Date" w="40%" />
          <Rule label="From" w="30%" />
          <Rule label="To" w="30%" />
        </div>
        <Rule label="Number of people" style={{ marginTop: 20 }} />
        <Rule label="Notes" style={{ marginTop: 20 }} />
      </>
    ),
  },
  {
    title: "Expense claim",
    form: "Form 17",
    clip: true,
    body: (
      <>
        <Rule label="Name" />
        <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
          <Rule label="Date" w="50%" />
          <Rule label="Amount ($)" w="50%" />
        </div>
        <Rule label="What was it for?" style={{ marginTop: 20 }} />
        <div style={{ height: 1.5, background: "#CFC7BC", marginTop: 34 }} />
        <div style={{ marginTop: 22 }}>
          <Box label="Receipt attached" />
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 24 }}>
          <Rule label="Signed" w="55%" />
          <Rule label="Approved by" w="45%" />
        </div>
      </>
    ),
  },
  {
    title: "Volunteer sign-up",
    form: "Form 12",
    body: (
      <>
        <div style={{ display: "flex", gap: 22 }}>
          <Rule label="Event" w="60%" />
          <Rule label="Date" w="40%" />
        </div>
        <div style={{ marginTop: 22 }}>
          <Grid cols={["Name", "Team", "Email", "Phone"]} rows={7} />
        </div>
      </>
    ),
  },
];

// where each sheet settles on the pile (offset from the pile's centre, degrees)
const PILE = { x: 960, y: 548 };
const REST = [
  { x: 372, y: -6, r: 6 }, // Supply order, right
  { x: -392, y: 34, r: -7 }, // Attendance sheet, left
  { x: 318, y: -96, r: 3.6 }, // Room booking, up right: its title peeks over the top sheet
  { x: -300, y: -62, r: -3.4 }, // Expense claim, up left
  { x: 12, y: 26, r: -1.4 }, // Volunteer sign-up, on top
];

function Paper({ s }: { s: Sheet }) {
  return (
    <div
      style={{
        width: PAPER_W,
        height: PAPER_H,
        background: "#FFFDF8",
        borderRadius: 4,
        border: "1px solid rgba(30,27,34,0.07)",
        padding: "40px 46px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 650, letterSpacing: 1.4, color: T.ink3 }}>
        <span>RIVERSIDE CENTER</span>
        <span style={{ letterSpacing: 0.3, fontWeight: 550 }}>{s.form}</span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 750, color: T.ink, marginTop: 14, letterSpacing: -0.3 }}>{s.title}</div>
      <div style={{ fontSize: 17, color: T.ink3, marginTop: 4, marginBottom: 26 }}>Please print clearly.</div>
      {s.body}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 17, color: T.ink3 }}>
        <span>Return to the front desk</span>
        <span>Page 1 of 1</span>
      </div>
      {s.clip ? (
        <div style={{ position: "absolute", top: -26, left: 54, transform: "rotate(-6deg)" }}>
          <Icon name="paperclip" size={74} color="#9C958C" />
        </div>
      ) : null}
    </div>
  );
}

function Pile({ f }: { f: number }) {
  const out = t01(f, OUT, OUT + 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${out * 12}px)` }}>
      {SHEETS.map((s, i) => {
        const land = SHEET_LAND[i];
        if (f < land - FALL) return null;
        // drops in from above, lifted (bigger, softer shadow), and settles with a whisper of overshoot
        const k = interpolate(f, [land - FALL, land], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const settle = interpolate(f, [land, land + 3, land + 7], [0, 1, 0], clamp);
        const lift = 1 - k;
        const rest = REST[i];
        const x = PILE.x + rest.x - PAPER_W / 2;
        const y = PILE.y + rest.y - PAPER_H / 2 - lift * 120;
        const rot = rest.r + lift * (i % 2 ? -5 : 5);
        const scale = 1 + lift * 0.07 - settle * 0.006;
        const shadow = `0 ${2 + lift * 26}px ${4 + lift * 40}px rgba(30,27,34,${0.07 + lift * 0.05}), 0 ${12 + lift * 30}px ${30 + lift * 40}px rgba(30,27,34,${0.08 + lift * 0.04})`;
        return (
          <div
            key={s.title}
            style={{
              position: "absolute",
              left: x,
              top: y,
              // a quick fade, so a sheet never ghosts over the pile for more than a frame
              opacity: interpolate(f, [land - FALL, land - FALL + 2], [0, 1], clamp),
              transform: `rotate(${rot}deg) scale(${scale})`,
              boxShadow: shadow,
              borderRadius: 4,
            }}
          >
            <Paper s={s} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- the scene

export function S01() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: T.sans }}>
      {f < CLEAR + 14 ? (
        <>
          <Inbox f={f} />
          {f >= TODO_IN ? <Todo f={f} /> : null}
        </>
      ) : null}
      {f >= SHEET_LAND[0] - FALL ? <Pile f={f} /> : null}
    </AbsoluteFill>
  );
}

