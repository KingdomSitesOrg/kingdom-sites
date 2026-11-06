// Version 2 look (Thomas, 2026-11-06, after "Introducing Personal Finance in
// Claude"): flat, real interface with real words, white cards with a hairline
// border and a soft shadow, small corner radii, a warm off-white ground, Inter
// for the interface and Newsreader (serif) for Claude's own words. Never italics.

import { loadFont } from "@remotion/fonts";
import type { CSSProperties, ReactNode } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

import { ICONS } from "./icons.ts";

export const T = {
  ground: "#FAF7F2",
  card: "#FFFFFF",
  line: "#E9E3DA",
  ink: "#1E1B22",
  ink2: "#5C5762",
  ink3: "#8E8893",
  bubble: "#EFEBE5",
  side: "#2B2440", // the Berry ink: a dark plum sidebar
  a1: "#EE4F6E", // raspberry
  a1dark: "#C93A57",
  a2: "#1FAFAC", // teal
  a2dark: "#178C89",
  a3: "#FFC64A", // butter
  a3dark: "#E7AE2E",
  tint: "#FCE4EA",
  sans: "Inter",
  serif: "Newsreader",
  shadow: "0 1px 2px rgba(30,27,34,0.05), 0 10px 30px rgba(30,27,34,0.07)",
} as const;

let ready: Promise<void> | null = null;
function loadV2Fonts(): Promise<void> {
  if (ready) return ready;
  ready = Promise.all([
    loadFont({ family: T.sans, url: staticFile("fonts/Inter-var.ttf"), weight: "100 900", display: "block" }),
    loadFont({ family: T.serif, url: staticFile("fonts/Newsreader-var.ttf"), weight: "200 800", display: "block" }),
  ]).then(() => {
    for (const fam of [T.sans, T.serif]) {
      if (!document.fonts.check(`500 40px "${fam}"`)) throw new Error(`fonts: ${fam} did not load`);
    }
  });
  return ready;
}

export function useV2Fonts() {
  const handle = delayRender("v2 fonts");
  loadV2Fonts().then(
    () => continueRender(handle),
    (err) => cancelRender(err),
  );
}

export function Icon({ name, size = 24, color = "currentColor", style }: { name: string; size?: number; color?: string; style?: CSSProperties }) {
  const d = ICONS[name];
  if (!d) throw new Error(`icon ${name} missing`);
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: "block", flex: "none", ...style }}>
      <path d={d} fill={color} />
    </svg>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.line}`, borderRadius: 20, boxShadow: T.shadow, ...style }}>{children}</div>
  );
}

/** A person: a rounded square with initials, Slack style. */
export function Face({ initials, color, size = 52 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: color,
        color: "#fff",
        fontFamily: T.sans,
        fontWeight: 650,
        fontSize: size * 0.38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        letterSpacing: 0.3,
      }}
    >
      {initials}
    </div>
  );
}

/** Claude in the film: a raspberry rounded square with a white sparkle (not Anthropic's mark). */
export function ClaudeFace({ size = 52 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: T.a1, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <Icon name="sparkle:fill" size={size * 0.62} color="#fff" />
    </div>
  );
}

/** The one pointer for the flat look: a crisp arrow (or a text I-beam over editable text),
 * ink with a white edge, scaled about its tip. */
export function Pointer({ x, y, scale = 1, mode = "arrow", opacity = 1 }: { x: number; y: number; scale?: number; mode?: "arrow" | "text"; opacity?: number }) {
  if (mode === "text") {
    return (
      <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, pointerEvents: "none", opacity }}>
        <svg width={20} height={40} viewBox="0 0 10 20" style={{ position: "absolute", left: -10, top: -20, filter: "drop-shadow(0 1px 2px rgba(30,27,34,0.25))" }}>
          <path d="M2 1.5 H4 Q5 1.5 5 3 V17 Q5 18.5 4 18.5 H2 M8 1.5 H6 Q5 1.5 5 3 M5 17 Q5 18.5 6 18.5 H8" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
          <path d="M2 1.5 H4 Q5 1.5 5 3 V17 Q5 18.5 4 18.5 H2 M8 1.5 H6 Q5 1.5 5 3 M5 17 Q5 18.5 6 18.5 H8" fill="none" stroke={T.ink} strokeWidth={1.3} strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, pointerEvents: "none", opacity }}>
      <svg
        width={44}
        height={56}
        viewBox="0 0 22 28"
        style={{ position: "absolute", left: -3, top: -2, transformOrigin: "3px 2px", transform: `scale(${scale})`, filter: "drop-shadow(0 3px 5px rgba(30,27,34,0.28))" }}
      >
        <path d="M2 1.5 L2 22.5 L7.4 17.6 L11 25.8 L14.6 24.2 L11.1 16.2 L18.4 16.2 Z" fill={T.ink} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
