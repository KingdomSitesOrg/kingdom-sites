// Scene s06, "Survey": "Claude builds a custom survey for everyone in your
// organization, reads every answer, and gives you clear steps to improve."
//
// A Claude chat. The person asks for a short survey for all the volunteers;
// Claude builds it, question by question. On "everyone in your organization"
// the person presses "Send to 42 people": it sinks and turns into "Sent". The
// chat scrolls: on "reads every answer" the answers come in (a counter climbs
// to 38 of 42, three short answers land). It scrolls again: on "clear steps to
// improve" Claude's card "3 steps to improve" lists three concrete steps, each
// with how many people asked for it.
//
// Local, 0-based frames. Sounds: video/timeline/cues-v2/s06.json.

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { Bubble, ClaudeSays, Stream, ThinkingDots, PressButton, clamp, ease, enter, leave, pop, pressAmount, sceneT, t01, wordAt } from "../kit.tsx";
import { Card, ClaudeFace, Face, Icon, Pointer, T } from "../ui.tsx";

const ID = "s06";
const LEN = sceneT(ID).length; // 285

// ---------------------------------------------------------------- the beats
const W_ORG = wordAt(ID, "organization"); // 97
const W_READS = wordAt(ID, "reads"); // 141
const W_GIVES = wordAt(ID, "gives"); // 196
const W_CLEAR = wordAt(ID, "clear"); // 209

const ASK = 2; // the person's request types in
const ASK_TEXT = "Make a short survey for all our volunteers.";
const SAYS1 = 30; // "Here's a short survey ..."
const SURVEY_IN = 35;
const Q_AT = [43, 52, 61]; // the questions build in
const FOOT_IN = 68;
const PRESS = W_ORG + 1; // 98: Send is pressed on "organization"
const POINTER_IN = PRESS - 34;
const SCROLL1 = [W_READS - 15, W_READS + 5]; // 126..146
const STATUS_IN = W_READS - 6;
const RESP_IN = W_READS - 3;
const COUNT = [W_READS, W_READS + 37]; // the counter climbs to 38
const ANSWERS_AT = [W_READS + 9, W_READS + 18, W_READS + 27];
const SCROLL2 = [W_GIVES - 12, W_GIVES + 8]; // 184..204
const SAYS2 = W_GIVES - 4;
const STEPS_IN = W_GIVES + 2;
const STEP_AT = [W_CLEAR - 3, W_CLEAR + 8, W_CLEAR + 19]; // 206, 217, 228
const OUT = LEN - 8;

// ---------------------------------------------------------------- layout (chat coordinates, before scrolling)
const X0 = 410;
const CW = 1100;
const ASK_Y = 96;
const SAYS1_Y = 190;
const SURVEY_Y = 252;
const SURVEY_H = 616;
const STATUS_Y = 916;
const RESP_Y = 976;
const RESP_H = 300;
const SAYS2_Y = 1326;
const STEPS_Y = 1388;
const STEPS_H = 372;
const S1 = 600; // scroll after "Sent": the answers sit in the middle, the sent survey above
const S2 = STEPS_Y + STEPS_H - 1000; // scroll for the steps

const BTN = { w: 300, h: 62, right: 36, top: 537 }; // inside the survey card
const SEND_AT = { x: X0 + CW - BTN.right - 22, y: SURVEY_Y + BTN.top + BTN.h / 2 + 6 }; // just right of the label

// Phosphor icons (MIT), path data from @phosphor-icons/core.
const LIST_CHECKS =
  "M224,128a8,8,0,0,1-8,8H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128ZM128,72h88a8,8,0,0,0,0-16H128a8,8,0,0,0,0,16Zm88,112H128a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM82.34,42.34,56,68.69,45.66,58.34A8,8,0,0,0,34.34,69.66l16,16a8,8,0,0,0,11.32,0l32-32A8,8,0,0,0,82.34,42.34Zm0,64L56,132.69,45.66,122.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Zm0,64L56,196.69,45.66,186.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Z";
const LIGHTBULB =
  "M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-32.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z";
const CHAT_TEXT =
  "M168,112a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,112Zm-8,24H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm72-8A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z";

function PathIcon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      <path d={d} fill={color} />
    </svg>
  );
}

function Abs({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: "absolute", ...style }}>{children}</div>;
}

function Tile({ d, bg, color }: { d: string; bg: string; color: string }) {
  return (
    <div style={{ width: 54, height: 54, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <PathIcon d={d} size={30} color={color} />
    </div>
  );
}

function Chip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "8px 20px", fontSize: 21, fontWeight: 500, color: T.ink, background: T.card, whiteSpace: "nowrap", ...style }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- the survey Claude builds
const QUESTIONS: { q: string; options?: string[] }[] = [
  { q: "How was your last shift?", options: ["Great", "Good", "OK", "Hard"] },
  { q: "What would help you most?", options: ["A clearer schedule", "More training", "Better supplies"] },
  { q: "Anything else to share?" },
];

function SurveyCard({ f }: { f: number }) {
  const sent = t01(f, PRESS + 2, PRESS + 8);
  return (
    <Card style={{ position: "absolute", left: X0, top: SURVEY_Y, width: CW, height: SURVEY_H, ...enter(f, SURVEY_IN, 22) }}>
      <Abs style={{ left: 36, top: 34, display: "flex", gap: 18, alignItems: "center" }}>
        <Tile d={LIST_CHECKS} bg="#E3F5F4" color={T.a2dark} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: T.ink, letterSpacing: -0.2 }}>Volunteer survey</span>
          <span style={{ fontSize: 19, color: T.ink3 }}>3 questions &middot; about 1 minute</span>
        </div>
      </Abs>
      <Abs style={{ right: 36, top: 46, display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 650, color: T.a1dark, background: T.tint, borderRadius: 999, padding: "5px 13px" }}>
        <Icon name="sparkle:fill" size={17} color={T.a1} /> Drafted by Claude
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 120, height: 1.5, background: T.line }} />

      {QUESTIONS.map((q, i) => {
        const at = Q_AT[i];
        const top = 148 + i * 120;
        return (
          <div key={q.q}>
            <Abs style={{ left: 36, top, fontSize: 24, fontWeight: 620, color: T.ink, ...enter(f, at, 12) }}>
              <span style={{ color: T.ink3, marginRight: 12 }}>{i + 1}</span>
              {q.q}
            </Abs>
            <Abs style={{ left: 64, top: top + 46, display: "flex", gap: 12 }}>
              {q.options ? (
                q.options.map((o, k) => (
                  <div key={o} style={enter(f, at + 3 + k * 2, 10)}>
                    <Chip>{o}</Chip>
                  </div>
                ))
              ) : (
                <div style={{ width: 640, height: 54, boxSizing: "border-box", border: `1.5px solid ${T.line}`, borderRadius: 12, padding: "12px 18px", fontSize: 22, color: T.ink3, ...enter(f, at + 3, 10) }}>
                  Your answer
                </div>
              )}
            </Abs>
          </div>
        );
      })}

      {/* footer: who it goes to, and Send */}
      <div style={enter(f, FOOT_IN, 10)}>
        <Abs style={{ left: 0, right: 0, top: 520, height: 1.5, background: T.line }} />
        <Abs style={{ left: 36, top: 556, display: "flex", alignItems: "center", gap: 10, fontSize: 21, color: T.ink2, opacity: 1 - sent }}>
          <Icon name="users" size={24} color={T.ink3} /> To: All volunteers (42)
        </Abs>
        <Abs
          style={{
            left: 36,
            top: 552,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 21,
            fontWeight: 650,
            color: T.a2dark,
            opacity: sent,
            transform: `translateY(${(1 - sent) * 8}px)`,
          }}
        >
          <Icon name="check-circle:fill" size={28} color={T.a2} /> Sent to 42 volunteers &middot; 9:15 AM
        </Abs>
        <PressButton
          f={f}
          press={PRESS}
          label="Send to 42 people"
          icon="paper-plane-right:fill"
          bg={T.a1}
          after={{ label: "Sent", icon: "check:bold", bg: T.ink }}
          width={BTN.w}
          height={BTN.h}
          style={{ position: "absolute", right: BTN.right, top: BTN.top }}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- the answers coming in
const ANSWERS: { ini: string; color: string; name: string; text: string }[] = [
  { ini: "LF", color: T.a2, name: "Lena F.", text: "A schedule a week ahead would help." },
  { ini: "SO", color: T.a3dark, name: "Sam O.", text: "More training on the new check-in." },
  { ini: "DC", color: T.side, name: "David C.", text: "We ran out of gloves on Saturday." },
];

function ResponsesCard({ f }: { f: number }) {
  const k = interpolate(f, [COUNT[0], COUNT[1]], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const n = Math.round(38 * k);
  const cardW = (CW - 72 - 32) / 3;
  return (
    <Card style={{ position: "absolute", left: X0, top: RESP_Y, width: CW, height: RESP_H, ...enter(f, RESP_IN, 22) }}>
      <Abs style={{ left: 36, top: 30, display: "flex", alignItems: "center", gap: 16 }}>
        <Tile d={CHAT_TEXT} bg="#EEEAF3" color={T.side} />
        <span style={{ fontSize: 28, fontWeight: 700, color: T.ink }}>Answers</span>
      </Abs>
      <Abs style={{ right: 36, top: 26, display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 46, fontWeight: 750, color: T.ink, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{n}</span>
        <span style={{ fontSize: 22, color: T.ink2, fontWeight: 500 }}>of 42 answered</span>
      </Abs>
      <Abs style={{ left: 36, right: 36, top: 104, height: 10, borderRadius: 99, background: "#F0ECE6", overflow: "hidden" }}>
        <div style={{ width: `${(n / 42) * 100}%`, height: "100%", borderRadius: 99, background: T.a2 }} />
      </Abs>
      {ANSWERS.map((a, i) => {
        const at = ANSWERS_AT[i];
        const kk = interpolate(f, [at, at + 9], [0, 1], { ...clamp, easing: ease });
        return (
          <Abs
            key={a.ini}
            style={{
              left: 36 + i * (cardW + 16),
              top: 144,
              width: cardW,
              height: 124,
              boxSizing: "border-box",
              border: `1.5px solid ${T.line}`,
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              gap: 14,
              background: "#FDFCFA",
              opacity: kk,
              transform: `translateY(${(1 - kk) * 26}px) scale(${0.96 + 0.04 * kk})`,
            }}
          >
            <Face initials={a.ini} color={a.color} size={40} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 17, fontWeight: 650, color: T.ink2 }}>{a.name}</span>
              <span style={{ fontSize: 22, lineHeight: 1.3, color: T.ink }}>{a.text}</span>
            </div>
          </Abs>
        );
      })}
    </Card>
  );
}

// ---------------------------------------------------------------- the steps
const STEPS: { text: string; n: number }[] = [
  { text: "Post the shift schedule a week ahead", n: 19 },
  { text: "Add a short training for check-in", n: 14 },
  { text: "Pack gloves and bags in every kit", n: 9 },
];

function StepsCard({ f }: { f: number }) {
  return (
    <Card style={{ position: "absolute", left: X0, top: STEPS_Y, width: CW, height: STEPS_H, ...enter(f, STEPS_IN, 22) }}>
      <Abs style={{ left: 36, top: 30, display: "flex", gap: 18, alignItems: "center" }}>
        <Tile d={LIGHTBULB} bg="#FFF1D2" color={T.a3dark} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: T.ink, letterSpacing: -0.2 }}>3 steps to improve</span>
          <span style={{ fontSize: 19, color: T.ink3 }}>From 38 answers</span>
        </div>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 116, height: 1.5, background: T.line }} />
      {STEPS.map((s, i) => {
        const at = STEP_AT[i];
        const chip = interpolate(f, [at + 5, at + 12], [0, 1], { ...clamp, easing: pop });
        const top = 140 + i * 76;
        return (
          <Abs key={s.text} style={{ left: 36, right: 36, top, height: 64, display: "flex", alignItems: "center", gap: 20, ...enter(f, at, 14) }}>
            <div style={{ width: 46, height: 46, borderRadius: 99, background: T.tint, color: T.a1dark, fontSize: 23, fontWeight: 750, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</div>
            <span style={{ fontSize: 25, fontWeight: 600, color: T.ink, flex: 1 }}>{s.text}</span>
            <div
              style={{
                opacity: chip,
                transform: `scale(${0.7 + 0.3 * chip})`,
                transformOrigin: "100% 50%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 19,
                fontWeight: 650,
                color: T.a2dark,
                background: "#E6F6F5",
                border: "1.5px solid #B9E6E4",
                borderRadius: 999,
                padding: "6px 16px 6px 12px",
                whiteSpace: "nowrap",
              }}
            >
              <Icon name="users" size={20} color={T.a2dark} /> {s.n} asked for this
            </div>
          </Abs>
        );
      })}
    </Card>
  );
}

// ---------------------------------------------------------------- the pointer
function pointerAt(f: number, scroll: number) {
  const start = { x: 1760, y: 1150 };
  const at = { x: SEND_AT.x, y: SEND_AT.y - scroll };
  const away = { x: 1800, y: 1120 };
  const a = t01(f, POINTER_IN, PRESS - 4);
  const b = interpolate(f, [PRESS + 8, PRESS + 30], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.4, 1) });
  return {
    x: start.x + (at.x - start.x) * a + (away.x - at.x) * b,
    y: start.y + (at.y - start.y) * a + (away.y - at.y) * b,
    s: 1 - 0.1 * pressAmount(f, PRESS),
    o: f >= POINTER_IN && f < PRESS + 30 ? 1 : 0,
  };
}

// ---------------------------------------------------------------- the scene
export function S06() {
  const f = useCurrentFrame();
  const s1 = interpolate(f, SCROLL1, [0, S1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const s2 = interpolate(f, SCROLL2, [0, S2 - S1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const scroll = s1 + s2;
  const p = pointerAt(f, scroll);
  const reading = f >= STATUS_IN && f < COUNT[1] + 6;
  const askK = t01(f, ASK, ASK + 6);

  return (
    <AbsoluteFill style={{ fontFamily: T.sans, color: T.ink, overflow: "hidden", ...leave(f, OUT) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 2000, transform: `translateY(${-scroll}px)` }}>
        {/* the person asks */}
        <Bubble style={{ position: "absolute", right: 1920 - X0 - CW, top: ASK_Y, opacity: askK, transform: `translateY(${(1 - askK) * 12}px)` }}>
          <Stream text={ASK_TEXT} start={ASK} f={f} perWord={1.6} />
        </Bubble>

        {/* Claude builds the survey */}
        {f >= SAYS1 ? (
          <Abs style={{ left: X0, top: SAYS1_Y, display: "flex", alignItems: "center", gap: 14 }}>
            <ClaudeFace size={38} />
            <ClaudeSays>
              <Stream text="Here’s a short survey for your volunteers." start={SAYS1} f={f} />
            </ClaudeSays>
          </Abs>
        ) : null}
        {f >= SURVEY_IN ? (
          <div style={{ opacity: 1 - t01(f, SCROLL2[0], SCROLL2[0] + 12) }}>
            <SurveyCard f={f} />
          </div>
        ) : null}

        {/* the answers come in */}
        {f >= STATUS_IN ? (
          <Abs style={{ left: X0, top: STATUS_Y, display: "flex", alignItems: "center", gap: 14, ...enter(f, STATUS_IN, 12) }}>
            <ClaudeFace size={38} />
            {reading ? <ThinkingDots f={f} from={STATUS_IN} /> : <Icon name="check-circle:fill" size={30} color={T.a2} />}
            <span style={{ fontSize: 23, color: T.ink2, fontWeight: 500 }}>{reading ? "Reading every answer" : "Read all 38 answers"}</span>
          </Abs>
        ) : null}
        {f >= RESP_IN ? <ResponsesCard f={f} /> : null}

        {/* Claude's steps */}
        {f >= SAYS2 ? (
          <Abs style={{ left: X0, top: SAYS2_Y, display: "flex", alignItems: "center", gap: 14 }}>
            <ClaudeFace size={38} />
            <ClaudeSays>
              <Stream text="Here’s what your volunteers asked for." start={SAYS2} f={f} />
            </ClaudeSays>
          </Abs>
        ) : null}
        {f >= STEPS_IN ? <StepsCard f={f} /> : null}
      </div>

      {/* a soft fade where the chat scrolls off the top */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 170, background: `linear-gradient(${T.ground} 25%, rgba(250,247,242,0))`, opacity: t01(f, SCROLL1[0], SCROLL1[0] + 10) }} />

      <Pointer x={p.x} y={p.y} scale={p.s} opacity={p.o} />
    </AbsoluteFill>
  );
}
