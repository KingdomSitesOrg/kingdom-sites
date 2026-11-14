// Timing, colours and the stop-motion helpers every scene uses.
import { random } from "remotion";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
/** 120 BPM at 30 fps: one beat is 15 frames. */
export const BEAT = 15;
/** Scene time runs 1.25x film time (Thomas, property draft 1: "a little bit faster"): scenes are
    written on the café ad's grid (a beat is 15 units, a pose 2.5), and the film plays them at
    150 BPM, a beat every 12 frames and a pose every 2 frames. */
export const SPEED = 1.25;
/** 457.5 scene units. */
export const DURATION = 366;
/** Stop-motion: 12 poses a second, so a pose holds for 2.5 frames. */
export const STEP = 2.5;

export const C = {
  ink: "#15181d",
  paper: "#f5f7fa",
  white: "#ffffff",
  blue: "#0a63c9",
  blueHi: "#4a9bff",
  warm: "#c05a2b",
  gold: "#c9973f",
  cream: "#f3e4cc",
  coffee: "#5a3a2a",
  crust: "#d99a4b",
  crustDk: "#a2642a",
  grey: "#dfe3e8",
  body: "#575d67",
  muted: "#838a94",
  green: "#2f7a5c",
  greenDk: "#1f5a43",
  keyDk: "#9c7426",
};

export const FONT = "Archivo";
export const UI = "Inter, -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

/** The frame snapped to the pose it belongs to. Every move is computed from this. */
export const q = (f: number) => Math.floor(f / STEP + 1e-6) * STEP;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const outCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const inOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Overshoot, then rest. */
export const outBack = (t: number, s = 1.9) => {
  const x = clamp(t);
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};

/** The hand-placed wobble of stop-motion: a new tiny offset every four poses. Half the café ad's,
    which was already cut once (Thomas, property draft 1: "again less shaking"). */
export const boil = (id: string, f: number, amp = 1) => {
  const k = Math.floor(f / (STEP * 4) + 1e-6);
  return {
    x: (random(`${id}x${k}`) - 0.5) * 0.8 * amp,
    y: (random(`${id}y${k}`) - 0.5) * 0.8 * amp,
    r: (random(`${id}r${k}`) - 0.5) * 0.3 * amp,
  };
};
export const boilT = (id: string, f: number, amp = 1) => {
  const b = boil(id, f, amp);
  return `translate(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px) rotate(${b.r.toFixed(2)}deg)`;
};

/** Paper cut-out shadow: hard, offset, no blur. */
export const CUT_SHADOW = "drop-shadow(7px 9px 0 rgba(0,0,0,0.24))";
