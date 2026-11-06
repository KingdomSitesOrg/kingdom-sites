// Style frame and motion test: person, Claude, person, with a guideline in
// between (Thomas, 2026-11-06). A staff request; Claude's draft; the pointer
// tries Send first and the school's guideline stops it ("Sorry, this can't go
// out yet"); the pointer presses Approve, which sinks and turns into "Approved"
// with a check; then Send goes through and turns into "Sent". Every press has a
// visible down state and a changed state after it.

import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { Card, ClaudeFace, Icon, Pointer, T, useV2Fonts } from "./ui.tsx";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);

// timing (frames at 30 fps)
export const APPROVE_DURATION = 180;
const TRY_SEND = 34; // blocked
const APPROVE = 92;
const SEND = 128;

// button centres in frame pixels (from the layout below)
const APPROVE_AT = { x: 1224, y: 806 }; // right of the label, so no word is covered
const SEND_AT = { x: 1442, y: 806 };
const ENTER = { x: 1700, y: 1130 };
const LEAVE = { x: 1780, y: 1150 };

/** 0 = up, 1 = fully down: down over 3 frames before the press, back up over 6 after. */
function pressAmount(f: number, at: number) {
  if (f < at - 3 || f > at + 6) return 0;
  return f <= at ? interpolate(f, [at - 3, at], [0, 1], clamp) : interpolate(f, [at, at + 6], [1, 0], clamp);
}

/** The pointer: a list of moves, each arriving 4 frames before its press and resting until it. */
function pointerAt(f: number) {
  const moves: [number, number, { x: number; y: number }][] = [
    [8, TRY_SEND - 4, SEND_AT],
    [TRY_SEND + 34, APPROVE - 4, APPROVE_AT],
    [APPROVE + 12, SEND - 4, SEND_AT],
    [SEND + 16, SEND + 36, LEAVE],
  ];
  let at = ENTER;
  for (const [f0, f1, to] of moves) {
    const t = interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: ease });
    at = { x: at.x + (to.x - at.x) * t, y: at.y + (to.y - at.y) * t };
  }
  const s = 1 - 0.1 * (pressAmount(f, TRY_SEND) + pressAmount(f, APPROVE) + pressAmount(f, SEND));
  return { ...at, s };
}

function Btn({ label, icon, bg, fg, press, style }: { label: string; icon?: string; bg: string; fg: string; press: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 64,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 24,
        fontWeight: 650,
        background: bg,
        color: fg,
        transform: `translateY(${press * 4}px) scale(${1 - press * 0.05})`,
        boxShadow: press > 0.01 ? `inset 0 3px 6px rgba(0,0,0,${0.18 * press})` : "0 2px 0 rgba(30,27,34,0.10), 0 6px 14px rgba(30,27,34,0.10)",
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={24} color={fg} /> : null}
      {label}
    </div>
  );
}

export function ApproveFrame() {
  useV2Fonts();
  const f = useCurrentFrame();
  const approved = interpolate(f, [APPROVE + 1, APPROVE + 5], [0, 1], clamp);
  const sent = interpolate(f, [SEND + 1, SEND + 5], [0, 1], clamp);
  const p = pointerAt(f);
  // the blocked Send: a short side-to-side shake right after the press
  const shake = f > TRY_SEND && f < TRY_SEND + 12 ? Math.sin((f - TRY_SEND) * 1.9) * 7 * (1 - (f - TRY_SEND) / 12) : 0;
  // the guideline note: pops in after the blocked press, leaves once Approve is pressed
  const noteIn = interpolate(f, [TRY_SEND + 3, TRY_SEND + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const noteOut = interpolate(f, [APPROVE + 2, APPROVE + 8], [1, 0], clamp);
  const note = noteIn * noteOut;
  const stamp = interpolate(f, [APPROVE + 2, APPROVE + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });

  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans }}>
      {/* the person's request */}
      <div style={{ position: "absolute", right: 410, top: 96, background: T.bubble, borderRadius: 999, padding: "20px 32px", fontSize: 28, color: T.ink, fontWeight: 430 }}>
        Can you write a note to Grade 4 families about Friday&rsquo;s field trip?
      </div>

      {/* Claude's reply */}
      <div style={{ position: "absolute", left: 410, top: 206, display: "flex", alignItems: "center", gap: 14 }}>
        <ClaudeFace size={40} />
        <span style={{ fontFamily: T.serif, fontSize: 34, color: T.ink, fontWeight: 420 }}>Here&rsquo;s a draft for you to check.</span>
      </div>

      <Card style={{ position: "absolute", left: 410, top: 284, width: 1100, height: 590, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 36px 18px" }}>
          <span style={{ fontSize: 26, fontWeight: 720, color: T.ink, letterSpacing: -0.2 }}>New message</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 650, color: T.a1dark, background: T.tint, borderRadius: 999, padding: "6px 14px" }}>
            <Icon name="sparkle:fill" size={18} color={T.a1} /> Drafted by Claude
          </span>
        </div>
        {[
          ["To", "Grade 4 families"],
          ["Subject", "Field trip this Friday"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 18, fontSize: 23, padding: "14px 36px", borderTop: `1.5px solid ${T.line}` }}>
            <span style={{ width: 96, color: T.ink3 }}>{k}</span>
            <span style={{ color: T.ink, fontWeight: 520 }}>{v}</span>
          </div>
        ))}
        <div style={{ borderTop: `1.5px solid ${T.line}`, padding: "22px 36px", fontSize: 24, lineHeight: 1.5, color: T.ink, fontWeight: 420, flex: 1 }}>
          <div>Hi families,</div>
          <div style={{ marginTop: 10 }}>
            On Friday, Grade 4 visits the science museum. Please pack a lunch, and send the signed permission slip back by Thursday.
          </div>
          <div style={{ marginTop: 10 }}>Thank you,<br />Ms. Reyes</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px 32px", height: 104 }}>
          <div style={{ opacity: stamp, transform: `scale(${0.6 + 0.4 * stamp})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 650, color: T.a2dark }}>
            <Icon name="check-circle:fill" size={30} color={T.a2} /> Approved by Maria Reyes &middot; 9:42 AM
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ position: "relative", width: 206, height: 64 }}>
              <Btn label="Approve" bg={T.a3} fg={T.ink} press={pressAmount(f, APPROVE)} style={{ position: "absolute", inset: 0, opacity: 1 - approved }} />
              <Btn label="Approved" icon="check:bold" bg={T.a2} fg="#fff" press={pressAmount(f, APPROVE)} style={{ position: "absolute", inset: 0, opacity: approved }} />
            </div>
            <div style={{ position: "relative", width: 206, height: 64, transform: `translateX(${shake}px)` }}>
              <Btn label="Send" icon="paper-plane-right:fill" bg={T.a1} fg="#fff" press={pressAmount(f, TRY_SEND) + pressAmount(f, SEND)} style={{ position: "absolute", inset: 0, opacity: 1 - sent }} />
              <Btn label="Sent" icon="check:bold" bg={T.ink} fg="#fff" press={pressAmount(f, SEND)} style={{ position: "absolute", inset: 0, opacity: sent }} />
            </div>
          </div>
        </div>
      </Card>

      {/* the guideline that stops an unapproved send */}
      <div
        style={{
          position: "absolute",
          left: 1062,
          top: 590,
          width: 520,
          opacity: note,
          transform: `translateY(${(1 - note) * 14}px) scale(${0.92 + 0.08 * note})`,
          transformOrigin: "75% 100%",
        }}
      >
        <div style={{ background: "#FFF8E6", border: "1.5px solid #F2D58C", borderRadius: 16, boxShadow: T.shadow, padding: "18px 22px", display: "flex", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.a3, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name="lock-simple" size={26} color={T.ink} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 23, fontWeight: 700, color: T.ink }}>Sorry, this can&rsquo;t go out yet.</span>
            <span style={{ fontSize: 20, lineHeight: 1.4, color: T.ink2 }}>School guideline: a teacher approves every message to families before it&rsquo;s sent.</span>
            <span style={{ fontSize: 16, color: T.ink3, marginTop: 4 }}>Set by Principal Ana Kim</span>
          </div>
        </div>
        {/* the little pointer down to Send */}
        <div style={{ position: "absolute", left: 366, bottom: -9, width: 18, height: 18, background: "#FFF8E6", borderRight: "1.5px solid #F2D58C", borderBottom: "1.5px solid #F2D58C", transform: "rotate(45deg)" }} />
      </div>

      <Pointer x={p.x} y={p.y} scale={p.s} />
    </AbsoluteFill>
  );
}
