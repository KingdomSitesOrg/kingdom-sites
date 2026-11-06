// Scene s10, the end card: "Kingdom Sites sets it up for your team, so AI does
// the heavy lifting and your people get their time back."
//
// On "Kingdom Sites" the mark and the name arrive, then kingdom-sites.com, then
// a "Book a call" button. The pointer comes in and clicks it: the button sinks
// and turns into "Pick a time", and a small scheduler card with three times
// slides up. On "time" the pointer picks Thu 10:00 AM; on "back" the button
// becomes "Call booked · Thu 10:00 AM" with a check and the scheduler steps
// away. Everything is still from local frame ~208, under the film's fade to
// white and then black (drawn by FilmV2 over the last 60 frames). This scene
// does not clear.

import { AbsoluteFill, Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";

import { clamp, ease, pop, pressAmount, t01, wordAt } from "../kit.tsx";
import { Card, Icon, Pointer, T } from "../ui.tsx";

// Phosphor (MIT) path data not in icons.ts, viewBox 0 0 256 256.
const CALENDAR =
  "M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z";
const VIDEO =
  "M251.77,73a8,8,0,0,0-8.21.39L208,97.05V72a16,16,0,0,0-16-16H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V159l35.56,23.71A8,8,0,0,0,248,184a8,8,0,0,0,8-8V80A8,8,0,0,0,251.77,73ZM192,184H32V72H192V184Zm48-22.95-32-21.33V116.28L240,95Z";

function Glyph({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      <path d={d} fill={color} />
    </svg>
  );
}

// Kingdom Sites' own action blue (the mark's blue), for its button.
const KS_BLUE = "#0A63C9";
const KS_BLUE_DARK = "#0853A8";

// ---------------------------------------------------------------- the beats (local frames)

const W_SETS = wordAt("s10", "sets"); // 40
const W_TEAM = wordAt("s10", "team"); // 68
const W_PEOPLE = wordAt("s10", "people"); // 160
const W_TIME = wordAt("s10", "time"); // 180
const W_BACK = wordAt("s10", "back"); // 190

const MARK = 1; // the mark
const NAME = 10; // "Kingdom Sites"
const URL_IN = W_SETS + 2; // kingdom-sites.com
const BTN_IN = W_TEAM - 2; // Book a call
const PTR_IN = 112; // the pointer comes in
const BOOK = W_PEOPLE - 10; // the press on Book a call (150)
const SHEET_IN = BOOK + 3; // the scheduler slides up
const SLOT = W_TIME + 4; // the press on Thu 10:00 AM (184)
const BOOKED = W_BACK; // "Call booked · Thu 10:00 AM" (190)
const SHEET_OUT = BOOKED + 3;
const PTR_OUT0 = BOOKED + 4;
const PTR_OUT1 = BOOKED + 18; // all motion done by 208; the film fades from 210

// layout (frame pixels)
const CX = 960;
const BRAND_Y = 414; // centre of the mark + name row
const URL_Y = 508;
const BTN_Y = 594; // top of the button
const BTN_H = 78;
const BTN_W0 = 330;
const BTN_W1 = 500;
const SHEET_Y = 706; // top of the scheduler card
const SLOTS = ["Wed 2:00 PM", "Thu 10:00 AM", "Fri 11:30 AM"];
const SLOT_W = 200;
const SLOT_GAP = 14;
const SHEET_PAD = 24;
const SHEET_W = SLOT_W * 3 + SLOT_GAP * 2 + SHEET_PAD * 2;
const SLOT_Y = SHEET_Y + 20 + 30 + 18; // top of the slot row
const SLOT_H = 62;
const PRESS_BOOK = { x: CX + 112, y: BTN_Y + BTN_H / 2 + 2 }; // just right of "Book a call"
const PRESS_SLOT = { x: CX + 82, y: SLOT_Y + SLOT_H / 2 + 2 }; // just right of "Thu 10:00 AM"
const START = { x: 1560, y: 1150 };
const AWAY = { x: 1300, y: 1000 };

function pointerAt(f: number) {
  const moves: [number, number, { x: number; y: number }][] = [
    [PTR_IN, BOOK - 6, PRESS_BOOK],
    [BOOK + 8, SLOT - 5, PRESS_SLOT],
    [PTR_OUT0, PTR_OUT1, AWAY],
  ];
  let at = START;
  for (const [f0, f1, to] of moves) {
    const t = t01(f, f0, f1, ease);
    at = { x: at.x + (to.x - at.x) * t, y: at.y + (to.y - at.y) * t };
  }
  const o = interpolate(f, [PTR_IN, PTR_IN + 4, PTR_OUT0 + 6, PTR_OUT1], [0, 1, 1, 0], clamp);
  const s = 1 - 0.1 * Math.max(pressAmount(f, BOOK), pressAmount(f, SLOT));
  return { ...at, o, s };
}

export function S10() {
  const f = useCurrentFrame();
  const p = pointerAt(f);

  const mark = t01(f, MARK, MARK + 12, pop);
  const name = t01(f, NAME, NAME + 10);
  const url = t01(f, URL_IN, URL_IN + 10);
  const btn = t01(f, BTN_IN, BTN_IN + 10, pop);
  const hover = t01(f, BOOK - 8, BOOK - 3);

  // the button: one pill whose colour changes (Book a call → Pick a time → Call booked);
  // the old label leaves before the new one arrives, so labels never overlap
  const downBook = pressAmount(f, BOOK);
  const toWhite = t01(f, BOOK + 1, BOOK + 5);
  const toTeal = t01(f, BOOKED + 2, BOOKED + 6);
  const w = BTN_W0 + (BTN_W1 - BTN_W0) * t01(f, BOOKED - 2, BOOKED + 5, ease);
  const bookedPop = t01(f, BOOKED + 3, BOOKED + 12, pop);
  const labA = 1 - t01(f, BOOK + 1, BOOK + 3);
  const labB = t01(f, BOOK + 3, BOOK + 6) * (1 - t01(f, BOOKED + 1, BOOKED + 3));
  const labC = t01(f, BOOKED + 3, BOOKED + 7);
  const blue = interpolateColors(hover, [0, 1], [KS_BLUE, KS_BLUE_DARK]); // a touch darker under the pointer
  const pillBg = interpolateColors(toTeal, [0, 1], [interpolateColors(toWhite, [0, 1], [blue, T.card]), T.a2]);
  const pillLine = interpolateColors(toTeal, [0, 1], [blue, T.a2]);

  // the scheduler
  const sheetIn = t01(f, SHEET_IN, SHEET_IN + 11, ease);
  const sheetOut = t01(f, SHEET_OUT, SHEET_OUT + 9, ease);
  const sheetO = sheetIn * (1 - sheetOut);
  const downSlot = pressAmount(f, SLOT);
  const chosen = interpolate(f, [SLOT + 1, SLOT + 5], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans }}>
      {/* the mark and the name */}
      <div style={{ position: "absolute", left: 0, right: 0, top: BRAND_Y - 60, height: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ width: 116, height: 116, opacity: t01(f, MARK, MARK + 6), transform: `translateY(${(1 - mark) * 18}px) scale(${0.8 + 0.2 * mark})`, transformOrigin: "50% 100%" }}>
          <Img src={staticFile("v2/logo-mark.svg")} style={{ width: 116, height: 116, display: "block" }} />
        </div>
        <div style={{ fontSize: 84, fontWeight: 750, color: T.ink, letterSpacing: -1.5, opacity: name, transform: `translateX(${(1 - name) * -14}px)` }}>Kingdom Sites</div>
      </div>

      {/* the address */}
      <div style={{ position: "absolute", left: 0, right: 0, top: URL_Y - 24, textAlign: "center", fontSize: 38, fontWeight: 500, color: T.ink2, opacity: url, transform: `translateY(${(1 - url) * 14}px)` }}>kingdom-sites.com</div>

      {/* the scheduler: three times, slides up under the button */}
      {f >= SHEET_IN && sheetO > 0.001 ? (
        <Card
          style={{
            position: "absolute",
            left: CX - SHEET_W / 2,
            top: SHEET_Y,
            width: SHEET_W,
            padding: `20px ${SHEET_PAD}px 22px`,
            boxSizing: "border-box",
            opacity: sheetO,
            transform: `translateY(${(1 - sheetIn) * 30 + sheetOut * 16}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 30 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 23, fontWeight: 650, color: T.ink }}>
              <Glyph d={CALENDAR} size={24} color={KS_BLUE} /> This week
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 19, color: T.ink3 }}>
              <Glyph d={VIDEO} size={21} color={T.ink3} /> 30 min &middot; Video call
            </span>
          </div>
          <div style={{ display: "flex", gap: SLOT_GAP, marginTop: 18 }}>
            {SLOTS.map((s, i) => {
              const isPick = i === 1;
              const down = isPick ? downSlot : 0;
              const k = isPick ? chosen : 0;
              const dim = isPick ? 1 : 1 - 0.45 * chosen;
              return (
                <div key={s} style={{ position: "relative", width: SLOT_W, height: SLOT_H, opacity: dim }}>
                  {[0, 1].map((state) => (
                    <div
                      key={state}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 23,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        opacity: state === 0 ? 1 - k : k,
                        background: state === 0 ? T.card : T.a2,
                        color: state === 0 ? T.ink : "#fff",
                        border: `1.5px solid ${state === 0 ? (isPick && f >= SLOT - 8 ? KS_BLUE : "#D9D2C8") : T.a2}`,
                        transform: `translateY(${down * 3}px) scale(${1 - down * 0.05})`,
                        boxShadow: down > 0.01 ? "inset 0 3px 6px rgba(0,0,0,0.16)" : "0 1px 2px rgba(30,27,34,0.06)",
                      }}
                    >
                      {state === 1 ? <Icon name="check:bold" size={21} color="#fff" /> : null}
                      {s}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* the button: Book a call, then Pick a time, then Call booked */}
      <div
        style={{
          position: "absolute",
          left: CX - w / 2,
          top: BTN_Y,
          width: w,
          height: BTN_H,
          opacity: t01(f, BTN_IN, BTN_IN + 6),
          transform: `translateY(${(1 - btn) * 16}px) scale(${(0.9 + 0.1 * btn) * (1 + 0.04 * Math.sin(bookedPop * Math.PI))})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            overflow: "hidden",
            fontSize: 30,
            fontWeight: 650,
            background: pillBg,
            border: `2px solid ${pillLine}`,
            transform: `translateY(${downBook * 4}px) scale(${1 - downBook * 0.05})`,
            boxShadow: downBook > 0.01 ? "inset 0 3px 6px rgba(0,0,0,0.22)" : "0 2px 0 rgba(30,27,34,0.10), 0 8px 18px rgba(30,27,34,0.12)",
          }}
        >
          {/* the old label leaves before the new one arrives */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff", opacity: labA, whiteSpace: "nowrap" }}><Glyph d={CALENDAR} size={30} color="#fff" /> Book a call</div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, color: KS_BLUE, opacity: labB, whiteSpace: "nowrap" }}>Pick a time</div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff", opacity: labC, whiteSpace: "nowrap" }}><Icon name="check:bold" size={28} color="#fff" /> Call booked &middot; Thu 10:00 AM</div>
        </div>
      </div>

      <Pointer x={p.x} y={p.y} scale={p.s} opacity={p.o} />
    </AbsoluteFill>
  );
}
