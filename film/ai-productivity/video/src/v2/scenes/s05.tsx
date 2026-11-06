// Scene s05, "Paper to spreadsheet": "Snap a photo of a paper form, and Claude
// turns it into a clean spreadsheet."
//
// A phone's camera is over a handwritten sign-up sheet. On "Snap" the shutter
// sinks, the screen flashes white and the photo drops into the corner
// thumbnail. The photo lifts out of the phone and opens on the left, large
// enough to read; the phone and the paper go. Claude sits between the photo and
// an empty spreadsheet, reads the photo (a teal line sweeps down it), and on
// "clean spreadsheet" the rows fill one by one, each handwritten line lighting
// up as its tidy row lands. The sheet also tidies the writing: "kitchen",
// "SETUP" and "555 0142" come out as "Kitchen", "Setup" and "555-0142".
//
// Local, 0-based frames. Sounds: video/timeline/cues-v2/s05.json.
// Handwriting: Caveat (SIL Open Font License), public/fonts/Caveat-VF.ttf.

import { loadFont } from "@remotion/fonts";
import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";

import { clamp, leave, pop, pressAmount, sceneT, t01, wordAt } from "../kit.tsx";
import { Card, Icon, T } from "../ui.tsx";

const ID = "s05";
const LEN = sceneT(ID).length; // 180

// ---------------------------------------------------------------- the handwriting font
const HAND = "Caveat";
let handReady: Promise<void> | null = null;
function useHandFont() {
  if (!handReady) {
    handReady = loadFont({ family: HAND, url: staticFile("fonts/Caveat-VF.ttf"), weight: "400 700", display: "block" }).then(() => {
      if (!document.fonts.check(`500 30px "${HAND}"`)) throw new Error("fonts: Caveat did not load");
    });
  }
  const handle = delayRender("s05 handwriting font");
  handReady.then(
    () => continueRender(handle),
    (err) => cancelRender(err),
  );
}

// ---------------------------------------------------------------- the beats
const SNAP = wordAt(ID, "Snap"); // 15: the shutter is pressed
const W_CLAUDE = wordAt(ID, "Claude"); // 82
const W_CLEAN = wordAt(ID, "clean"); // 114
const FLASH = SNAP;
const THUMB = SNAP + 4; // the photo drops into the corner thumbnail
const LIFT0 = 29; // the photo lifts out of the phone ...
const LIFT1 = 52; // ... and opens on the left
const PHONE_OUT = 31; // the phone and the paper go
const SHEET_IN = 44;
const CLAUDE_IN = 50;
const SCAN0 = 57; // Claude reads the photo
const SCAN1 = 88;
const ROW0_AT = W_CLEAN - 22; // 92: the first row lands; one every 8 frames
const ROW_GAP = 8;
const DONE = ROW0_AT + ROW_GAP * 5 + 12; // "6 people" chip
const OUT = LEN - 8;

// ---------------------------------------------------------------- the people (samples)
type Person = { name: string; team: string; email: string; phone: string; hand: [string, string, string, string]; ink: string };
const BLUE = "#26418F";
const BLACK = "#2A2731";
const PEOPLE: Person[] = [
  { name: "Maya Torres", team: "Kitchen", email: "maya.t@example.org", phone: "555-0142", hand: ["Maya Torres", "kitchen", "maya.t@example.org", "555 0142"], ink: BLUE },
  { name: "Sam Okafor", team: "Setup", email: "sam.o@example.org", phone: "555-0187", hand: ["Sam Okafor", "SETUP", "sam.o@example.org", "555-0187"], ink: BLACK },
  { name: "Lena Fischer", team: "Greeters", email: "lena.f@example.org", phone: "555-0119", hand: ["Lena Fischer", "greeters", "lena.f@example.org", "555.0119"], ink: BLUE },
  { name: "David Cho", team: "Kitchen", email: "d.cho@example.org", phone: "555-0163", hand: ["David Cho", "Kitchen", "d.cho@example.org", "5550163"], ink: BLACK },
  { name: "Priya Shah", team: "Cleanup", email: "priya.s@example.org", phone: "555-0175", hand: ["Priya Shah", "clean up", "priya.s@example.org", "555 0175"], ink: BLUE },
  { name: "Tom Brennan", team: "Setup", email: "tom.b@example.org", phone: "555-0128", hand: ["Tom Brennan", "set-up", "tom.b@example.org", "555-0128"], ink: BLACK },
];
// a little life in each hand: x nudge (px) and tilt (deg), per row
const JITTER: [number, number][] = [
  [0, -1.2],
  [6, 0.8],
  [-2, -0.4],
  [4, 1.1],
  [0, -0.9],
  [8, 0.5],
];

// ---------------------------------------------------------------- the paper form (native size)
const PAPER = { w: 620, h: 760 };
const P_COLS = [170, 104, 196, 104]; // Name, Team, Email, Phone (inside 23 px margins)
const P_HEAD_Y = 128; // top of the printed column labels
const P_ROW0 = 172; // top of the first handwritten row
const P_ROW_H = 64;

function PaperForm({ hl = [], scanY = null }: { hl?: number[]; scanY?: number | null }) {
  const lineC = "#DCD5CA";
  const x0 = 23;
  const colX = P_COLS.map((_, i) => x0 + P_COLS.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div style={{ position: "relative", width: PAPER.w, height: PAPER.h, background: "#FFFEFA", fontFamily: T.sans, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: x0, top: 30, fontSize: 28, fontWeight: 750, color: "#26232B", letterSpacing: -0.2 }}>Volunteer Sign-Up</div>
      <div style={{ position: "absolute", left: x0, top: 70, fontSize: 17, color: "#6A6470" }}>Saturday cleanup &middot; Riverside Center</div>
      {/* printed column labels */}
      {["Name", "Team", "Email", "Phone"].map((l, i) => (
        <div key={l} style={{ position: "absolute", left: colX[i] + 6, top: P_HEAD_Y, fontSize: 17, fontWeight: 650, color: "#6A6470", letterSpacing: 0.4 }}>
          {l}
        </div>
      ))}
      {/* ruled lines */}
      {Array.from({ length: 9 }, (_, r) => (
        <div key={r} style={{ position: "absolute", left: x0, width: PAPER.w - x0 * 2, top: P_ROW0 - 8 + r * P_ROW_H, height: r === 0 ? 2 : 1.5, background: r === 0 ? "#B9B1A5" : lineC }} />
      ))}
      {colX.slice(1).map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: P_HEAD_Y - 4, width: 1.5, height: P_ROW0 - 8 + 8 * P_ROW_H - (P_HEAD_Y - 4), background: lineC }} />
      ))}
      {/* the highlight as Claude lifts each line */}
      {PEOPLE.map((_, r) => (
        <div
          key={`hl${r}`}
          style={{
            position: "absolute",
            left: x0 - 6,
            width: PAPER.w - x0 * 2 + 12,
            top: P_ROW0 - 6 + r * P_ROW_H,
            height: P_ROW_H - 4,
            borderRadius: 8,
            background: `rgba(31,175,172,${0.2 * (hl[r] ?? 0)})`,
            boxShadow: `inset 0 0 0 2px rgba(31,175,172,${0.55 * (hl[r] ?? 0)})`,
          }}
        />
      ))}
      {/* the handwriting */}
      {PEOPLE.map((p, r) => {
        const [dx, rot] = JITTER[r];
        const sizes = [30, 26, 21, 25];
        return (
          <div key={p.name} style={{ position: "absolute", left: 0, top: P_ROW0 + r * P_ROW_H, height: P_ROW_H, width: PAPER.w, transform: `rotate(${rot}deg)`, transformOrigin: "20% 50%" }}>
            {p.hand.map((txt, c) => (
              <div
                key={c}
                style={{
                  position: "absolute",
                  left: colX[c] + 6 + (c === 0 ? dx : dx / 2),
                  top: c === 0 ? 2 : 6 + (sizes[0] - sizes[c]) / 2,
                  fontFamily: HAND,
                  fontWeight: c === 0 ? 600 : 500,
                  fontSize: sizes[c],
                  lineHeight: 1.1,
                  color: p.ink,
                  whiteSpace: "nowrap",
                }}
              >
                {txt}
              </div>
            ))}
          </div>
        );
      })}
      {/* Claude's reading line */}
      {scanY !== null ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 90, height: 90, background: "linear-gradient(rgba(31,175,172,0), rgba(31,175,172,0.16))" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 1.5, height: 3, background: T.a2, boxShadow: "0 0 12px rgba(31,175,172,0.7)" }} />
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- the photo: the paper on a desk, 3:4
const PHOTO = { w: 660, h: 880 };
function PhotoContent({ hl, scanY }: { hl?: number[]; scanY?: number | null }) {
  return (
    <div style={{ position: "relative", width: PHOTO.w, height: PHOTO.h, background: "linear-gradient(160deg, #CDBFAE, #BFB09D)", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (PHOTO.w - PAPER.w) / 2,
          top: (PHOTO.h - PAPER.h) / 2,
          transform: "rotate(-1.6deg)",
          boxShadow: "0 3px 10px rgba(40,30,20,0.25)",
        }}
      >
        <PaperForm hl={hl} scanY={scanY} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the phone
const PHONE = { cx: 960, cy: 548, w: 400, h: 820, bezel: 14 };
const SCREEN = { w: PHONE.w - PHONE.bezel * 2, h: PHONE.h - PHONE.bezel * 2 };
const VIEW = { top: 118, scale: SCREEN.w / PHOTO.w }; // the camera view
const THUMB_R = { x: 34, y: 652, w: 48, h: 64 }; // in screen coordinates
const SHUTTER_Y = 684;

function phoneOrigin() {
  return { x: PHONE.cx - PHONE.w / 2, y: PHONE.cy - PHONE.h / 2 };
}

function Phone({ f }: { f: number }) {
  const down = pressAmount(f, SNAP);
  const flash = f < FLASH ? 0 : f <= FLASH + 1 ? interpolate(f, [FLASH, FLASH + 1], [0, 0.95], clamp) : interpolate(f, [FLASH + 1, FLASH + 11], [0.95, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const thumbK = interpolate(f, [THUMB, THUMB + 7], [0, 1], { ...clamp, easing: pop });
  const lifted = f >= LIFT0;
  const corners = t01(f, 4, 12);
  // the detected page, in camera-view coordinates
  const pw = PAPER.w * VIEW.scale;
  const ph = PAPER.h * VIEW.scale;
  const px = (SCREEN.w - pw) / 2;
  const py = (PHOTO.h * VIEW.scale - ph) / 2;
  const bracket = (style: CSSProperties) => <div style={{ position: "absolute", width: 34, height: 34, borderColor: T.a3, borderStyle: "solid", borderWidth: 0, ...style }} />;
  return (
    <div
      style={{
        position: "absolute",
        width: PHONE.w,
        height: PHONE.h,
        borderRadius: 64,
        background: "#1B1820",
        boxShadow: "inset 0 0 0 2px #3A3442, 0 30px 60px rgba(30,27,34,0.28), 0 6px 16px rgba(30,27,34,0.18)",
      }}
    >
      <div style={{ position: "absolute", left: PHONE.bezel, top: PHONE.bezel, width: SCREEN.w, height: SCREEN.h, borderRadius: 50, background: "#0E0C11", overflow: "hidden" }}>
        {/* the island */}
        <div style={{ position: "absolute", left: SCREEN.w / 2 - 58, top: 16, width: 116, height: 34, borderRadius: 20, background: "#000" }} />
        {/* the camera view: the paper on the desk, the page found */}
        <div style={{ position: "absolute", left: 0, top: VIEW.top, width: SCREEN.w, height: PHOTO.h * VIEW.scale, overflow: "hidden" }}>
          <div style={{ transform: `scale(${VIEW.scale})`, transformOrigin: "0 0" }}>
            <PhotoContent />
          </div>
          <div style={{ position: "absolute", left: px, top: py, width: pw, height: ph, transform: "rotate(-1.6deg)", opacity: corners * (1 - t01(f, FLASH, FLASH + 2)) }}>
            {bracket({ left: -6, top: -6, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 8 })}
            {bracket({ right: -6, top: -6, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 8 })}
            {bracket({ left: -6, bottom: -6, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 8 })}
            {bracket({ right: -6, bottom: -6, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 8 })}
          </div>
        </div>
        {/* the thumbnail of the last photo */}
        <div style={{ position: "absolute", left: THUMB_R.x, top: THUMB_R.y, width: THUMB_R.w, height: THUMB_R.h, borderRadius: 8, background: "#2A2630", overflow: "hidden", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }}>
          {!lifted ? (
            <div style={{ opacity: thumbK, transform: `scale(${(THUMB_R.w / PHOTO.w) * (0.6 + 0.4 * thumbK)})`, transformOrigin: "0 0" }}>
              <PhotoContent />
            </div>
          ) : null}
        </div>
        {/* the shutter */}
        <div style={{ position: "absolute", left: SCREEN.w / 2 - 44, top: SHUTTER_Y - 44, width: 88, height: 88, borderRadius: 99, border: "5px solid #fff", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: 99, background: down > 0.01 ? "#DCDCDC" : "#fff", transform: `scale(${1 - 0.14 * down})` }} />
        </div>
        {/* the switch-camera button */}
        <div style={{ position: "absolute", left: SCREEN.w - THUMB_R.x - 52, top: SHUTTER_Y - 26, width: 52, height: 52, borderRadius: 99, background: "#2A2630" }} />
        {/* the flash */}
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the spreadsheet
const SHEET = { x: 892, y: 262, w: 924 };
const S_HEAD_H = 112;
const S_COLS = [58, 226, 138, 300, 202]; // #, Name, Team, Email, Phone
const S_LABEL_H = 50;
const S_ROW_H = 58;
const SHEET_H = S_HEAD_H + S_LABEL_H + S_ROW_H * 6;

// Phosphor "table" (fill), MIT.
const TABLE_FILL = "M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM40,112H80v32H40Zm56,0H216v32H96ZM40,160H80v32H40Zm176,32H96V160H216v32Z";

function rowAt(i: number) {
  return ROW0_AT + i * ROW_GAP;
}

function Sheet({ f }: { f: number }) {
  const doneK = interpolate(f, [DONE, DONE + 8], [0, 1], { ...clamp, easing: pop });
  const colX = S_COLS.map((_, i) => S_COLS.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <Card style={{ position: "absolute", left: SHEET.x, top: SHEET.y, width: SHEET.w, height: SHEET_H, overflow: "hidden" }}>
      {/* header */}
      <div style={{ height: S_HEAD_H, display: "flex", alignItems: "center", gap: 18, padding: "0 30px", boxSizing: "border-box" }}>
        <div style={{ width: 54, height: 54, borderRadius: 12, background: "#E3F5F4", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg width={32} height={32} viewBox="0 0 256 256">
            <path d={TABLE_FILL} fill={T.a2dark} />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: T.ink, letterSpacing: -0.2 }}>Volunteer sign-ups</span>
          <span style={{ fontSize: 19, color: T.ink3 }}>Made by Claude from your photo</span>
        </div>
        <div
          style={{
            opacity: doneK,
            transform: `scale(${0.7 + 0.3 * doneK})`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 20,
            fontWeight: 650,
            color: T.a2dark,
            background: "#E6F6F5",
            border: "1.5px solid #B9E6E4",
            borderRadius: 999,
            padding: "6px 16px 6px 12px",
          }}
        >
          <Icon name="check:bold" size={20} color={T.a2dark} /> 6 people
        </div>
      </div>
      {/* the column labels */}
      <div style={{ position: "relative", height: S_LABEL_H, background: "#F7F4EF", borderTop: `1.5px solid ${T.line}`, borderBottom: `1.5px solid ${T.line}`, boxSizing: "border-box" }}>
        {["", "Name", "Team", "Email", "Phone"].map((l, i) => (
          <div key={i} style={{ position: "absolute", left: colX[i] + (i ? 18 : 0), width: i ? undefined : S_COLS[0], textAlign: i ? "left" : "center", top: 12, fontSize: 19, fontWeight: 650, color: T.ink2 }}>
            {l}
          </div>
        ))}
        {colX.slice(1).map((x, i) => (
          <div key={i} style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1.5, background: T.line }} />
        ))}
      </div>
      {/* the rows */}
      {PEOPLE.map((p, r) => {
        const at = rowAt(r);
        const flashK = f < at ? 0 : 1 - t01(f, at + 2, at + 18);
        const cells = ["", p.name, p.team, p.email, p.phone];
        return (
          <div key={p.name} style={{ position: "absolute", left: 0, right: 0, top: S_HEAD_H + S_LABEL_H + r * S_ROW_H, height: S_ROW_H, borderBottom: r < 5 ? `1.5px solid ${T.line}` : "none", boxSizing: "border-box", background: `rgba(31,175,172,${0.12 * flashK})` }}>
            <div style={{ position: "absolute", left: 0, width: S_COLS[0], top: 15, textAlign: "center", fontSize: 19, color: T.ink3, fontWeight: 500 }}>{r + 1}</div>
            {colX.slice(1).map((x, i) => (
              <div key={i} style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1.5, background: T.line }} />
            ))}
            {cells.slice(1).map((txt, c) => {
              const k = t01(f, at + c * 1.5, at + c * 1.5 + 6);
              return (
                <div key={c} style={{ position: "absolute", left: colX[c + 1] + 18, top: 13, fontSize: 22, fontWeight: c === 0 ? 560 : 430, color: T.ink, whiteSpace: "nowrap", opacity: k, transform: `translateX(${(1 - k) * -10}px)` }}>
                  {txt}
                </div>
              );
            })}
          </div>
        );
      })}
    </Card>
  );
}

// ---------------------------------------------------------------- the scene
const PHOTO_END = { x: 112, y: 153, s: 0.88 }; // the opened photo on the left

export function S05() {
  useHandFont();
  const f = useCurrentFrame();

  // phase A: the phone over the paper
  const aIn = t01(f, 0, 11);
  const phoneIn = t01(f, 0, 13); // the phone is raised over the paper (opaque: it never shows the paper through it)
  const phoneOp = t01(f, 0, 2);
  const aOut = t01(f, PHONE_OUT, PHONE_OUT + 12);
  const o = phoneOrigin();

  // the photo lifts out of the thumbnail and opens on the left
  const lift = interpolate(f, [LIFT0, LIFT1], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) });
  const sx = o.x + PHONE.bezel + THUMB_R.x;
  const sy = o.y + PHONE.bezel + THUMB_R.y;
  const s0 = THUMB_R.w / PHOTO.w;
  const ps = s0 + (PHOTO_END.s - s0) * lift;
  const px = sx + (PHOTO_END.x - sx) * lift;
  const py = sy + (PHOTO_END.y - sy) * lift - Math.sin(Math.PI * lift) * 60;
  const radius = 8 / s0 + (18 / PHOTO_END.s - 8 / s0) * lift;

  // Claude reads it, then lifts each line into the sheet
  const scanK = f >= SCAN0 && f <= SCAN1 + 4 ? t01(f, SCAN0, SCAN1, Easing.inOut(Easing.quad)) : null;
  const scanY = scanK === null ? null : P_ROW0 - 20 + scanK * (P_ROW_H * 6 + 30);
  const scanFade = scanK === null ? 0 : 1 - t01(f, SCAN1, SCAN1 + 4);
  const hl = PEOPLE.map((_, r) => {
    const at = rowAt(r);
    return f < at - 3 ? 0 : t01(f, at - 3, at) * (1 - t01(f, at + 6, at + 20));
  });

  const sheetK = t01(f, SHEET_IN, SHEET_IN + 12);
  const claudeK = interpolate(f, [CLAUDE_IN, CLAUDE_IN + 9], [0, 1], { ...clamp, easing: pop });
  // Claude breathes on its name, then once per row
  let pulse = Math.sin(Math.PI * t01(f, W_CLAUDE - 2, W_CLAUDE + 10, Easing.linear));
  for (let r = 0; r < 6; r++) pulse = Math.max(pulse, 0.5 * Math.sin(Math.PI * t01(f, rowAt(r) - 4, rowAt(r) + 4, Easing.linear)));
  const thinking = f >= SCAN0 && f < ROW0_AT + ROW_GAP * 5 + 6;

  const photoRight = PHOTO_END.x + PHOTO.w * PHOTO_END.s;
  const claudeX = (photoRight + SHEET.x) / 2;
  const claudeY = SHEET.y + SHEET_H / 2;

  return (
    <AbsoluteFill style={{ fontFamily: T.sans, color: T.ink, ...leave(f, OUT) }}>
      {/* phase A: the paper on the table, the phone over it */}
      {f < PHONE_OUT + 14 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 960 - PAPER.w / 2,
              top: 548 - PAPER.h / 2,
              opacity: aIn * (1 - aOut),
              transform: `translateY(${(1 - aIn) * 20 + aOut * 40}px) rotate(-4deg) scale(1.08)`,
              transformOrigin: "50% 50%",
              boxShadow: "0 4px 18px rgba(30,27,34,0.12)",
            }}
          >
            <div style={{ transform: "scale(1)", transformOrigin: "0 0" }}>
              <PaperForm />
            </div>
          </div>
          <div style={{ position: "absolute", left: o.x, top: o.y, opacity: phoneOp * (1 - aOut), transform: `translateY(${(1 - phoneIn) * 120 + aOut * 60}px)` }}>
            <Phone f={f} />
          </div>
        </>
      ) : null}

      {/* the spreadsheet */}
      {f >= SHEET_IN ? (
        <div style={{ opacity: sheetK, transform: `translateY(${(1 - sheetK) * 22}px)` }}>
          <Sheet f={f} />
        </div>
      ) : null}

      {/* Claude, between the photo and the sheet */}
      {f >= CLAUDE_IN ? (
        <div style={{ position: "absolute", left: claudeX - 36, top: claudeY - 36, opacity: claudeK, transform: `scale(${(0.6 + 0.4 * claudeK) * (1 + 0.08 * pulse)})` }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: T.a1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 18px rgba(238,79,110,${0.18 + 0.2 * pulse})` }}>
            <Icon name="sparkle:fill" size={44} color="#fff" />
          </div>
        </div>
      ) : null}
      {f >= CLAUDE_IN ? (
        <div style={{ position: "absolute", left: claudeX - 30, top: claudeY + 50, width: 60, display: "flex", justifyContent: "center", gap: 7, opacity: thinking ? claudeK : 0 }}>
          {[T.a1, T.a2, T.a3].map((c, i) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c, transform: `translateY(${Math.sin((f - SCAN0) * 0.6 - i * 0.9) * 3}px)` }} />
          ))}
        </div>
      ) : null}

      {/* the photo: lifted out of the phone, then open on the left */}
      {f >= LIFT0 ? (
        <div
          style={{
            position: "absolute",
            left: px,
            top: py,
            width: PHOTO.w,
            height: PHOTO.h,
            transform: `scale(${ps}) rotate(${-1.2 * lift}deg)`,
            transformOrigin: "0 0",
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: `0 ${12 / ps}px ${30 / ps}px rgba(30,27,34,${0.1 + 0.08 * Math.sin(Math.PI * lift)})`,
            border: `${1.5 / ps}px solid ${T.line}`,
          }}
        >
          <PhotoContent hl={hl} scanY={scanY !== null && scanFade > 0 ? scanY : null} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
