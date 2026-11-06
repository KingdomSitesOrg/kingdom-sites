// Scene s08, "Need something found? Claude searches the web and your files, and
// brings back what you asked for."
//
// A Claude chat. The person types "Find three venues within an hour for our
// team day." On "Claude searches" Claude starts searching, and the sources land
// one by one: three web pages on "the web", the team's budget spreadsheet on
// "your files". On "brings back" Claude answers with three venue cards (drive
// time, size, price), and on "what you asked for" each card is marked as in
// budget. The chat scrolls up as it grows, as a real one does.

import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { ClaudeSays, Stream, ThinkingDots, Typed, clamp, ease, leave, pop, t01, wordAt } from "../kit.tsx";
import { Card, ClaudeFace, Icon, T } from "../ui.tsx";

// Phosphor (MIT) path data not in icons.ts, viewBox 0 0 256 256. Duotone icons are [faint, main].
const P = {
  globe: "M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z",
  fileXls: "M44,120H212a4,4,0,0,0,4-4V88a8,8,0,0,0-2.34-5.66l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40v76A4,4,0,0,0,44,120ZM152,44l44,44H152Zm4,164.53a8.18,8.18,0,0,1-8.25,7.47H120a8,8,0,0,1-8-8V152.27a8.18,8.18,0,0,1,7.47-8.25,8,8,0,0,1,8.53,8v48h20A8,8,0,0,1,156,208.53ZM94.51,156.65,77.83,180l16.68,23.35a8,8,0,0,1-13,9.3L68,193.76,54.51,212.65a8,8,0,1,1-13-9.3L58.17,180,41.49,156.65a8,8,0,0,1,2.3-11.46,8.19,8.19,0,0,1,10.88,2.38L68,166.24l13.49-18.89a8,8,0,0,1,13,9.3Zm121.28,39.66a20.81,20.81,0,0,1-9.18,15.23C201.42,215,194.94,216,189.12,216a60.63,60.63,0,0,1-15.19-2,8,8,0,0,1,4.31-15.41c4.38,1.21,14.94,2.71,19.54-.35.89-.6,1.84-1.52,2.15-3.93.34-2.67-.72-4.1-12.78-7.59-9.35-2.7-25-7.23-23-23.12a20.58,20.58,0,0,1,8.95-14.94c11.84-8,30.72-3.31,32.83-2.76a8,8,0,0,1-4.07,15.48c-4.48-1.17-15.22-2.56-19.82.56a4.54,4.54,0,0,0-2,3.67c-.11.9-.13,1.08,1.12,1.9,2.31,1.49,6.45,2.68,10.45,3.84C201.48,174.17,218,179,215.79,196.31Z",
  car: "M240,104H229.2L201.42,41.5A16,16,0,0,0,186.8,32H69.2a16,16,0,0,0-14.62,9.5L26.8,104H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V184h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V120h8a8,8,0,0,0,0-16ZM69.2,48H186.8l24.89,56H44.31ZM216,200H192V176a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v24H40V120H216Z",
  waves: [
    "M216,70.39v112c-72,59.69-104-56.47-176,3.22v-112C112,13.92,144,130.08,216,70.39Z",
    "M222.16,177.25a8,8,0,0,1-1,11.25c-17.36,14.39-32.86,19.5-47,19.5-18.58,0-34.82-8.82-49.93-17-25.35-13.76-47.24-25.64-79.07.74a8,8,0,1,1-10.22-12.31c40.17-33.28,70.32-16.92,96.93-2.48,25.35,13.75,47.24,25.63,79.07-.74A8,8,0,0,1,222.16,177.25Zm-11.27-57c-31.83,26.38-53.72,14.5-79.07.74-26.61-14.43-56.76-30.79-96.93,2.49a8,8,0,0,0,10.22,12.31c31.83-26.38,53.72-14.5,79.07-.74,15.11,8.19,31.35,17,49.93,17,14.14,0,29.64-5.11,47-19.5a8,8,0,1,0-10.22-12.31ZM45.11,79.8c31.83-26.37,53.72-14.49,79.07-.74,15.11,8.2,31.35,17,49.93,17,14.14,0,29.64-5.12,47-19.5a8,8,0,1,0-10.22-12.31c-31.83,26.38-53.72,14.5-79.07.74C105.21,50.58,75.06,34.22,34.89,67.5A8,8,0,1,0,45.11,79.8Z",
  ],
  buildings: [
    "M136,32V216H40V85.35a8,8,0,0,1,3.56-6.66l80-53.33A8,8,0,0,1,136,32Z",
    "M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z",
  ],
  tree: [
    "M32,192l56-72H48L128,16l80,104H168l56,72Z",
    "M230.31,187.09,184.36,128H208a8,8,0,0,0,6.34-12.88l-80-104a8,8,0,0,0-12.68,0l-80,104A8,8,0,0,0,48,128H71.64L25.69,187.09A8,8,0,0,0,32,200h88v40a8,8,0,0,0,16,0V200h88a8,8,0,0,0,6.31-12.91ZM48.36,184l46-59.09A8,8,0,0,0,88,112H64.25L128,29.12,191.75,112H168a8,8,0,0,0-6.31,12.91L207.64,184Z",
  ],
} as const;

function Glyph({ d, size, color }: { d: string | readonly string[]; size: number; color: string }) {
  const paths = typeof d === "string" ? [d] : d;
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      {paths.map((p, i) => (
        <path key={i} d={p} fill={color} opacity={paths.length > 1 && i === 0 ? 0.2 : 1} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------- the beats (local frames)

const W_CLAUDE = wordAt("s08", "Claude"); // 68
const W_SEARCHES = wordAt("s08", "searches"); // 82
const W_WEB = wordAt("s08", "web"); // 99
const W_FILES = wordAt("s08", "files"); // 116
const W_BRINGS = wordAt("s08", "brings"); // 140
const W_WHAT = wordAt("s08", "what"); // 160

const ASK = "Find three venues within an hour for our team day.";
const ASK0 = 4; // the person types
const ASK_PER = 0.85;
const SEARCH = W_CLAUDE - 2; // Claude starts searching
const WEB = [W_SEARCHES + 2, W_SEARCHES + 10, W_WEB + 1]; // the web pages land
const FILE = W_FILES; // the budget spreadsheet lands
const DONE = W_BRINGS - 10; // "Searched ..."
const ANSWER = W_BRINGS - 6; // Claude's line
const CARDS = [W_BRINGS + 3, W_BRINGS + 9, W_BRINGS + 15]; // the three venues
const BUDGET = [W_WHAT + 5, W_WHAT + 10, W_WHAT + 15]; // each marked in budget
const OUT = 218;

// where the chat sits on screen as it grows (the top of the column)
const SCROLL: [number, number, number][] = [
  [0, 0, 492],
  [SEARCH - 2, SEARCH + 14, 372],
  [ANSWER - 10, ANSWER + 10, 136],
];

const COL_X = 330;
const COL_W = 1260;
const ZOOM = 1.12; // the chat is drawn a touch larger than life, so it reads on a phone
// rows of the chat, in column coordinates
const Y_STATUS = 112;
const Y_WEB = 172;
const Y_FILE = 234;
const Y_ANSWER = 324;
const Y_CARDS = 392;

const VENUES = [
  { name: "Lakeside Pavilion", drive: "35 min", size: "up to 60", price: "$18", tile: "#E3F5F4", ink: T.a2, glyph: P.waves },
  { name: "Cedar Hall", drive: "42 min", size: "up to 80", price: "$22", tile: "#FFF3D6", ink: T.a3dark, glyph: P.buildings },
  { name: "Pine Hollow Lodge", drive: "55 min", size: "up to 50", price: "$15", tile: T.tint, ink: T.a1, glyph: P.tree },
];

const WEB_PAGES = ["Venues near Riverside", "Lakeside Pavilion rates", "Cedar Hall events"];

// ---------------------------------------------------------------- pieces

function Chip({ f, at, icon, children, tint }: { f: number; at: number; icon: ReactNode; children: ReactNode; tint?: boolean }) {
  const k = t01(f, at, at + 8, pop);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 50,
        padding: "0 18px 0 14px",
        borderRadius: 12,
        border: `1.5px solid ${tint ? "#B9E6E4" : T.line}`,
        background: tint ? "#F1FAF9" : T.card,
        boxShadow: "0 1px 2px rgba(30,27,34,0.04)",
        fontSize: 20,
        fontWeight: 520,
        color: T.ink2,
        whiteSpace: "nowrap",
        opacity: interpolate(f, [at, at + 5], [0, 1], clamp),
        transform: `translateY(${(1 - k) * 10}px) scale(${0.9 + 0.1 * k})`,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

function RowLabel({ children, opacity }: { children: ReactNode; opacity: number }) {
  return <div style={{ width: 150, flex: "none", fontSize: 19, fontWeight: 600, color: T.ink3, letterSpacing: 0.2, opacity }}>{children}</div>;
}

function VenueCard({ f, v, at, budgetAt }: { f: number; v: (typeof VENUES)[number]; at: number; budgetAt: number }) {
  const k = t01(f, at, at + 10, pop);
  const o = interpolate(f, [at, at + 6], [0, 1], clamp);
  const b = t01(f, budgetAt, budgetAt + 7, pop);
  return (
    <Card style={{ width: 400, overflow: "hidden", opacity: o, transform: `translateY(${(1 - k) * 28}px) scale(${0.96 + 0.04 * k})` }}>
      <div style={{ height: 150, background: v.tile, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Glyph d={v.glyph} size={78} color={v.ink} />
      </div>
      <div style={{ padding: "20px 24px 22px" }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.ink }}>{v.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10, fontSize: 21, color: T.ink2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Glyph d={P.car} size={21} color={T.ink3} /> {v.drive}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="users" size={21} color={T.ink3} /> {v.size}
          </span>
        </div>
        <div style={{ height: 1.5, background: T.line, margin: "16px 0 14px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 34 }}>
          <span style={{ fontSize: 24, fontWeight: 650, color: T.ink }}>
            {v.price} <span style={{ fontSize: 20, fontWeight: 450, color: T.ink2 }}>per person</span>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 17,
              fontWeight: 650,
              color: T.a2dark,
              background: "#E3F5F4",
              borderRadius: 999,
              padding: "4px 12px",
              opacity: b,
              transform: `scale(${0.6 + 0.4 * b})`,
              transformOrigin: "100% 50%",
            }}
          >
            <Icon name="check:bold" size={16} color={T.a2dark} /> In budget
          </span>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- the scene

export function S08() {
  const f = useCurrentFrame();

  let top = SCROLL[0][2];
  for (const [f0, f1, y] of SCROLL.slice(1)) top = top + (y - top) * t01(f, f0, f1, ease);

  const bubbleIn = t01(f, 0, 10);
  const status = t01(f, SEARCH, SEARCH + 8);
  const done = t01(f, DONE, DONE + 6);
  const label = t01(f, WEB[0] - 2, WEB[0] + 6);
  const labelFile = t01(f, FILE - 2, FILE + 6);
  const answer = t01(f, ANSWER, ANSWER + 6);
  const out = leave(f, OUT);

  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans }}>
      <AbsoluteFill style={{ ...out }}>
        <div style={{ position: "absolute", left: COL_X, top, width: COL_W, height: 800, transform: `scale(${ZOOM})`, transformOrigin: "50% 0%" }}>
          {/* the person's ask, typed */}
          <div style={{ position: "absolute", right: 0, top: 0, opacity: bubbleIn, transform: `translateY(${(1 - bubbleIn) * 16}px)` }}>
            <div style={{ background: T.bubble, borderRadius: 999, padding: "18px 30px", fontSize: 27, color: T.ink, fontWeight: 430, whiteSpace: "nowrap", minWidth: 60, minHeight: 69, boxSizing: "border-box" }}>
              <Typed text={ASK} start={ASK0} perChar={ASK_PER} f={f} />
            </div>
          </div>

          {/* Claude searching, then done */}
          {f >= SEARCH ? (
            <div style={{ position: "absolute", left: 0, top: Y_STATUS, display: "flex", alignItems: "center", gap: 16, opacity: status, transform: `translateY(${(1 - status) * 12}px)` }}>
              <ClaudeFace size={38} />
              <div style={{ position: "relative", width: 58, height: 32 }}>
                <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - done }}>
                  <ThinkingDots f={f} from={SEARCH} />
                </div>
                <div style={{ position: "absolute", left: 15, top: 3, opacity: done, transform: `scale(${0.6 + 0.4 * t01(f, DONE, DONE + 7, pop)})` }}>
                  <Icon name="check-circle:fill" size={27} color={T.a2} />
                </div>
              </div>
              <div style={{ position: "relative", fontSize: 23, fontWeight: 500, color: T.ink2, height: 32, width: 520 }}>
                <span style={{ position: "absolute", left: 0, top: 2, opacity: 1 - done, whiteSpace: "nowrap" }}>Searching the web and your files</span>
                <span style={{ position: "absolute", left: 0, top: 2, opacity: done, whiteSpace: "nowrap" }}>Searched 3 web pages and 1 file</span>
              </div>
            </div>
          ) : null}

          {/* the sources */}
          <div style={{ position: "absolute", left: 54, top: Y_WEB, display: "flex", alignItems: "center", gap: 12 }}>
            <RowLabel opacity={label}>The web</RowLabel>
            {WEB_PAGES.map((w, i) => (f >= WEB[i] ? <Chip key={w} f={f} at={WEB[i]} icon={<Glyph d={P.globe} size={22} color={T.ink3} />}>{w}</Chip> : null))}
          </div>
          <div style={{ position: "absolute", left: 54, top: Y_FILE, display: "flex", alignItems: "center", gap: 12 }}>
            <RowLabel opacity={labelFile}>Your files</RowLabel>
            {f >= FILE ? (
              <Chip f={f} at={FILE} tint icon={<Glyph d={P.fileXls} size={24} color={T.a2dark} />}>
                Team day budget.xlsx
              </Chip>
            ) : null}
          </div>

          {/* Claude brings back three venues */}
          {f >= ANSWER ? (
            <div style={{ position: "absolute", left: 0, top: Y_ANSWER, display: "flex", alignItems: "center", gap: 16, opacity: answer }}>
              <ClaudeFace size={38} />
              <ClaudeSays>
                <Stream text="Here are three, all within an hour and in your budget." start={ANSWER} f={f} perWord={2} />
              </ClaudeSays>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, top: Y_CARDS, display: "flex", gap: 30 }}>
            {VENUES.map((v, i) => (f >= CARDS[i] ? <VenueCard key={v.name} f={f} v={v} at={CARDS[i]} budgetAt={BUDGET[i]} /> : <div key={v.name} style={{ width: 400 }} />))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
