// Scene 7 draft: "Claude works right inside Slack." A Slack-like workspace in the
// film's colours (no Slack logo), with real words: a staff question that tags
// @Claude, and Claude's answer in the thread, citing the handbook.

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

import { Card, ClaudeFace, Face, Icon, T, useV2Fonts } from "./ui.tsx";

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

function Name({ children }: { children: ReactNode }) {
  return <span style={{ fontWeight: 700, fontSize: 23, color: T.ink }}>{children}</span>;
}
function Time({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 17, color: T.ink3, fontWeight: 450 }}>{children}</span>;
}

function Message({ face, name, time, badge, children }: { face: ReactNode; name: string; time: string; badge?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 18, padding: "14px 40px" }}>
      {face}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Name>{name}</Name>
          {badge ? (
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, color: T.ink2, background: "#EEEAF0", borderRadius: 5, padding: "2px 7px", position: "relative", top: -2 }}>{badge}</span>
          ) : null}
          <Time>{time}</Time>
        </div>
        <div style={{ fontSize: 23, lineHeight: 1.45, color: T.ink, fontWeight: 420 }}>{children}</div>
      </div>
    </div>
  );
}

function Mention({ children }: { children: ReactNode }) {
  return <span style={{ background: T.tint, color: T.a1dark, fontWeight: 600, borderRadius: 5, padding: "1px 5px" }}>{children}</span>;
}

export function SlackFrame() {
  useV2Fonts();
  return (
    <AbsoluteFill style={{ background: T.ground, fontFamily: T.sans, alignItems: "center", justifyContent: "center" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 46, padding: "0 28px", color: "#fff", fontWeight: 600, fontSize: 21 }}>
            <ClaudeFace size={28} /> Claude
          </div>
        </div>

        {/* channel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.card }}>
          <div style={{ height: 84, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", borderBottom: `1.5px solid ${T.line}` }}>
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

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 40px 10px" }}>
              <div style={{ flex: 1, height: 1.5, background: T.line }} />
              <span style={{ fontSize: 16, fontWeight: 650, color: T.ink2, border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "4px 14px" }}>Today</span>
              <div style={{ flex: 1, height: 1.5, background: T.line }} />
            </div>
            <Message face={<Face initials="AK" color={T.a3dark} />} name="Ana Kim" time="8:52 AM">
              Team meeting moves to 3:30 today, in room B.
            </Message>
            <Message face={<Face initials="JL" color={T.a1} />} name="Jun Lee" time="9:38 AM">
              Signs for Saturday&rsquo;s cleanup are up in the lobby.
            </Message>
            <Message face={<Face initials="MR" color={T.a2} />} name="Maria Reyes" time="9:41 AM">
              Someone is asking when summer registration closes. <Mention>@Claude</Mention> can you check the handbook?
            </Message>
            <Message face={<ClaudeFace />} name="Claude" badge="APP" time="9:41 AM">
              <div>Summer registration closes on May 15. After that, sign-ups need a manager&rsquo;s OK.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, width: 520, border: `1.5px solid ${T.line}`, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: T.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="file-pdf:fill" size={28} color={T.a1} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 20, fontWeight: 650, color: T.ink }}>Member Handbook 2026.pdf</span>
                  <span style={{ fontSize: 16, color: T.ink3 }}>Page 12 &middot; Registration</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 17, fontWeight: 650, color: T.a2dark, background: "#E3F5F4", border: `1.5px solid #B9E6E4`, borderRadius: 999, padding: "4px 12px" }}>
                  <Icon name="check:bold" size={17} color={T.a2dark} /> 3
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 17, fontWeight: 600, color: T.ink2, border: `1.5px solid ${T.line}`, borderRadius: 999, padding: "4px 12px" }}>
                  <Icon name="chat-circle" size={17} color={T.ink2} /> 2 replies
                </span>
              </div>
            </Message>
          </div>

          <div style={{ margin: "6px 40px 30px", border: `1.5px solid #D9D2C8`, borderRadius: 12, padding: "16px 18px 12px" }}>
            <div style={{ fontSize: 21, color: T.ink3 }}>Message #front-desk</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <div style={{ display: "flex", gap: 18 }}>
                {["plus", "text-aa", "smiley", "at", "paperclip"].map((n) => (
                  <Icon key={n} name={n} size={22} color={T.ink3} />
                ))}
              </div>
              <div style={{ width: 40, height: 34, borderRadius: 8, background: "#EEEAF0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="paper-plane-right:fill" size={20} color={T.ink3} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
}
