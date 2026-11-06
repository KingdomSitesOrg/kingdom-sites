// Shared building blocks for the version 2 scenes: timing helpers, chat
// bubbles, typed and streamed text, the caret, Claude's thinking dots, and a
// button with a press (it sinks) and an after state (its label and colour
// change). Every scene imports from here and from ui.tsx, so the film reads as
// one product.

import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate } from "remotion";

import tlJson from "../../timeline-v2.json";
import { Icon, T } from "./ui.tsx";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.33, 0, 0.2, 1);
export const pop = Easing.out(Easing.back(1.5));

// ---------------------------------------------------------------- the timeline

export type Word = { text: string; start: number; end: number };
export type SceneT = {
  id: string;
  name: string;
  start: number;
  length: number;
  picture: string;
  voice: { file: string; start: number; localStart: number; frames: number; text: string; words: Word[] };
};
export const TL = tlJson as unknown as { fps: number; width: number; height: number; durationInFrames: number; scenes: SceneT[] };

export function sceneT(id: string): SceneT {
  const s = TL.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`timeline-v2 has no scene ${id}`);
  return s;
}

/** Local frame (0-based, inside the scene) where the nth (0-based) word matching `text` starts.
 * Matching ignores case and punctuation, so wordAt("s07", "Slack") finds "Slack,". */
export function wordAt(id: string, text: string, nth = 0, edge: "start" | "end" = "start"): number {
  const s = sceneT(id);
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9@'-]/g, "");
  const hits = s.voice.words.filter((w) => norm(w.text) === norm(text));
  const w = hits[nth];
  if (!w) throw new Error(`${id}: no word "${text}" #${nth} in "${s.voice.text}"`);
  return w[edge] - s.start;
}

// ---------------------------------------------------------------- motion

/** 0 → 1 over [f0, f1], eased; clamped both ends. */
export function t01(f: number, f0: number, f1: number, easing = ease) {
  return interpolate(f, [f0, f1], [0, 1], { ...clamp, easing });
}

/** A card or line arriving: rises 18 px and fades in over 8 frames from `at`. */
export function enter(f: number, at: number, dist = 18): CSSProperties {
  const k = t01(f, at, at + 8);
  return { opacity: k, transform: `translateY(${(1 - k) * dist}px)` };
}

/** Leaving: fades and drops 10 px over 6 frames from `at`. */
export function leave(f: number, at: number): CSSProperties {
  const k = t01(f, at, at + 6);
  return { opacity: 1 - k, transform: `translateY(${k * 10}px)` };
}

/** 0 = up, 1 = fully down: down over 3 frames before the press, back up over 6 after. */
export function pressAmount(f: number, at: number) {
  if (f < at - 3 || f > at + 6) return 0;
  return f <= at ? interpolate(f, [at - 3, at], [0, 1], clamp) : interpolate(f, [at, at + 6], [1, 0], clamp);
}

// ---------------------------------------------------------------- text

/** Text typed in a character at a time from `start`. */
export function Typed({ text, start, perChar = 1, f }: { text: string; start: number; perChar?: number; f: number }) {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - start) / perChar)));
  return <>{text.slice(0, n)}</>;
}

/** Claude's words fade in a word at a time, laid out from the start so nothing jumps. */
export function Stream({ text, start, f, perWord = 2 }: { text: string; start: number; f: number; perWord?: number }) {
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

export function Caret({ f, from, height = 30 }: { f: number; from: number; height?: number }) {
  const on = Math.floor((f - from) / 8) % 2 === 0 || f < from + 4;
  return <span style={{ display: "inline-block", width: 2.5, height, background: T.ink, verticalAlign: "-6px", marginLeft: 1, opacity: on ? 1 : 0 }} />;
}

/** The person's message: a grey pill, as in the reference. */
export function Bubble({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: T.bubble, borderRadius: 999, padding: "18px 30px", fontSize: 27, color: T.ink, fontWeight: 430, whiteSpace: "nowrap", ...style }}>{children}</div>;
}

/** Claude's own words: serif, beside the Claude square. */
export function ClaudeSays({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontFamily: T.serif, fontSize: 32, lineHeight: 1.3, color: T.ink, fontWeight: 420, ...style }}>{children}</div>;
}

/** Claude thinking: three Berry dots bobbing. */
export function ThinkingDots({ f, from }: { f: number; from: number }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "center", height: 32 }}>
      {[T.a1, T.a2, T.a3].map((c, i) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, transform: `translateY(${Math.sin((f - from) * 0.6 - i * 0.9) * 4}px)` }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- buttons

/**
 * A button with a press and an after state. `press` is the frame it is clicked
 * (or null); `after` is what it turns into (label, icon, colours). It sinks on
 * the press, then cross-fades to the after state over 4 frames.
 */
export function PressButton({
  f,
  press,
  label,
  icon,
  bg,
  fg = "#fff",
  after,
  width = 206,
  height = 62,
  fontSize = 23,
  style,
}: {
  f: number;
  press: number | null;
  label: string;
  icon?: string;
  bg: string;
  fg?: string;
  after?: { label: string; icon?: string; bg: string; fg?: string };
  width?: number;
  height?: number;
  fontSize?: number;
  style?: CSSProperties;
}) {
  const down = press === null ? 0 : pressAmount(f, press);
  const k = press === null || !after ? 0 : interpolate(f, [press + 1, press + 5], [0, 1], clamp);
  const face = (l: string, ic: string | undefined, b: string, c: string, o: number) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: o,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize,
        fontWeight: 650,
        background: b,
        color: c,
        whiteSpace: "nowrap",
        transform: `translateY(${down * 4}px) scale(${1 - down * 0.05})`,
        boxShadow: down > 0.01 ? "inset 0 3px 6px rgba(0,0,0,0.2)" : "0 2px 0 rgba(30,27,34,0.10), 0 6px 14px rgba(30,27,34,0.10)",
      }}
    >
      {ic ? <Icon name={ic} size={fontSize} color={c} /> : null}
      {l}
    </div>
  );
  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {face(label, icon, bg, fg, 1 - k)}
      {after ? face(after.label, after.icon, after.bg, after.fg ?? "#fff", k) : null}
    </div>
  );
}
