// Scene 9 draft (Thomas, 2026-11-06): the email lives inside a Claude chat.
// The person asks for a note, Claude drafts it, the person says "Send it",
// Claude declines because of the team's guideline, the guideline pops up and
// flags a line, the person clicks into the email, selects the line, deletes it
// and types a new one, the guideline clears, and the person clicks Send
// themselves: the button sinks and turns into "Sent".

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { Card, ClaudeFace, Icon, Pointer, T, useV2Fonts } from "./ui.tsx";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const pop = Easing.out(Easing.back(1.5));

export const CHAT_SEND_DURATION = 300;

// the beats (frames at 30 fps)
const ASK2 = 12; // "Looks good. Send it." starts typing
const THINK = 44; // Claude's thinking dots
const REPLY = 56; // Claude's answer streams in
const FLAG = 66; // the line is flagged
const RULE = 72; // the guideline pops up
const ENTER = 118; // the pointer comes in
const SELECT0 = 150; // drag-select starts
const SELECT1 = 168; // ... and ends
const DELETE = 174; // the selection is deleted
const TYPE0 = 180; // the new line types in
const OK = 220; // the guideline clears
const SEND = 258; // the person presses Send

// measured positions (frame pixels)
const LINE_X0 = 287; // start of the flagged line
const LINE_Y = 499; // its centre
const LINE_X1 = 765; // end of the flagged line
const SEND_AT = { x: 1278, y: 622 }; // right of the "Send" label

const OLD_LINE = "Mark Davis still owes the $40 registration fee.";
const NEW_LINE = "Registration fees are due by Friday.";
const ASK2_TEXT = "Looks good. Send it.";
const REPLY_TEXT = "Sorry, I can’t send this one. Your guideline says a group email can’t mention someone’s payments.";

function pressAmount(f: number, at: number) {
  if (f < at - 3 || f > at + 6) return 0;
  return f <= at ? interpolate(f, [at - 3, at], [0, 1], clamp) : interpolate(f, [at, at + 6], [1, 0], clamp);
}

function Typed({ text, start, perChar, f }: { text: string; start: number; perChar: number; f: number }) {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - start) / perChar)));
  return <>{text.slice(0, n)}</>;
}

/** Claude's words fade in a word at a time, laid out from the start so nothing jumps. */
function Stream({ text, start, f, perWord = 2 }: { text: string; start: number; f: number; perWord?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ opacity: interpolate(f, [start + i * perWord, start + i * perWord + 5], [0, 1], clamp) }}>
          {w}{" "}
        </span>
      ))}
    </>
  );
}

function Caret({ f, from }: { f: number; from: number }) {
  const on = Math.floor((f - from) / 8) % 2 === 0 || f < from + 4;
  return <span style={{ display: "inline-block", width: 2.5, height: 30, background: T.ink, verticalAlign: "-6px", marginLeft: 1, opacity: on ? 1 : 0 }} />;
}

function Bubble({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: T.bubble, borderRadius: 999, padding: "18px 30px", fontSize: 27, color: T.ink, fontWeight: 430, ...style }}>{children}</div>;
}

function pointerAt(f: number) {
  const start = { x: 1700, y: 1150 };
  const moves: [number, number, { x: number; y: number }][] = [
    [ENTER, SELECT0 - 4, { x: LINE_X0, y: LINE_Y }],
    [SELECT0, SELECT1, { x: LINE_X1, y: LINE_Y }],
    [OK + 14, SEND - 4, SEND_AT],
    [SEND + 16, SEND + 36, { x: 1780, y: 1160 }],
  ];
  let at = start;
  for (const [f0, f1, to] of moves) {
    const t = interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: f0 === SELECT0 ? Easing.inOut(Easing.quad) : ease });
    at = { x: at.x + (to.x - at.x) * t, y: at.y + (to.y - at.y) * t };
  }
  // the I-beam over the text; hidden while typing, as on a real computer
  const mode: "arrow" | "text" = f < OK + 14 && f >= ENTER + 14 ? "text" : "arrow";
  const typingHide = f >= DELETE + 2 && f < OK + 12 ? 0 : 1;
  const visible = f >= ENTER ? typingHide : 0;
  return { ...at, mode, opacity: visible, s: 1 - 0.1 * pressAmount(f, SEND) };
}

export function ChatSendFrame() {
  useV2Fonts();
  const f = useCurrentFrame();
  const p = pointerAt(f);
  const flagged = f >= FLAG && f < DELETE;
  const flagIn = interpolate(f, [FLAG, FLAG + 6], [0, 1], clamp);
  const selN = f < SELECT0 ? 0 : Math.round(interpolate(f, [SELECT0, SELECT1], [0, OLD_LINE.length], { ...clamp, easing: Easing.inOut(Easing.quad) }));
  const ruleIn = interpolate(f, [RULE, RULE + 8], [0, 1], { ...clamp, easing: pop });
  const okT = interpolate(f, [OK, OK + 6], [0, 1], clamp);
  const ruleOut = interpolate(f, [OK + 30, OK + 38], [1, 0], clamp);
  const sent = interpolate(f, [SEND + 1, SEND + 5], [0, 1], clamp);
  const toast = interpolate(f, [SEND + 4, SEND + 12], [0, 1], { ...clamp, easing: pop });
  const think = f >= THINK && f < REPLY;

  let line: ReactNode;
  if (f < DELETE) {
    line = (
      <span
        style={{
          background: flagged ? `rgba(252,228,234,${flagIn})` : "transparent",
          textDecoration: flagged ? "underline wavy" : "none",
          textDecorationColor: `rgba(238,79,110,${flagIn})`,
          textUnderlineOffset: 7,
          textDecorationThickness: 2,
          borderRadius: 4,
        }}
      >
        <span style={{ background: selN ? "#CFE2FF" : "transparent" }}>{OLD_LINE.slice(0, selN)}</span>
        {OLD_LINE.slice(selN)}
      </span>
    );
  } else {
    line = (
      <>
        <Typed text={NEW_LINE} start={TYPE0} perChar={1} f={f} />
        {f < OK + 14 ? <Caret f={f} from={DELETE} /> : null}
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans }}>
      {/* the person's first request */}
      <Bubble style={{ position: "absolute", right: 570, top: 60 }}>Write a note to all volunteers about Saturday&rsquo;s cleanup.</Bubble>

      {/* Claude: the draft */}
      <div style={{ position: "absolute", left: 250, top: 160, display: "flex", alignItems: "center", gap: 14 }}>
        <ClaudeFace size={38} />
        <span style={{ fontFamily: T.serif, fontSize: 32, color: T.ink, fontWeight: 420 }}>Here&rsquo;s a draft.</span>
      </div>

      <Card style={{ position: "absolute", left: 250, top: 222, width: 1100, height: 462, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, padding: "16px 36px", height: 62 }}>
          <span style={{ width: 90, color: T.ink3 }}>To</span>
          <span style={{ color: T.ink, fontWeight: 520, flex: 1 }}>All volunteers (42)</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 650, color: T.a1dark, background: T.tint, borderRadius: 999, padding: "5px 13px" }}>
            <Icon name="sparkle:fill" size={17} color={T.a1} /> Drafted by Claude
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, padding: "0 36px", height: 58, borderTop: `1.5px solid ${T.line}` }}>
          <span style={{ width: 90, color: T.ink3 }}>Subject</span>
          <span style={{ color: T.ink, fontWeight: 520 }}>Saturday cleanup at Riverside Park</span>
        </div>
        <div style={{ borderTop: `1.5px solid ${T.line}`, padding: "18px 36px 0", fontSize: 23, lineHeight: 1.5, color: T.ink, fontWeight: 420, flex: 1 }}>
          <div>Hi everyone,</div>
          <div style={{ marginTop: 8 }}>Thanks for signing up for Saturday&rsquo;s cleanup. We meet at 9 AM by the north gate. Gloves and bags are provided.</div>
          <div style={{ marginTop: 8, minHeight: 34 }}>{line}</div>
          <div style={{ marginTop: 8 }}>See you there, Maria</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px 26px", height: 96 }}>
          <div style={{ opacity: toast, transform: `scale(${0.7 + 0.3 * toast})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 650, color: T.a2dark }}>
            <Icon name="check-circle:fill" size={28} color={T.a2} /> Sent to 42 volunteers &middot; 9:42 AM
          </div>
          <div style={{ position: "relative", width: 206, height: 62 }}>
            {[
              { label: "Send", icon: "paper-plane-right:fill", bg: T.a1, o: 1 - sent },
              { label: "Sent", icon: "check:bold", bg: T.ink, o: sent },
            ].map((b) => (
              <div
                key={b.label}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: b.o,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 23,
                  fontWeight: 650,
                  background: b.bg,
                  color: "#fff",
                  transform: `translateY(${pressAmount(f, SEND) * 4}px) scale(${1 - pressAmount(f, SEND) * 0.05})`,
                  boxShadow: pressAmount(f, SEND) > 0.01 ? `inset 0 3px 6px rgba(0,0,0,0.2)` : "0 2px 0 rgba(30,27,34,0.10), 0 6px 14px rgba(30,27,34,0.10)",
                }}
              >
                <Icon name={b.icon} size={23} color="#fff" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* the person: "Looks good. Send it." */}
      {f >= ASK2 ? (
        <Bubble style={{ position: "absolute", right: 570, top: 716 }}>
          <Typed text={ASK2_TEXT} start={ASK2} perChar={1.2} f={f} />
        </Bubble>
      ) : null}

      {/* Claude declines */}
      {think ? (
        <div style={{ position: "absolute", left: 250, top: 828, display: "flex", gap: 9, alignItems: "center" }}>
          {[T.a1, T.a2, T.a3].map((c, i) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, transform: `translateY(${Math.sin((f - THINK) * 0.6 - i * 0.9) * 4}px)` }} />
          ))}
        </div>
      ) : null}
      {f >= REPLY ? (
        <div style={{ position: "absolute", left: 250, top: 806, width: 1100, display: "flex", gap: 14 }}>
          <ClaudeFace size={38} />
          <div style={{ fontFamily: T.serif, fontSize: 32, lineHeight: 1.3, color: T.ink, fontWeight: 420, marginTop: -2 }}>
            <Stream text={REPLY_TEXT} start={REPLY} f={f} />
          </div>
        </div>
      ) : null}

      {/* the guideline pops up beside the flagged line, then clears once the line is fixed */}
      {f >= RULE ? (
        <div
          style={{
            position: "absolute",
            left: 1384,
            top: 436,
            width: 500,
            opacity: ruleIn * ruleOut,
            transform: `translateY(${(1 - ruleIn) * 12}px) scale(${0.94 + 0.06 * ruleIn})`,
            transformOrigin: "0% 50%",
          }}
        >
          <div
            style={{
              position: "relative",
              background: okT > 0.5 ? "#E8F7F6" : "#FFF8E6",
              border: `1.5px solid ${okT > 0.5 ? "#B9E6E4" : "#F2D58C"}`,
              borderRadius: 16,
              boxShadow: T.shadow,
              padding: "16px 20px",
              display: "flex",
              gap: 14,
            }}
          >
            {/* the little arrow pointing back at the flagged line */}
            <div style={{ position: "absolute", left: -10, top: 52, width: 18, height: 18, background: okT > 0.5 ? "#E8F7F6" : "#FFF8E6", borderLeft: `1.5px solid ${okT > 0.5 ? "#B9E6E4" : "#F2D58C"}`, borderBottom: `1.5px solid ${okT > 0.5 ? "#B9E6E4" : "#F2D58C"}`, transform: "rotate(45deg)" }} />
            <div style={{ width: 42, height: 42, borderRadius: 11, background: okT > 0.5 ? T.a2 : T.a3, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon name={okT > 0.5 ? "check:bold" : "lock-simple"} size={24} color={okT > 0.5 ? "#fff" : T.ink} />
            </div>
            {okT > 0.5 ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: T.a2dark }}>Meets your guidelines</span>
                <span style={{ fontSize: 17, color: T.ink2 }}>Ready for you to send.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>Guideline: group emails</span>
                <span style={{ fontSize: 19, lineHeight: 1.35, color: T.ink2 }}>Never mention a person&rsquo;s payments in an email to a group.</span>
                <span style={{ fontSize: 15, color: T.ink3, marginTop: 3 }}>Set by Ana Kim, Operations</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Pointer x={p.x} y={p.y} scale={p.s} mode={p.mode} opacity={p.opacity} />
    </AbsoluteFill>
  );
}
