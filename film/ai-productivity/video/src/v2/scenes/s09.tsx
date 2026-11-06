// Scene s09, "You bring the creative ideas. Claude follows the guidelines you
// set, and the final send is always yours."
//
// The approved send flow (ChatSendFrame.tsx), retimed to the line. On "creative
// ideas" the person asks for a note and Claude drafts it. The person says
// "Looks good. Send it." On "Claude follows the guidelines" Claude declines,
// the line that breaks the team's guideline is flagged and the guideline pops
// up beside it. The person selects the line, deletes it and types a new one,
// and on "final" the guideline turns to "Meets your guidelines". Just after
// "send" the person clicks Send themselves: it sinks and turns into "Sent", and
// "Sent to 42 volunteers" appears while the narrator says "is always yours".
//
// Kept from the approved draft: the I-beam over the text, the selection
// highlight, the caret, the decline without any shake, the pop-up with its
// little arrow at the flagged line, and the pointer pressing just right of the
// "Send" label. Everything sits 50 px further left than the draft so the
// pop-up stays inside the title-safe area.

import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { Bubble, Caret, PressButton, Stream, ThinkingDots, Typed, clamp, ease, leave, pop, pressAmount, t01, wordAt } from "../kit.tsx";
import { Card, ClaudeFace, Icon, Pointer, T } from "../ui.tsx";

// ---------------------------------------------------------------- the beats (local frames)

const W_CLAUDE = wordAt("s09", "Claude"); // 96
const W_FOLLOWS = wordAt("s09", "follows"); // 110
const W_GUIDELINES = wordAt("s09", "guidelines"); // 128
const W_FINAL = wordAt("s09", "final"); // 177
const W_SEND = wordAt("s09", "send", 0, "end"); // 198

const ASK1 = 3; // "Write a note ..." types in
const HEAD = 38; // Claude: "Here's a draft."
const DRAFT = 42; // the draft card arrives, its lines settle in
const SCROLL0 = 58; // the chat moves up to make room ...
const SCROLL1 = 78;
const ASK2 = 64; // "Looks good. Send it." types in
const THINK = 84; // Claude's thinking dots
const REPLY = W_CLAUDE - 2; // Claude declines
const FLAG = W_FOLLOWS + 2; // the line is flagged
const RULE = W_GUIDELINES - 8; // the guideline pops up (settled on "guidelines")
const ENTER = 102; // the pointer comes in
const SELECT0 = 134; // drag-select starts
const SELECT1 = 146; // ... and ends
const DELETE = 150; // the selection is deleted
const TYPE0 = 153; // the new line types in
const TYPE_PER = 0.75;
const OK = W_FINAL + 5; // the guideline clears: "Meets your guidelines"
const SEND = W_SEND + 6; // the person presses Send (204, just after "send")
const RULE_OUT = SEND + 10; // the cleared guideline steps away
const OUT = 292; // the scene clears

// positions (frame pixels), from the approved draft moved 50 px left
const DX = -50;
const X0 = 250 + DX; // the chat's left edge (Claude's side)
const RIGHT = 570 - DX; // the person's bubbles end where the draft card ends
const LINE_X0 = 287 + DX; // start of the flagged line
const LINE_Y = 499; // its centre
const LINE_X1 = 765 + DX; // end of the flagged line
const SEND_AT = { x: 1278 + DX, y: 622 }; // just right of the "Send" label
const BODY = { x0: X0 + 30, x1: X0 + 1070, y0: 350, y1: 572 }; // the email body: the I-beam shows here
const POP_X = 1384 + DX;
const START = { x: 1010, y: 1140 }; // the pointer comes in from below

const ASK1_TEXT = "Write a note to all volunteers about Saturday’s cleanup.";
const OLD_LINE = "Mark Davis still owes the $40 registration fee.";
const NEW_LINE = "Registration fees are due by Friday.";
const ASK2_TEXT = "Looks good. Send it.";
const REPLY_TEXT = "Sorry, I can’t send this one. Your guideline says a group email can’t mention someone’s payments.";

function pointerAt(f: number) {
  const moves: [number, number, { x: number; y: number }][] = [
    [ENTER, SELECT0 - 4, { x: LINE_X0, y: LINE_Y }],
    [SELECT0, SELECT1, { x: LINE_X1, y: LINE_Y }],
    [OK + 4, SEND - 4, SEND_AT],
    [SEND + 16, SEND + 38, { x: 1720, y: 1160 }],
  ];
  let at = START;
  for (const [f0, f1, to] of moves) {
    const t = interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: f0 === SELECT0 ? Easing.inOut(Easing.quad) : ease });
    at = { x: at.x + (to.x - at.x) * t, y: at.y + (to.y - at.y) * t };
  }
  // the I-beam over the email's text, the arrow everywhere else
  const overText = at.x > BODY.x0 && at.x < BODY.x1 && at.y > BODY.y0 && at.y < BODY.y1;
  const mode: "arrow" | "text" = overText ? "text" : "arrow";
  // hidden while typing, as on a real computer
  const typingHide = f >= DELETE + 2 && f < OK + 2 ? 0 : 1;
  const visible = f >= ENTER ? typingHide : 0;
  return { ...at, mode, opacity: visible, s: 1 - 0.1 * pressAmount(f, SEND) };
}

export function S09() {
  const f = useCurrentFrame();
  const p = pointerAt(f);
  const out = leave(f, OUT);

  const lift = 150 * (1 - t01(f, SCROLL0, SCROLL1)); // the chat sits lower until the second ask
  const ask1In = t01(f, ASK1 - 3, ASK1 + 6);
  const headIn = t01(f, HEAD, HEAD + 6);
  const card = t01(f, DRAFT, DRAFT + 12, pop);
  const cardO = t01(f, DRAFT, DRAFT + 7);
  const lineIn = (i: number) => {
    const k = t01(f, DRAFT + 2 + i * 3, DRAFT + 10 + i * 3);
    return { opacity: k, transform: `translateY(${(1 - k) * 8}px)` };
  };
  const ask2In = t01(f, ASK2 - 3, ASK2 + 6);

  const flagged = f >= FLAG && f < DELETE;
  const flagIn = interpolate(f, [FLAG, FLAG + 6], [0, 1], clamp);
  const selN = f < SELECT0 ? 0 : Math.round(interpolate(f, [SELECT0, SELECT1], [0, OLD_LINE.length], { ...clamp, easing: Easing.inOut(Easing.quad) }));
  const ruleIn = interpolate(f, [RULE, RULE + 8], [0, 1], { ...clamp, easing: pop });
  const okT = interpolate(f, [OK, OK + 6], [0, 1], clamp);
  const okPop = t01(f, OK, OK + 8, pop);
  const ruleOut = interpolate(f, [RULE_OUT, RULE_OUT + 8], [1, 0], clamp);
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
        <Typed text={NEW_LINE} start={TYPE0} perChar={TYPE_PER} f={f} />
        {f < OK + 14 ? <Caret f={f} from={DELETE} /> : null}
      </>
    );
  }

  const ok = okT > 0.5;

  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans }}>
      <AbsoluteFill style={{ ...out }}>
        <AbsoluteFill style={{ transform: `translateY(${lift}px)` }}>
          {/* the person's first request */}
          {f >= ASK1 - 3 ? (
            <Bubble style={{ position: "absolute", right: RIGHT, top: 60, opacity: ask1In, transform: `translateY(${(1 - ask1In) * 14}px)`, minHeight: 69, boxSizing: "border-box" }}>
              <Typed text={ASK1_TEXT} start={ASK1} perChar={0.6} f={f} />
            </Bubble>
          ) : null}

          {/* Claude: the draft */}
          <div style={{ position: "absolute", left: X0, top: 160, display: "flex", alignItems: "center", gap: 14, opacity: headIn }}>
            <ClaudeFace size={38} />
            <span style={{ fontFamily: T.serif, fontSize: 32, color: T.ink, fontWeight: 420 }}>
              <Stream text="Here’s a draft." start={HEAD} f={f} perWord={2} />
            </span>
          </div>

          <Card
            style={{
              position: "absolute",
              left: X0,
              top: 222,
              width: 1100,
              height: 462,
              display: "flex",
              flexDirection: "column",
              opacity: cardO,
              transform: `translateY(${(1 - card) * 24}px) scale(${0.98 + 0.02 * card})`,
              transformOrigin: "50% 0%",
            }}
          >
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
              <div style={lineIn(0)}>Hi everyone,</div>
              <div style={{ marginTop: 8, ...lineIn(1) }}>Thanks for signing up for Saturday&rsquo;s cleanup. We meet at 9 AM by the north gate. Gloves and bags are provided.</div>
              <div style={{ marginTop: 8, minHeight: 34, ...lineIn(2) }}>{line}</div>
              <div style={{ marginTop: 8, ...lineIn(3) }}>See you there, Maria</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px 26px", height: 96, ...lineIn(4) }}>
              <div style={{ opacity: toast, transform: `scale(${0.7 + 0.3 * toast})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 650, color: T.a2dark }}>
                <Icon name="check-circle:fill" size={28} color={T.a2} /> Sent to 42 volunteers &middot; 9:42 AM
              </div>
              <PressButton f={f} press={SEND} label="Send" icon="paper-plane-right:fill" bg={T.a1} after={{ label: "Sent", icon: "check:bold", bg: T.ink }} />
            </div>
          </Card>

          {/* the person: "Looks good. Send it." */}
          {f >= ASK2 - 3 ? (
            <Bubble style={{ position: "absolute", right: RIGHT, top: 716, opacity: ask2In, transform: `translateY(${(1 - ask2In) * 14}px)`, minHeight: 69, boxSizing: "border-box" }}>
              <Typed text={ASK2_TEXT} start={ASK2} perChar={0.9} f={f} />
            </Bubble>
          ) : null}

          {/* Claude declines */}
          {think ? (
            <div style={{ position: "absolute", left: X0, top: 812, display: "flex", alignItems: "center", gap: 14 }}>
              <ClaudeFace size={38} />
              <ThinkingDots f={f} from={THINK} />
            </div>
          ) : null}
          {f >= REPLY ? (
            <div style={{ position: "absolute", left: X0, top: 806, width: 1100, display: "flex", gap: 14 }}>
              <ClaudeFace size={38} />
              <div style={{ fontFamily: T.serif, fontSize: 32, lineHeight: 1.3, color: T.ink, fontWeight: 420, marginTop: -2 }}>
                <Stream text={REPLY_TEXT} start={REPLY} f={f} />
              </div>
            </div>
          ) : null}
        </AbsoluteFill>

        {/* the guideline pops up beside the flagged line, then clears once the line is fixed */}
        {f >= RULE ? (
          <div
            style={{
              position: "absolute",
              left: POP_X,
              top: 436,
              width: 490,
              opacity: ruleIn * ruleOut,
              transform: `translateY(${(1 - ruleIn) * 12}px) scale(${0.94 + 0.06 * ruleIn})`,
              transformOrigin: "0% 50%",
            }}
          >
            <div
              style={{
                position: "relative",
                background: ok ? "#E8F7F6" : "#FFF8E6",
                border: `1.5px solid ${ok ? "#B9E6E4" : "#F2D58C"}`,
                borderRadius: 16,
                boxShadow: T.shadow,
                padding: "16px 20px",
                display: "flex",
                gap: 14,
              }}
            >
              {/* the little arrow pointing back at the flagged line */}
              <div style={{ position: "absolute", left: -10, top: 52, width: 18, height: 18, background: ok ? "#E8F7F6" : "#FFF8E6", borderLeft: `1.5px solid ${ok ? "#B9E6E4" : "#F2D58C"}`, borderBottom: `1.5px solid ${ok ? "#B9E6E4" : "#F2D58C"}`, transform: "rotate(45deg)" }} />
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: ok ? T.a2 : T.a3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                  transform: ok ? `scale(${0.7 + 0.3 * okPop})` : "none",
                }}
              >
                <Icon name={ok ? "check:bold" : "lock-simple"} size={24} color={ok ? "#fff" : T.ink} />
              </div>
              {ok ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: T.a2dark }}>Meets your guidelines</span>
                  <span style={{ fontSize: 18, color: T.ink2 }}>Ready for you to send.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>Guideline: group emails</span>
                  <span style={{ fontSize: 20, lineHeight: 1.35, color: T.ink2 }}>Never mention a person&rsquo;s payments in an email to a group.</span>
                  <span style={{ fontSize: 17, color: T.ink3, marginTop: 3 }}>Set by Ana Kim, Operations</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <Pointer x={p.x} y={p.y} scale={p.s} mode={p.mode} opacity={p.opacity} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
