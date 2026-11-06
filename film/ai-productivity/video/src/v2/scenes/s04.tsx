// Scene s04, "Meet Claude": "Meet Claude, an AI assistant. Teach it your
// handbook and policies once, and your whole team can use it."
//
// Beat 1 (Meet Claude): the Claude square, the name and "AI assistant", centred.
// Beat 2 (Teach it): the square flies into the header of a shared Claude
// project, "Riverside Center: Front desk"; the handbook, the policies and the
// style guide drop into its Project knowledge list on their words.
// Beat 3 (whole team): the Share button is pressed; it sinks, then opens out
// into "Shared with 14 people" with a small stack of faces.
//
// Local, 0-based frames. Sounds: video/timeline/cues-v2/s04.json.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";

import { clamp, leave, pop, pressAmount, sceneT, t01, wordAt } from "../kit.tsx";
import { Card, Face, Icon, Pointer, T } from "../ui.tsx";

const ID = "s04";
const LEN = sceneT(ID).length; // 255

// ---------------------------------------------------------------- the beats
const W_CLAUDE = wordAt(ID, "Claude"); // 26
const W_AI = wordAt(ID, "AI"); // 54
const W_HANDBOOK = wordAt(ID, "handbook"); // 119
const W_POLICIES = wordAt(ID, "policies"); // 138
const W_ONCE = wordAt(ID, "once"); // 157
const W_WHOLE = wordAt(ID, "whole"); // 190

const NAME_IN = W_CLAUDE - 4; // the name rises in on "Claude"
const PILL_IN = W_AI - 3; // "AI assistant" on "AI"
const INTRO_OUT = 84; // the name and the pill lift away
const FLY0 = 88; // the square flies into the project header ...
const FLY1 = 110; // ... and lands
const CARD_IN = 92; // the project card rises in
const LANDS = [W_HANDBOOK + 4, W_POLICIES + 4, W_ONCE + 3]; // each file lands
const DROP = 11; // frames a file falls for
const PRESS = W_WHOLE + 6; // Share is pressed, between "whole" and "team"
const POINTER_IN = PRESS - 30;
const OUT = LEN - 8; // everything clears

// ---------------------------------------------------------------- layout (frame pixels)
const CARD = { x: 410, y: 160, w: 1100, h: 760 };
const PAD = 44;
const HEAD_SQ = { x: CARD.x + PAD, y: CARD.y + 42, size: 64 }; // the square's home in the header
const INTRO_SQ = { cx: 960, cy: 400, size: 148 };
const ROW0 = CARD.y + 290; // first knowledge row
const ROW_H = 94;
const ROW_PITCH = 108;
const SHARE = { right: CARD.x + CARD.w - PAD, top: CARD.y + 44, h: 60, w0: 164, w1: 428 };

const FILES = [
  { name: "Member Handbook 2026.pdf", meta: "PDF · 48 pages", icon: "file-pdf:fill", tint: T.tint, ink: T.a1 },
  { name: "Policies.docx", meta: "Document · 12 pages", icon: "doc", tint: "#E3F5F4", ink: T.a2dark },
  { name: "Style guide.pdf", meta: "PDF · 6 pages", icon: "file-pdf:fill", tint: "#FFF1D2", ink: T.a3dark },
];

// Phosphor "file-doc" (fill), MIT, path data from @phosphor-icons/core.
const FILE_DOC =
  "M44,120H212.07a4,4,0,0,0,4-4V88a8,8,0,0,0-2.34-5.66l-56-56A8,8,0,0,0,152.05,24H56A16,16,0,0,0,40,40v76A4,4,0,0,0,44,120Zm108-76,44,44h-44ZM52,144H36a8,8,0,0,0-8,8v56a8,8,0,0,0,8,8H51.33C71,216,87.55,200.52,88,180.87A36,36,0,0,0,52,144Zm-.49,56H44V160h8a20,20,0,0,1,20,20.77C71.59,191.59,62.35,200,51.52,200Zm170.67-4.28a8.26,8.26,0,0,1-.73,11.09,30,30,0,0,1-21.4,9.19c-17.65,0-32-16.15-32-36s14.36-36,32-36a30,30,0,0,1,21.4,9.19,8.26,8.26,0,0,1,.73,11.09,8,8,0,0,1-11.9.38A14.21,14.21,0,0,0,200.06,160c-8.82,0-16,9-16,20s7.18,20,16,20a14.25,14.25,0,0,0,10.23-4.66A8,8,0,0,1,222.19,195.72ZM128,144c-17.65,0-32,16.15-32,36s14.37,36,32,36,32-16.15,32-36S145.69,144,128,144Zm0,56c-8.83,0-16-9-16-20s7.18-20,16-20,16,9,16,20S136.86,200,128,200Z";
// Phosphor "user-plus" (regular), MIT.
const USER_PLUS =
  "M256,136a8,8,0,0,1-8,8H232v16a8,8,0,0,1-16,0V144H200a8,8,0,0,1,0-16h16V112a8,8,0,0,1,16,0v16h16A8,8,0,0,1,256,136Zm-57.87,58.85a8,8,0,0,1-12.26,10.3C165.75,181.19,138.09,168,108,168s-57.75,13.19-77.87,37.15a8,8,0,0,1-12.25-10.3c14.94-17.78,33.52-30.41,54.17-37.17a68,68,0,1,1,71.9,0C164.6,164.44,183.18,177.07,198.13,194.85ZM108,152a52,52,0,1,0-52-52A52.06,52.06,0,0,0,108,152Z";

function PathIcon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      <path d={d} fill={color} />
    </svg>
  );
}

/** The Claude square (same look as ClaudeFace), with a breath on its sparkle. */
function ClaudeSquare({ size, breathe = 0 }: { size: number; breathe?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: T.a1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${1 + 0.12 * breathe})` }}>
        <Icon name="sparkle:fill" size={size * 0.62} color="#fff" />
      </div>
    </div>
  );
}

function FileRow({ file, style, done }: { file: (typeof FILES)[number]; style?: CSSProperties; done: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x + PAD,
        width: CARD.w - PAD * 2,
        height: ROW_H,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 24px 0 18px",
        boxSizing: "border-box",
        background: T.card,
        border: `1.5px solid ${T.line}`,
        borderRadius: 14,
        ...style,
      }}
    >
      <div style={{ width: 58, height: 58, borderRadius: 12, background: file.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        {file.icon === "doc" ? <PathIcon d={FILE_DOC} size={34} color={file.ink} /> : <Icon name={file.icon} size={34} color={file.ink} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <span style={{ fontSize: 25, fontWeight: 650, color: T.ink }}>{file.name}</span>
        <span style={{ fontSize: 19, color: T.ink3, fontWeight: 450 }}>{file.meta}</span>
      </div>
      <div style={{ opacity: done, transform: `scale(${0.6 + 0.4 * done})` }}>
        <Icon name="check-circle:fill" size={32} color={T.a2} />
      </div>
    </div>
  );
}

/** Share: sinks on the press, then the one pill changes: its label fades, it
 * widens and turns teal, and "Shared with 14 people" fades in with the faces. */
function ShareButton({ f }: { f: number }) {
  const down = pressAmount(f, PRESS);
  const grow = t01(f, PRESS + 1, PRESS + 10);
  const tone = t01(f, PRESS + 1, PRESS + 7);
  const before = 1 - t01(f, PRESS + 1, PRESS + 4);
  const after = t01(f, PRESS + 6, PRESS + 11);
  const w = SHARE.w0 + (SHARE.w1 - SHARE.w0) * grow;
  const faces: [string, string][] = [
    ["AK", T.a3dark],
    ["JL", T.a1],
    ["MR", T.a2],
    ["DP", T.side],
  ];
  const lift = 1 - tone; // the raised shadow belongs to the button, not to the shared state
  return (
    <div
      style={{
        position: "absolute",
        left: SHARE.right - w,
        top: SHARE.top,
        width: w,
        height: SHARE.h,
        boxSizing: "border-box",
        borderRadius: 999,
        background: interpolateColors(tone, [0, 1], [T.a1, "#E6F6F5"]),
        border: `1.5px solid ${interpolateColors(tone, [0, 1], ["rgba(185,230,228,0)", "#B9E6E4"])}`,
        boxShadow:
          down > 0.01
            ? "inset 0 3px 6px rgba(0,0,0,0.2)"
            : `0 2px 0 rgba(30,27,34,${0.1 * lift}), 0 6px 14px rgba(30,27,34,${0.1 * lift})`,
        transform: `translateY(${down * 4}px) scale(${1 - down * 0.05})`,
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {/* before: Share */}
      <div style={{ position: "absolute", inset: 0, opacity: before, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 23, fontWeight: 650, color: "#fff" }}>
        <PathIcon d={USER_PLUS} size={25} color="#fff" />
        Share
      </div>
      {/* after: Shared with 14 people */}
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: SHARE.w1, opacity: after, display: "flex", alignItems: "center", gap: 14, padding: "0 24px 0 12px", boxSizing: "border-box", fontSize: 22, fontWeight: 650, color: T.a2dark }}>
        <div style={{ display: "flex", flex: "none" }}>
          {faces.map(([ini, c], i) => {
            const k = interpolate(f, [PRESS + 7 + i * 3, PRESS + 14 + i * 3], [0, 1], { ...clamp, easing: pop });
            return (
              <div key={ini} style={{ marginLeft: i ? -6 : 0, border: "2.5px solid #E6F6F5", borderRadius: 11, opacity: k, transform: `scale(${0.5 + 0.5 * k})` }}>
                <Face initials={ini} color={c} size={36} />
              </div>
            );
          })}
        </div>
        <span>Shared with 14 people</span>
      </div>
    </div>
  );
}

function pointerAt(f: number) {
  const start = { x: 1760, y: 1150 };
  const at = { x: SHARE.right - 26, y: SHARE.top + SHARE.h / 2 + 6 }; // just right of the "Share" label
  const away = { x: 1790, y: 1140 };
  const a = t01(f, POINTER_IN, PRESS - 4);
  const b = interpolate(f, [PRESS + 3, PRESS + 24], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.1, 0.4, 1) });
  const x = start.x + (at.x - start.x) * a + (away.x - at.x) * b;
  const y = start.y + (at.y - start.y) * a + (away.y - at.y) * b;
  return { x, y, s: 1 - 0.1 * pressAmount(f, PRESS), o: f >= POINTER_IN && f < PRESS + 24 ? 1 : 0 };
}

function Abs({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", ...style }}>{children}</div>;
}

export function S04() {
  const f = useCurrentFrame();

  // ---- beat 1: the introduction
  const sqIn = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: pop });
  const sqFade = t01(f, 0, 7);
  const breathe = Math.sin(Math.PI * t01(f, W_CLAUDE - 2, W_CLAUDE + 12));
  const nameK = t01(f, NAME_IN, NAME_IN + 10);
  const pillK = t01(f, PILL_IN, PILL_IN + 9);
  const introOut = t01(f, INTRO_OUT, INTRO_OUT + 9);

  // the square's flight from the centre into the project header
  const fly = interpolate(f, [FLY0, FLY1], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const sqSize = INTRO_SQ.size + (HEAD_SQ.size - INTRO_SQ.size) * fly;
  const sqX = INTRO_SQ.cx - INTRO_SQ.size / 2 + (HEAD_SQ.x - (INTRO_SQ.cx - INTRO_SQ.size / 2)) * fly;
  const rise = t01(f, NAME_IN - 4, NAME_IN + 9); // the square makes room for the name
  const introTop = 540 + (INTRO_SQ.cy - 540) * rise - INTRO_SQ.size / 2;
  const sqY = introTop + (HEAD_SQ.y - introTop) * fly - Math.sin(Math.PI * fly) * 30;

  // ---- beat 2: the project
  const cardK = t01(f, CARD_IN, CARD_IN + 12);
  const headK = t01(f, FLY1 - 6, FLY1 + 4);
  const knowK = t01(f, FLY1 - 2, FLY1 + 8);
  const landed = LANDS.filter((l) => f >= l).length;

  // the dashed "Add files" row makes room just before each file lands
  const slot = LANDS.reduce((n, l) => n + t01(f, l - DROP, l - 3), 0);
  const addY = ROW0 + slot * ROW_PITCH;

  const out = leave(f, OUT);
  const p = pointerAt(f);

  return (
    <AbsoluteFill style={{ fontFamily: T.sans, color: T.ink, ...out }}>
      {/* beat 1: the name and what it is */}
      {f < INTRO_OUT + 10 ? (
        <>
          <Abs
            style={{
              left: 0,
              right: 0,
              top: 500,
              textAlign: "center",
              fontFamily: T.serif,
              fontSize: 128,
              lineHeight: 1,
              fontWeight: 430,
              letterSpacing: -1.5,
              opacity: nameK * (1 - introOut),
              transform: `translateY(${(1 - nameK) * 22 - introOut * 18}px)`,
            }}
          >
            Claude
          </Abs>
          <Abs style={{ left: 0, right: 0, top: 672, display: "flex", justifyContent: "center", opacity: pillK * (1 - introOut), transform: `translateY(${(1 - pillK) * 16 - introOut * 18}px)` }}>
            <div style={{ background: T.card, border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "12px 30px", fontSize: 30, fontWeight: 520, color: T.ink2, boxShadow: T.shadow }}>
              AI assistant
            </div>
          </Abs>
        </>
      ) : null}

      {/* beat 2: the shared project */}
      {f >= CARD_IN ? (
        <Card
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            height: CARD.h,
            opacity: cardK,
            transform: `translateY(${(1 - cardK) * 26}px)`,
          }}
        >
          {null}
        </Card>
      ) : null}

      {f >= CARD_IN ? (
        <>
          {/* header: name and description (the square lands to their left) */}
          <Abs style={{ left: HEAD_SQ.x + HEAD_SQ.size + 22, top: CARD.y + 40, opacity: headK, transform: `translateX(${(1 - headK) * -10}px)` }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.3, color: T.ink }}>Riverside Center: Front desk</div>
            <div style={{ fontSize: 21, color: T.ink2, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="users" size={21} color={T.ink3} /> Team project
            </div>
          </Abs>
          <div style={{ opacity: headK }}>
            <ShareButton f={f} />
          </div>
          <Abs style={{ left: CARD.x, top: CARD.y + 146, width: CARD.w, height: 1.5, background: T.line, opacity: cardK }} />

          {/* Project knowledge */}
          <Abs style={{ left: CARD.x + PAD, top: CARD.y + 178, width: CARD.w - PAD * 2, opacity: knowK, transform: `translateY(${(1 - knowK) * 12}px)` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 27, fontWeight: 700 }}>Project knowledge</span>
              <span style={{ fontSize: 21, color: T.ink3, fontWeight: 500 }}>{landed === 0 ? "" : landed === 1 ? "1 file" : `${landed} files`}</span>
            </div>
            <div style={{ fontSize: 22, color: T.ink2, marginTop: 6 }}>Claude reads these before it answers.</div>
          </Abs>

          {/* the dashed drop zone */}
          <Abs
            style={{
              left: CARD.x + PAD,
              top: addY,
              width: CARD.w - PAD * 2,
              height: 80,
              boxSizing: "border-box",
              border: `2px dashed #DCD4C9`,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontSize: 22,
              fontWeight: 550,
              color: T.ink3,
              opacity: knowK,
            }}
          >
            <Icon name="plus" size={22} color={T.ink3} /> Add files
          </Abs>

          {/* the files drop in on their words */}
          {FILES.map((file, i) => {
            const land = LANDS[i];
            if (f < land - DROP) return null;
            const fall = interpolate(f, [land - DROP, land], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0.45) });
            const settle = f >= land ? Math.sin(Math.PI * t01(f, land, land + 7, Easing.linear)) : 0;
            const air = 1 - fall;
            const y = ROW0 + i * ROW_PITCH - air * 46;
            const done = interpolate(f, [land + 6, land + 12], [0, 1], { ...clamp, easing: pop });
            return (
              <FileRow
                key={file.name}
                file={file}
                done={done}
                style={{
                  top: y,
                  opacity: t01(f, land - DROP, land - DROP + 5),
                  transform: `rotate(${-1.8 * air}deg) scale(${1 + 0.07 * air - 0.012 * settle})`,
                  boxShadow: `0 ${4 + 18 * air}px ${10 + 30 * air}px rgba(30,27,34,${0.06 + 0.08 * air})`,
                  zIndex: 2,
                }}
              />
            );
          })}
        </>
      ) : null}

      {/* the Claude square: centred in beat 1, then the project's icon */}
      <Abs
        style={{
          left: sqX,
          top: sqY,
          opacity: sqFade,
          transform: `scale(${0.72 + 0.28 * sqIn})`,
          transformOrigin: "50% 50%",
          filter: fly > 0 && fly < 1 ? `drop-shadow(0 ${10 * Math.sin(Math.PI * fly)}px ${16 * Math.sin(Math.PI * fly)}px rgba(30,27,34,0.18))` : undefined,
        }}
      >
        <ClaudeSquare size={sqSize} breathe={breathe} />
      </Abs>

      <Pointer x={p.x} y={p.y} scale={p.s} opacity={p.o} />
    </AbsoluteFill>
  );
}
