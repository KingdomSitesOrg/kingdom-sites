// Scene s07, "Claude works right inside Slack, and connects to Gmail and Google
// Drive. Tag it in a thread, and it answers right there."
//
// Built from the approved still (SlackFrame.tsx). Claude's square arrives alone
// on "Claude", and on "inside Slack" the workspace opens around it while the
// square settles into the sidebar's Apps list. On "connects to Gmail and Google
// Drive" a small card from Claude's sidebar entry shows both as connected. On
// "Tag it in a thread" Maria types her question with the @Claude mention and
// sends it; Claude thinks, and on "answers right there" its reply streams in
// under hers, with the handbook file and the reactions.

import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { Caret, Stream, ThinkingDots, clamp, ease, leave, pop, pressAmount, t01, wordAt } from "../kit.tsx";
import { Card, ClaudeFace, Face, Icon, T } from "../ui.tsx";

// Phosphor (MIT) path data not in icons.ts, viewBox 0 0 256 256.
const FOLDER_FILL =
  "M232,88V200.89A15.13,15.13,0,0,1,216.89,216H40a16,16,0,0,1-16-16V64A16,16,0,0,1,40,48H93.33a16.12,16.12,0,0,1,9.6,3.2L130.67,72H216A16,16,0,0,1,232,88Z";

function Glyph({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none" }}>
      <path d={d} fill={color} />
    </svg>
  );
}

// ---------------------------------------------------------------- the beats (local frames)

const W_SLACK = wordAt("s07", "Slack"); // 63
const W_CONNECTS = wordAt("s07", "connects"); // 90
const W_GMAIL = wordAt("s07", "Gmail"); // 105
const W_GOOGLE = wordAt("s07", "Google"); // 123
const W_ANSWERS = wordAt("s07", "answers"); // 214

const FACE_IN = 0; // Claude's square arrives alone
const WIN_IN = W_SLACK - 13; // the workspace opens around it
const FLY0 = W_SLACK - 9; // the square flies to the sidebar ...
const FLY1 = W_SLACK + 15; // ... and lands
const POP_IN = W_CONNECTS - 2; // the "connected" card
const GMAIL_IN = W_GMAIL - 3;
const DRIVE_IN = W_GOOGLE - 3;
const POP_OUT = 144;
const TYPE0 = 146; // Maria types her question
const PER_CHAR = 1 / 2.2;
const SEND = 188; // Enter: the send button sinks, the message lands
const THINK = SEND + 7; // Claude's dots
const REPLY = W_ANSWERS; // the answer streams in
const GROW0 = REPLY + 16; // the handbook file and reactions make room
const GROW1 = REPLY + 30;
const FILE_IN = REPLY + 20;
const REACT1 = REPLY + 30;
const REACT2 = REPLY + 34;
const OUT = 263; // the scene clears

const ASK_PRE = "Someone is asking when summer registration closes. ";
const ASK_AT = "@Claude";
const ASK_POST = " can you check the handbook?";
const ASK_LEN = ASK_PRE.length + ASK_AT.length + ASK_POST.length;
const REPLY_TEXT = "Summer registration closes on May 15. After that, sign-ups need a manager’s OK.";

// measured on the approved still: Claude's entry in the sidebar's Apps list
const SLOT = { x: 222, y: 639 };
const BIG = 132; // Claude's square on its own, at the start
const BIG_AT = { x: 960, y: 470 };

// ---------------------------------------------------------------- pieces from the approved still

function SideItem({ icon, label, active, bold }: { icon: string; label: string; active?: boolean; bold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 46,
        padding: "0 16px",
        margin: "0 12px",
        borderRadius: 8,
        background: active ? T.a2 : "transparent",
        color: active ? "#fff" : bold ? "#fff" : "rgba(255,255,255,0.72)",
        fontWeight: active || bold ? 650 : 450,
        fontSize: 21,
      }}
    >
      <Icon name={icon} size={22} color={active ? "#fff" : "rgba(255,255,255,0.72)"} />
      <span>{label}</span>
    </div>
  );
}

function Message({ face, name, time, badge, children }: { face: ReactNode; name: string; time: string; badge?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 18, padding: "14px 40px" }}>
      {face}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 23, color: T.ink }}>{name}</span>
          {badge ? (
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.4, color: T.ink2, background: "#EEEAF0", borderRadius: 5, padding: "1px 7px", position: "relative", top: -2 }}>{badge}</span>
          ) : null}
          <span style={{ fontSize: 17, color: T.ink3, fontWeight: 450 }}>{time}</span>
        </div>
        <div style={{ fontSize: 23, lineHeight: 1.45, color: T.ink, fontWeight: 420 }}>{children}</div>
      </div>
    </div>
  );
}

function Mention({ children }: { children: ReactNode }) {
  return <span style={{ background: T.tint, color: T.a1dark, fontWeight: 600, borderRadius: 5, padding: "1px 5px" }}>{children}</span>;
}

/** Maria's question, `n` characters of it; the mention becomes a pink tag once it is whole. */
function AskText({ n }: { n: number }) {
  const pre = ASK_PRE.slice(0, n);
  const at = ASK_AT.slice(0, Math.max(0, n - ASK_PRE.length));
  const post = ASK_POST.slice(0, Math.max(0, n - ASK_PRE.length - ASK_AT.length));
  return (
    <>
      {pre}
      {at.length === ASK_AT.length ? <Mention>{at}</Mention> : <span style={{ color: T.a1dark }}>{at}</span>}
      {post}
    </>
  );
}

/** The card from Claude's sidebar entry: Gmail and Google Drive, both connected. */
function Connected({ f }: { f: number }) {
  const k = t01(f, POP_IN, POP_IN + 9, pop);
  const out = t01(f, POP_OUT, POP_OUT + 6);
  if (f < POP_IN || out >= 1) return null;
  const row = (at: number, tile: string, glyph: ReactNode, name: string, note: string) => {
    const r = t01(f, at, at + 8);
    const chk = t01(f, at + 5, at + 11, pop);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, height: 70, opacity: r, transform: `translateY(${(1 - r) * 12}px)` }}>
        <div style={{ width: 48, height: 48, borderRadius: 11, background: tile, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{glyph}</div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontSize: 23, fontWeight: 650, color: T.ink }}>{name}</span>
          <span style={{ fontSize: 17, color: T.ink3 }}>{note}</span>
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 18,
            fontWeight: 650,
            color: T.a2dark,
            background: "#E3F5F4",
            border: "1.5px solid #B9E6E4",
            borderRadius: 999,
            padding: "5px 13px",
            opacity: chk,
            transform: `scale(${0.7 + 0.3 * chk})`,
          }}
        >
          <Icon name="check:bold" size={17} color={T.a2dark} /> Connected
        </span>
      </div>
    );
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 352,
        top: SLOT.y - 62,
        width: 520,
        opacity: k * (1 - out),
        transform: `translate(${(1 - k) * -14}px, ${out * -8}px) scale(${0.96 + 0.04 * k})`,
        transformOrigin: "0% 62px",
      }}
    >
      <div style={{ position: "relative", background: T.card, border: `1.5px solid ${T.line}`, borderRadius: 16, boxShadow: "0 2px 4px rgba(30,27,34,0.06), 0 18px 44px rgba(30,27,34,0.16)", padding: "18px 24px 10px" }}>
        {/* the little arrow pointing back at Claude in the sidebar */}
        <div style={{ position: "absolute", left: -10, top: 53, width: 18, height: 18, background: T.card, borderLeft: `1.5px solid ${T.line}`, borderBottom: `1.5px solid ${T.line}`, transform: "rotate(45deg)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, borderBottom: `1.5px solid ${T.line}` }}>
          <ClaudeFace size={46} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: T.ink }}>Claude</span>
            <span style={{ fontSize: 17, color: T.ink3 }}>Connected apps</span>
          </div>
        </div>
        {/* the card grows a row at a time, as each app is named */}
        <div style={{ height: 70 * t01(f, GMAIL_IN - 1, GMAIL_IN + 7, ease) + 71.5 * t01(f, DRIVE_IN - 1, DRIVE_IN + 7, ease), overflow: "hidden" }}>
          {row(GMAIL_IN, T.tint, <Icon name="envelope-simple" size={28} color={T.a1} />, "Gmail", "Read and search email")}
          <div style={{ height: 1.5, background: T.line }} />
          {row(DRIVE_IN, "#FFF3D6", <Glyph d={FOLDER_FILL} size={27} color={T.a3dark} />, "Google Drive", "Read and search files")}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the scene

export function S07() {
  const f = useCurrentFrame();

  // Claude's square on its own, then flying into the sidebar
  const faceIn = t01(f, FACE_IN, FACE_IN + 12, pop);
  const fly = t01(f, FLY0, FLY1, ease);
  const labelOut = t01(f, FLY0 - 4, FLY0 + 4);
  const sx = BIG_AT.x + (SLOT.x - BIG_AT.x) * fly;
  const sy = BIG_AT.y + (SLOT.y - BIG_AT.y) * fly - Math.sin(fly * Math.PI) * 40; // a slight arc
  const sScale = (1 + (28 / BIG - 1) * fly) * (0.85 + 0.15 * faceIn);
  const landed = f >= FLY1;

  // the workspace
  const win = t01(f, WIN_IN, WIN_IN + 18);
  const out = leave(f, OUT);

  // Maria types, then sends
  const typedN = f < TYPE0 ? 0 : Math.min(ASK_LEN, Math.floor((f - TYPE0) / PER_CHAR));
  const sent = f >= SEND + 1;
  const sendDown = pressAmount(f, SEND);
  const hasText = typedN > 0 && !sent;
  const maria = t01(f, SEND + 1, SEND + 9); // her message makes room and lands
  const claudeH = interpolate(f, [THINK, THINK + 8, GROW0, GROW1], [0, 95, 95, 236], { ...clamp, easing: ease });
  const claudeIn = t01(f, THINK, THINK + 8);
  const dots = f >= THINK && f < REPLY + 2 ? 1 - t01(f, REPLY - 2, REPLY + 2) : 0;
  const file = t01(f, FILE_IN, FILE_IN + 9, pop);
  const r1 = t01(f, REACT1, REACT1 + 7, pop);
  const r2 = t01(f, REACT2, REACT2 + 7, pop);
  const hover = t01(f, POP_IN - 2, POP_IN + 4) * (1 - t01(f, POP_OUT, POP_OUT + 6));

  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans }}>
      <AbsoluteFill style={{ ...out }}>
        {/* the workspace (the approved still), opening around Claude */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: win, transform: `translateY(${(1 - win) * 26}px) scale(${0.965 + 0.035 * win})` }}>
          <Card style={{ width: 1560, height: 880, overflow: "hidden", display: "flex", borderRadius: 18 }}>
            {/* sidebar */}
            <div style={{ width: 330, background: T.side, display: "flex", flexDirection: "column", paddingTop: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 28px 22px", color: "#fff", fontWeight: 750, fontSize: 25 }}>
                Riverside Center <Icon name="caret-down" size={18} color="rgba(255,255,255,0.8)" />
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "0 0 14px" }} />
              <SideItem icon="chat-circle" label="Threads" />
              <SideItem icon="at" label="Mentions" />
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 17, fontWeight: 600, padding: "22px 28px 8px", letterSpacing: 0.4 }}>Channels</div>
              <SideItem icon="hash" label="general" />
              <SideItem icon="hash" label="volunteers" />
              <SideItem icon="hash" label="front-desk" active />
              <SideItem icon="hash" label="events" />
              <SideItem icon="hash" label="finance" />
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 17, fontWeight: 600, padding: "22px 28px 8px", letterSpacing: 0.4 }}>Apps</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 46, padding: "0 16px", margin: "0 12px", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 21, background: `rgba(255,255,255,${0.12 * hover})` }}>
                <div style={{ opacity: landed ? 1 : 0 }}>
                  <ClaudeFace size={28} />
                </div>
                <span style={{ opacity: t01(f, FLY1 - 6, FLY1 + 4) }}>Claude</span>
              </div>
            </div>

            {/* channel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.card }}>
              <div style={{ height: 84, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", borderBottom: `1.5px solid ${T.line}`, flex: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 750, fontSize: 27, color: T.ink }}>
                  <Icon name="hash" size={26} color={T.ink} /> front-desk <Icon name="caret-down" size={18} color={T.ink2} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1.5px solid ${T.line}`, borderRadius: 10, padding: "6px 12px 6px 8px" }}>
                  <div style={{ display: "flex" }}>
                    {[
                      ["MR", T.a2],
                      ["JL", T.a1],
                      ["AK", T.a3dark],
                    ].map(([i, c], k) => (
                      <div key={i} style={{ marginLeft: k ? -8 : 0, border: "2px solid #fff", borderRadius: 9 }}>
                        <Face initials={i} color={c} size={30} />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 19, fontWeight: 600, color: T.ink2 }}>14</span>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 40px 10px" }}>
                  <div style={{ flex: 1, height: 1.5, background: T.line }} />
                  <span style={{ fontSize: 17, fontWeight: 650, color: T.ink2, border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "3px 14px" }}>Today</span>
                  <div style={{ flex: 1, height: 1.5, background: T.line }} />
                </div>
                <Message face={<Face initials="AK" color={T.a3dark} />} name="Ana Kim" time="8:52 AM">
                  Team meeting moves to 3:30 today, in room B.
                </Message>
                <Message face={<Face initials="JL" color={T.a1} />} name="Jun Lee" time="9:38 AM">
                  Signs for Saturday&rsquo;s cleanup are up in the lobby.
                </Message>

                {/* Maria's question lands */}
                <div style={{ height: 95.5 * maria, overflow: "hidden", flex: "none" }}>
                  <div style={{ opacity: maria, transform: `translateY(${(1 - maria) * 14}px)` }}>
                    <Message face={<Face initials="MR" color={T.a2} />} name="Maria Reyes" time="9:41 AM">
                      <AskText n={ASK_LEN} />
                    </Message>
                  </div>
                </div>

                {/* Claude answers right there */}
                <div style={{ height: claudeH, overflow: "hidden", flex: "none" }}>
                  <div style={{ opacity: claudeIn, transform: `translateY(${(1 - claudeIn) * 14}px)` }}>
                    <Message face={<ClaudeFace />} name="Claude" badge="APP" time="9:41 AM">
                      <div style={{ position: "relative", whiteSpace: "nowrap" }}>
                        <Stream text={REPLY_TEXT} start={REPLY} f={f} perWord={2} />
                        {dots > 0 ? (
                          <div style={{ position: "absolute", left: 0, top: 1, opacity: dots }}>
                            <ThinkingDots f={f} from={THINK} />
                          </div>
                        ) : null}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          marginTop: 12,
                          width: 520,
                          border: `1.5px solid ${T.line}`,
                          borderRadius: 12,
                          padding: "12px 16px",
                          opacity: file,
                          transform: `translateY(${(1 - file) * 10}px) scale(${0.96 + 0.04 * file})`,
                          transformOrigin: "0% 50%",
                        }}
                      >
                        <div style={{ width: 46, height: 46, borderRadius: 10, background: T.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="file-pdf:fill" size={28} color={T.a1} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 20, fontWeight: 650, color: T.ink }}>Member Handbook 2026.pdf</span>
                          <span style={{ fontSize: 17, color: T.ink3 }}>Page 12 &middot; Registration</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 17,
                            fontWeight: 650,
                            color: T.a2dark,
                            background: "#E3F5F4",
                            border: `1.5px solid #B9E6E4`,
                            borderRadius: 999,
                            padding: "4px 12px",
                            opacity: r1,
                            transform: `scale(${0.6 + 0.4 * r1})`,
                          }}
                        >
                          <Icon name="check:bold" size={17} color={T.a2dark} /> 3
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 17,
                            fontWeight: 600,
                            color: T.ink2,
                            border: `1.5px solid ${T.line}`,
                            borderRadius: 999,
                            padding: "4px 12px",
                            opacity: r2,
                            transform: `scale(${0.6 + 0.4 * r2})`,
                          }}
                        >
                          <Icon name="chat-circle" size={17} color={T.ink2} /> 2 replies
                        </span>
                      </div>
                    </Message>
                  </div>
                </div>
              </div>

              {/* the message box: Maria types here and presses Enter */}
              <div style={{ margin: "6px 40px 30px", border: `1.5px solid ${hasText ? "#BDB4A8" : "#D9D2C8"}`, borderRadius: 12, padding: "16px 18px 12px", flex: "none" }}>
                <div style={{ fontSize: 21, color: hasText ? T.ink : T.ink3, whiteSpace: "nowrap", height: 26, lineHeight: "26px" }}>
                  {hasText ? (
                    <>
                      <AskText n={typedN} />
                      <Caret f={f} from={TYPE0} height={26} />
                    </>
                  ) : (
                    "Message #front-desk"
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 18 }}>
                    {["plus", "text-aa", "smiley", "at", "paperclip"].map((n) => (
                      <Icon key={n} name={n} size={22} color={T.ink3} />
                    ))}
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 34,
                      borderRadius: 8,
                      background: hasText || (f >= SEND - 3 && f <= SEND) ? T.a2 : "#EEEAF0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `translateY(${sendDown * 2}px) scale(${1 - sendDown * 0.08})`,
                      boxShadow: sendDown > 0.01 ? "inset 0 2px 4px rgba(0,0,0,0.22)" : "none",
                    }}
                  >
                    <Icon name="paper-plane-right:fill" size={20} color={hasText || (f >= SEND - 3 && f <= SEND) ? "#fff" : T.ink3} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </AbsoluteFill>

        <Connected f={f} />

        {/* Claude's square: alone at first, then into the sidebar */}
        {!landed ? (
          <div
            style={{
              position: "absolute",
              left: sx - BIG / 2,
              top: sy - BIG / 2,
              width: BIG,
              height: BIG,
              opacity: faceIn,
              transform: `scale(${sScale})`,
              transformOrigin: "50% 50%",
            }}
          >
            <div style={{ boxShadow: `0 ${10 * (1 - fly)}px ${30 * (1 - fly)}px rgba(201,58,87,${0.25 * (1 - fly)})`, borderRadius: BIG * 0.22 }}>
              <ClaudeFace size={BIG} />
            </div>
          </div>
        ) : null}
        {f < FLY0 + 6 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: BIG_AT.y + BIG / 2 + 26,
              textAlign: "center",
              fontSize: 46,
              fontWeight: 700,
              color: T.ink,
              opacity: t01(f, FACE_IN + 4, FACE_IN + 14) * (1 - labelOut),
              transform: `translateY(${(1 - t01(f, FACE_IN + 4, FACE_IN + 14)) * 12}px)`,
            }}
          >
            Claude
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
