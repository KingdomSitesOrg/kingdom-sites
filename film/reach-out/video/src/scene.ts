// Reach out: the whole film as tiles. Everything is worked out per "step" (a stop-motion pose,
// 12 a second); drawStep paints the pose for one step. See ../SCRIPT.md for the beat sheet.
//
// The wall is 360 by 640 tiles (2 px tiles in 3 px cells), as in Bend reality. Layers, all tiles:
//   1. the dark wall with its pale foot;
//   2. the illusion: a counter-rotating ring tunnel, at full strength from the first step;
//   3. the mirrors: 48 flat panels in 3D that crack out of the illusion, fly and flip into a laptop,
//      then into an app on a phone with two more screens behind it;
//   4. the hand, made of the illusion's tiles;
//   5. the burst and the words.
// The illusion and the screens stay dim; only the words, the button and small accents are bright.
import timeline from "../timeline.json";
import { wordCells, wordUnits } from "./glyphs";
import { GROUT_SKY, GROUT_WALL, INK, RIM_FAR, RIM_NEAR, T_LIME, T_WHITE, clamp, hash, noise, pick, skyTone, wallTone } from "./tiles";

export const T = timeline;
export const W = T.width;
export const H = T.height;
export const CELL = T.cell;
export const COLS = W / CELL; // 360
export const ROWS = H / CELL; // 640
const N = COLS * ROWS;
const SPS = T.stepsPerSecond;
const CX = COLS / 2;
const CY = 290;

export const stepOf = (frame: number) => Math.floor((frame * SPS) / T.fps);
const fract = (v: number) => v - Math.floor(v);
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ───────────────────────────── the timeline (steps) ─────────────────────────────
// A beat is 6 steps (120 BPM); bars start on the even seconds.
export const HAND_IN = 4; // the hand appears in the hole
export const HAND_PEAK = 48; // 4.0 s: the hand is nearest, reaching out at you
export const SWING = 50; // the mirrors crack out and the camera swings
export const LAPTOP = 84; // 7.0 s: the laptop is assembled
export const TAP = 96; // 8.0 s: the fingertip presses the button
export const APP = 98; // the screen flips into the app
export const FLOAT = 120; // 10.0 s: the app floats
export const EXPLODE = 144; // 12.0 s: the burst
export const LAND = 168; // 14.0 s: the words land
export const FADE = 218; // the words begin to dim
export const STEPS = 224;
export const DURATION_FRAMES = Math.ceil((STEPS * T.fps) / SPS);

// ───────────────────────────── the wall ─────────────────────────────

const wallTones: string[] = [];
const isDark = new Uint8Array(N);
const isPale = new Uint8Array(N);
const DIM = ["#1F1B33", "#262140", "#14302E", "#1A1731"];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const edge = ROWS - (44 + (noise(c / 30, 0, 41) - 0.5) * 16);
    const out = edge - (r + 0.5);
    const rag = (hash(c, r, 1) - 0.5) * 5;
    let tone: string;
    if (out > rag) {
      const glow = out < 16 ? Math.pow(1 - out / 16, 2) * 0.8 : 0;
      const quiet = r >= 30 && out > 50;
      if (glow && hash(c, r, 4) < glow) tone = pick(out < 5 ? RIM_NEAR : RIM_FAR, hash(c, r, 6));
      else if (quiet && hash(c, r, 13) < 0.03) tone = pick(DIM, hash(c, r, 14));
      else tone = skyTone(c, r, quiet);
      if (out > 18) isDark[r * COLS + c] = 1;
    } else {
      tone = wallTone(0.5 + clamp(-out / 28) * 0.5 + (hash(c, r, 7) - 0.5) * 0.3);
      isPale[r * COLS + c] = 1;
    }
    wallTones.push(tone);
  }
}

// ───────────────────────────── colours ─────────────────────────────

const colours = new Map<string, number>();
function px(hex: string): number {
  let v = colours.get(hex);
  if (v === undefined) {
    const n = parseInt(hex.slice(1), 16);
    v = (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
    colours.set(hex, v);
  }
  return v;
}
function mixPx(a: number, b: number, t: number): number {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ch = (s: number) => Math.round(((a >>> s) & 255) + (((b >>> s) & 255) - ((a >>> s) & 255)) * t);
  return (0xff000000 | (ch(16) << 16) | (ch(8) << 8) | ch(0)) >>> 0;
}
/** Relative brightness of a pixel, 0..1 (rough). */
function lum(p: number): number {
  return (0.2126 * (p & 255) + 0.7152 * ((p >>> 8) & 255) + 0.0722 * ((p >>> 16) & 255)) / 255;
}
const RAMPS = [
  ["#1A1731", "#262140", "#342E55", "#4A4275", "#6257A0"], // violet
  ["#0C2624", "#103633", "#144A45", "#18615A", "#1A7067"], // teal
  ["#2A1320", "#3D1A2A", "#562236", "#732B44", "#8F3352"], // rose
].map((r) => r.map(px));
const HAND = ["#3A2734", "#55384A", "#77505E", "#9C6C72", "#C2918A"].map(px);
const HAND_RIM = [px("#F2E2D0"), px("#E8D2BE"), px("#F8F0E4")];
const SKY_PX = px(GROUT_SKY);
const PALE_PX = px(GROUT_WALL);
const INK_PX = px(INK);
const WALL_PX = Uint32Array.from(wallTones, px);

/** Paints one tile: its cell is cleared to the gap colour, then the tile is laid (1, 2 or 3 px). */
function put(b: Uint32Array, c: number, r: number, colour: number, size: number, gap: number) {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
  const o = r * CELL * W + c * CELL;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) b[o + y * W + x] = y < size && x < size ? colour : gap;
}

// ───────────────────────────── the music's pulse ─────────────────────────────
const DECAY = [1, 0.5, 0.25, 0.12, 0.05, 0];
/** The beat's push on a step: highest on the beat, gone by the next. */
export function kick(step: number) {
  if (step < 0) return 0;
  const beat = step - (step % 6);
  const accent = beat % 24 === 0 ? 1 : beat % 24 === 12 ? 0.75 : 0.55;
  const quiet = beat >= 84 && beat < 96 ? 0.3 : beat >= EXPLODE && beat < LAND ? 0 : 1; // the music's break, and the hit's ring
  return accent * DECAY[step % 6] * quiet;
}

// ───────────────────────────── the illusion ─────────────────────────────
// A tunnel of rings cut into checker cells. Alternate rings turn opposite ways, the rings wobble
// into three lobes, and they stream outward at the viewer, faster while the hand comes out.

const rho = new Float32Array(N);
const theta = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const c = i % COLS;
  const r = (i / COLS) | 0;
  rho[i] = Math.hypot(c - CX, r - CY);
  theta[i] = Math.atan2(r - CY, c - CX);
}
// The illusion's own clock: one tick a step, a surge on each beat, and faster while the hand nears.
const CLOCK = new Float32Array(STEPS + 1);
for (let s = 1; s <= STEPS; s++) {
  const rush = s >= HAND_IN && s <= HAND_PEAK ? 1.4 * Math.pow((s - HAND_IN) / (HAND_PEAK - HAND_IN), 2) : 0;
  CLOCK[s] = CLOCK[s - 1] + 1 + kick(s) + rush;
}
const field = new Float32Array(N); // strength 0..1 per tile
const fieldRamp = new Uint8Array(N); // which colour ramp
function rings(step: number) {
  const t = CLOCK[Math.max(0, Math.min(STEPS, step))];
  for (let i = 0; i < N; i++) {
    const d = rho[i];
    if (d < 7) {
      field[i] = 0;
      continue;
    }
    const th = theta[i];
    const L = Math.log(d + 4) + 0.11 * Math.sin(3 * th + t * 0.05);
    const ringF = L * 6.5 - t * 0.075;
    const n = Math.floor(ringF);
    const fr = ringF - n;
    const dir = n & 1 ? 1 : -1;
    const sec = (th / (2 * Math.PI)) * 14 + dir * t * 0.045 + L * 1.1;
    const fs = fract(sec);
    const on = (n + Math.floor(sec)) & 1;
    // Each cell is shaded like a little pillow, so the checker reads as tiles bulging at you.
    const pillow = Math.sin(Math.PI * fr) * Math.sin(Math.PI * fs);
    let s = on ? 0.3 + 0.7 * pillow : pillow > 0.85 ? 0.12 : 0;
    // Ring edges, a thin line, give the depth.
    if (fr < 0.07) s = Math.max(s, 0.45);
    field[i] = s * clamp((d - 7) / 30);
    fieldRamp[i] = n & 1 ? 0 : 1;
  }
}

// ───────────────────────────── the camera and the mirrors ─────────────────────────────
// The mirrors are flat panels in 3D. The camera sits DIST in front of the origin and looks at it;
// FOCAL tiles of picture is one world unit at the origin's depth.
const DIST = 6;
const FOCAL = 720;
type V3 = [number, number, number];
type Cam = { yaw: number; pitch: number; at: V3 };
function camAt(step: number): Cam {
  if (step < SWING) return { yaw: 0, pitch: 0, at: [0, 0, 0] };
  if (step < LAPTOP) {
    const e = smooth((step - SWING) / (LAPTOP - SWING));
    return { yaw: 1.15 * Math.sin(Math.PI * e) - 0.42 * e, pitch: 0.4 * e, at: [0, -0.15 * e, 0.1 * e] };
  }
  if (step < APP) return { yaw: -0.42, pitch: 0.4, at: [0, -0.15, 0.1] };
  if (step < FLOAT) {
    const e = smooth((step - APP) / (FLOAT - APP));
    return { yaw: -0.42 * (1 - e) + 0.25 * Math.sin(Math.PI * e), pitch: 0.4 * (1 - e), at: [0, -0.15 * (1 - e), 0.1 * (1 - e)] };
  }
  const u = (step - FLOAT) / 48;
  return { yaw: 0.08 * Math.sin(2 * Math.PI * u), pitch: 0.05 * Math.sin(2 * Math.PI * u * 1.5), at: [0, 0, 0] };
}
function project(cam: Cam, p: V3): [number, number, number] {
  const x = p[0] - cam.at[0];
  const y = p[1] - cam.at[1];
  const z = p[2] - cam.at[2];
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const y1 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  const depth = DIST + z2;
  return [CX + (FOCAL * x1) / depth, CY + (FOCAL * y1) / depth, depth];
}
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const lerp3 = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);

// What a face of a panel shows: a texture and the panel's place in that texture's grid.
type Tex = "mirror" | "screen" | "keys" | "appA" | "appB" | "appC";
type Face = { tex: Tex; ci: number; cj: number; nc: number; nr: number };
type Panel = { k: number; p: V3; u: V3; v: V3; flip: number; seam: number; land: number; front: Face; back: Face };

// Where each panel sits at each stage. Panels 0..23 start as the top half of the illusion, become
// the laptop's screen, then the phone. Panels 24..47 start as the bottom half, become the keyboard
// deck, then the two screens behind the phone.
const START_ROW = 72; // tiles to a start panel's height
const START_COL = 60;
function startOf(k: number): { p: V3; u: V3; v: V3 } {
  const i = k % 6;
  const j = Math.floor(k / 6);
  return { p: [(START_COL * (i + 0.5) - CX) / 120, (START_ROW * (j + 0.5) - CY) / 120, 0], u: [0.5, 0, 0], v: [0, 0.6, 0] };
}
const HINGE: V3 = [0, 0.55, 0.75];
const TILT = (12 * Math.PI) / 180;
const UP: V3 = [0, -Math.cos(TILT), Math.sin(TILT)];
function laptopOf(k: number): { p: V3; u: V3; v: V3 } {
  if (k < 24) {
    const i = k % 6;
    const j = Math.floor(k / 6);
    const p = add([-1.2 + 0.4 * (i + 0.5), HINGE[1], HINGE[2]], UP, 1.5 - 0.375 * (j + 0.5));
    return { p, u: [0.4, 0, 0], v: [0, Math.cos(TILT) * 0.375, -Math.sin(TILT) * 0.375] };
  }
  const m = k - 24;
  const i = m % 6;
  const j = Math.floor(m / 6);
  return { p: [-1.2 + 0.4 * (i + 0.5), HINGE[1], HINGE[2] - 0.375 * (j + 0.5)], u: [0.4, 0, 0], v: [0, 0, -0.375] };
}
const PHONE_W = 1.45;
const PHONE_H = 2.9;
function appOf(k: number, step: number): { p: V3; u: V3; v: V3 } {
  const t = (step - FLOAT) / 12;
  if (k < 24) {
    const i = k % 4;
    const j = Math.floor(k / 4);
    const bob = step >= FLOAT ? 0.07 * Math.sin(Math.PI * 0.5 * t) : 0;
    return { p: [-PHONE_W / 2 + (PHONE_W / 4) * (i + 0.5), -0.1 - PHONE_H / 2 + (PHONE_H / 6) * (j + 0.5) + bob, 0], u: [PHONE_W / 4, 0, 0], v: [0, PHONE_H / 6, 0] };
  }
  const m = k - 24;
  const left = m < 12;
  const n = left ? m : m - 12;
  const i = n % 3;
  const j = Math.floor(n / 3);
  const a = left ? 0.3 : -0.3; // turned to face in toward the phone
  const cx = left ? -1.32 : 1.32;
  const bob = step >= FLOAT ? 0.09 * Math.sin(Math.PI * 0.5 * t + (left ? 1.7 : 3.4)) : 0;
  const lx = -0.6 + 0.4 * (i + 0.5);
  const ly = -1.2 + 0.6 * (j + 0.5);
  return { p: [cx + lx * Math.cos(a), (left ? -0.45 : 0.25) + ly + bob, 1.0 - lx * Math.sin(a)], u: [0.4 * Math.cos(a), 0, -0.4 * Math.sin(a)], v: [0, 0.6, 0] };
}
const mirrorFace = (k: number): Face => ({ tex: "mirror", ci: k % 6, cj: Math.floor(k / 6), nc: 6, nr: 8 });
function laptopFace(k: number): Face {
  if (k < 24) return { tex: "screen", ci: k % 6, cj: Math.floor(k / 6), nc: 6, nr: 4 };
  const m = k - 24;
  return { tex: "keys", ci: m % 6, cj: Math.floor(m / 6), nc: 6, nr: 4 };
}
function appFace(k: number): Face {
  if (k < 24) return { tex: "appA", ci: k % 4, cj: Math.floor(k / 4), nc: 4, nr: 6 };
  const m = k - 24;
  const n = m % 12;
  return { tex: m < 12 ? "appB" : "appC", ci: n % 3, cj: Math.floor(n / 3), nc: 3, nr: 4 };
}

/** Every panel's place on a step, or none before the mirrors crack out. */
function panelsAt(step: number): Panel[] {
  if (step < SWING) return [];
  const out: Panel[] = [];
  for (let k = 0; k < 48; k++) {
    const lag = hash(k, 3, 201);
    if (step < LAPTOP) {
      // Crack, then each flies on its own arc, flipping once, and lands by step 84.
      const s0 = SWING + 2 + Math.floor(lag * 8);
      const x = clamp((step - s0) / (LAPTOP - 2 - s0));
      const e = smooth(x);
      const a = startOf(k);
      const b = laptopOf(k);
      const arc = Math.sin(Math.PI * e);
      const side = (k % 6) - 2.5;
      const p = add(lerp3(a.p, b.p, e), [side * 0.35 * arc, -0.5 * arc * (k < 24 ? 1 : -0.4), -1.4 * arc * (0.5 + hash(k, 4, 202))]);
      out.push({ k, p, u: lerp3(a.u, b.u, e), v: lerp3(a.v, b.v, e), flip: 2 * Math.PI * e, seam: clamp((step - SWING + 1) / 3), land: clamp((x - 0.7) / 0.3), front: mirrorFace(k), back: mirrorFace(k) });
    } else if (step < APP) {
      const b = laptopOf(k);
      out.push({ k, ...b, flip: 0, seam: 0, land: 1, front: laptopFace(k), back: laptopFace(k) });
    } else {
      // Each flips over to show the app and travels to its place on the phone or a side screen.
      const s0 = APP + Math.floor(lag * 8) + (k < 24 ? 0 : 3);
      const x = clamp((step - s0) / 12);
      const e = smooth(x);
      const a = laptopOf(k);
      const b = appOf(k, step);
      const arc = Math.sin(Math.PI * e);
      const p = add(lerp3(a.p, b.p, e), [0, 0, -0.6 * arc]);
      out.push({ k, p, u: lerp3(a.u, b.u, e), v: lerp3(a.v, b.v, e), flip: Math.PI * smooth(x * 1.6), seam: step >= FLOAT ? clamp(1 - (step - FLOAT) / 4) : 1 - clamp((x - 0.85) / 0.15) * 0.6, land: 1, front: laptopFace(k), back: appFace(k) });
    }
  }
  return out;
}

// ───────────────────────────── the textures ─────────────────────────────
// Each returns a colour and a tile size, or 0 for nothing (the panel is see-through there).
// (u, v) run 0..1 across and down the whole surface the panel belongs to.

type Hit = [number, number];
const C_GLASS = px("#0F0D18");
const C_GLINT = px("#2C2840");
const C_GLASS2 = px("#0D0B15");
const C_RIM = px("#5A518C");
const C_RIM_HI = px("#8C86B0");
const C_SCREEN = px("#100E1A");
const C_BAR = px("#1A1731");
const C_SKEL = px("#2C2840");
const C_SKEL_HI = px("#4A4275");
const C_LIME = px("#C6F432");
const C_LIME_DIM = px("#58722A");
const C_LIME_MID = px("#8FB024");
const C_TEAL_CARD = px("#103633");
const C_TEAL = px("#22D6B2");
const C_ROSE_CARD = px("#3D1A2A");
const C_CORAL = px("#FF4D6D");
const C_VIOLET_CARD = px("#262140");
const C_WHITE = px("#E9E4D8");
const C_KEY = px("#3A3460");
const C_DECK = px("#211D36");
const C_PAD = px("#2C2840");

/** Inside a rounded box (u0, v0)..(u1, v1), with corner radius rr in u units; `asp` is height/width. */
function inBox(u: number, v: number, u0: number, v0: number, u1: number, v1: number, rr: number, asp: number) {
  if (u < u0 || u > u1 || v < v0 || v > v1) return false;
  const rv = rr / asp;
  const du = u < u0 + rr ? u0 + rr - u : u > u1 - rr ? u - (u1 - rr) : 0;
  const dv = v < v0 + rv ? v0 + rv - v : v > v1 - rv ? v - (v1 - rv) : 0;
  return du === 0 || dv === 0 || (du / rr) ** 2 + (dv / rv) ** 2 <= 1;
}
const inCircle = (u: number, v: number, cu: number, cv: number, r: number, asp: number) => (u - cu) ** 2 + ((v - cv) * asp) ** 2 <= r * r;

function mirrorTex(f: Face, lu: number, lv: number, step: number, k: number, c: number, r: number): Hit {
  // The panel reflects the live illusion where it started, drifting as it flies.
  const fly = clamp((step - SWING) / 20);
  const sc = Math.round(START_COL * (f.ci + lu) + fly * 70 * (hash(k, 5, 203) - 0.5));
  const sr = Math.round(START_ROW * (f.cj + lv) + fly * 90 * (hash(k, 6, 204) - 0.5));
  const cc = Math.min(COLS - 1, Math.max(0, sc));
  const rr = Math.min(ROWS - 1, Math.max(0, sr));
  const i = rr * COLS + cc;
  const s = field[i];
  if (fract(lu * 0.8 + lv * 0.5 + fly * 1.7) < 0.035) return [C_GLINT, 2];
  if (s <= 0.04) return [hash(c, r, 9) < 0.5 ? C_GLASS : C_GLASS2, 2];
  return [RAMPS[fieldRamp[i]][Math.min(4, Math.floor(s * 5))], s > 0.5 ? 2 : 1];
}

function screenTex(u: number, v: number, step: number): Hit {
  const asp = 1.5 / 2.4;
  // The tap's ring, running out from the button.
  if (step >= TAP && step < APP + 8) {
    const d = Math.hypot(u - 0.5, (v - 0.62) * asp);
    const rad = 0.06 + (step - TAP) * 0.07;
    if (Math.abs(d - rad) < 0.018) return [C_LIME_DIM, 2];
  }
  if (inBox(u, v, 0.37, 0.53, 0.63, 0.71, 0.08, asp)) {
    const pressed = step >= TAP && step < TAP + 2;
    return [pressed ? C_LIME_MID : C_LIME, pressed ? 1 : 2];
  }
  if (v < 0.09) {
    for (const cu of [0.05, 0.09, 0.13]) if (inCircle(u, v, cu, 0.045, 0.014, asp)) return [C_SKEL_HI, 2];
    return [C_BAR, 2];
  }
  if (inBox(u, v, 0.3, 0.22, 0.7, 0.27, 0.02, asp)) return [C_SKEL_HI, 2];
  if (inBox(u, v, 0.36, 0.33, 0.64, 0.37, 0.02, asp)) return [C_SKEL, 2];
  return [C_SCREEN, 2];
}

function keysTex(u: number, v: number): Hit {
  const asp = 1.5 / 2.4;
  if (v > 0.06 && v < 0.6 && u > 0.05 && u < 0.95) {
    const ku = ((u - 0.05) / 0.9) * 12;
    const kv = ((v - 0.06) / 0.54) * 4;
    if (fract(ku) > 0.14 && fract(kv) > 0.16) return [C_KEY, 2];
    return [C_DECK, 2];
  }
  if (inBox(u, v, 0.36, 0.67, 0.64, 0.93, 0.03, asp)) return [C_PAD, 2];
  return [C_DECK, 2];
}

/** The phone's main screen: a header, a card with a chart, two small cards, a list, a tab bar. */
function appATex(u: number, v: number, step: number): Hit {
  const asp = 2;
  const since = step - APP;
  if (v < 0.035) return [C_SCREEN, 2];
  if (v < 0.06) return inBox(u, v, 0.06, 0.04, 0.2, 0.05, 0.005, asp) || inBox(u, v, 0.8, 0.04, 0.94, 0.05, 0.005, asp) ? [C_SKEL_HI, 2] : [C_SCREEN, 2];
  if (inBox(u, v, 0.07, 0.08, 0.5, 0.105, 0.01, asp)) return [C_WHITE, 2];
  if (inCircle(u, v, 0.87, 0.093, 0.055, asp)) return [C_LIME, 2];
  // The chart card; its line draws in.
  if (inBox(u, v, 0.06, 0.14, 0.94, 0.36, 0.05, asp)) {
    if (inBox(u, v, 0.11, 0.165, 0.38, 0.185, 0.01, asp)) return [C_SKEL_HI, 2];
    const drawn = clamp((since - 8) / 16);
    const x = (u - 0.1) / 0.8;
    if (x >= 0 && x <= drawn) {
      const y = 0.33 - 0.12 * x - 0.03 * Math.sin(x * 9);
      if (Math.abs(v - y) < 0.009) return [C_TEAL, 2];
    }
    return [C_TEAL_CARD, 2];
  }
  if (inBox(u, v, 0.06, 0.39, 0.485, 0.55, 0.05, asp)) return inCircle(u, v, 0.16, 0.44, 0.045, asp) ? [C_CORAL, 2] : inBox(u, v, 0.1, 0.5, 0.36, 0.515, 0.008, asp) ? [C_SKEL_HI, 2] : [C_ROSE_CARD, 2];
  if (inBox(u, v, 0.515, 0.39, 0.94, 0.55, 0.05, asp)) return inCircle(u, v, 0.62, 0.44, 0.045, asp) ? [C_LIME, 2] : inBox(u, v, 0.56, 0.5, 0.82, 0.515, 0.008, asp) ? [C_SKEL_HI, 2] : [C_VIOLET_CARD, 2];
  // The list: after it floats, it scrolls up by one row on a beat.
  const scroll = step >= FLOAT + 12 ? 0.1 * smooth((step - FLOAT - 12) / 3) : 0;
  if (v > 0.58 && v < 0.89) {
    const lv = v + scroll - 0.59;
    const row = Math.floor(lv / 0.1);
    const rv = lv - row * 0.1;
    if (rv < 0.08) {
      if (inCircle(u, rv, 0.13, 0.04, 0.05, asp)) return [row % 3 === 0 ? C_TEAL : row % 3 === 1 ? C_CORAL : C_LIME_DIM, 2];
      if (inBox(u, rv, 0.24, 0.02, 0.7 - 0.08 * (row % 2), 0.035, 0.008, asp)) return [C_SKEL_HI, 2];
      if (inBox(u, rv, 0.24, 0.05, 0.55, 0.06, 0.006, asp)) return [C_SKEL, 2];
    }
    if (rv > 0.09) return [C_BAR, 1];
    return [C_SCREEN, 2];
  }
  if (v > 0.92) {
    if (v > 0.935 && v < 0.975) for (let n = 0; n < 4; n++) if (inCircle(u, v, 0.17 + n * 0.22, 0.955, 0.03, asp)) return [n === 0 ? C_LIME : C_SKEL_HI, 2];
    return [C_BAR, 2];
  }
  return [C_SCREEN, 2];
}

/** A calendar screen. */
function appBTex(u: number, v: number): Hit {
  const asp = 2;
  if (inBox(u, v, 0.08, 0.07, 0.6, 0.1, 0.01, asp)) return [C_WHITE, 2];
  if (v > 0.16 && v < 0.62 && u > 0.06 && u < 0.94) {
    const gu = ((u - 0.06) / 0.88) * 5;
    const gv = ((v - 0.16) / 0.46) * 6;
    const cell = Math.floor(gu) + 5 * Math.floor(gv);
    if (fract(gu) > 0.12 && fract(gv) > 0.12) return [cell === 13 ? C_LIME : cell === 8 || cell === 21 ? C_TEAL_CARD : C_VIOLET_CARD, 2];
    return [C_SCREEN, 2];
  }
  if (inBox(u, v, 0.06, 0.68, 0.94, 0.8, 0.05, asp)) return inBox(u, v, 0.12, 0.72, 0.6, 0.745, 0.01, asp) ? [C_SKEL_HI, 2] : [C_TEAL_CARD, 2];
  if (inBox(u, v, 0.2, 0.86, 0.8, 0.93, 0.07, asp)) return [C_LIME, 2];
  return [C_SCREEN, 2];
}

/** A messages screen. */
function appCTex(u: number, v: number): Hit {
  const asp = 2;
  if (inCircle(u, v, 0.15, 0.09, 0.07, asp)) return [C_CORAL, 2];
  if (inBox(u, v, 0.28, 0.075, 0.7, 0.1, 0.01, asp)) return [C_WHITE, 2];
  const bubbles: [number, number, number, number, boolean][] = [
    [0.06, 0.18, 0.66, 0.27, false],
    [0.34, 0.31, 0.94, 0.37, true],
    [0.06, 0.41, 0.56, 0.5, false],
    [0.44, 0.54, 0.94, 0.63, true],
    [0.06, 0.67, 0.5, 0.73, false],
  ];
  for (const [u0, v0, u1, v1, mine] of bubbles) if (inBox(u, v, u0, v0, u1, v1, 0.06, asp)) return [mine ? C_TEAL_CARD : C_VIOLET_CARD, 2];
  if (inBox(u, v, 0.06, 0.86, 0.94, 0.93, 0.07, asp)) return inCircle(u, v, 0.87, 0.895, 0.03, asp) ? [C_LIME, 2] : [C_BAR, 2];
  return [C_SCREEN, 2];
}

function faceTex(f: Face, lu: number, lv: number, step: number, k: number, c: number, r: number): Hit | 0 {
  const u = (f.ci + lu) / f.nc;
  const v = (f.cj + lv) / f.nr;
  switch (f.tex) {
    case "mirror":
      return mirrorTex(f, lu, lv, step, k, c, r);
    case "screen":
      return screenTex(u, v, step);
    case "keys":
      return keysTex(u, v);
    case "appA":
    case "appB":
    case "appC": {
      // Rounded phone corners: outside them the panel is see-through.
      const asp = f.tex === "appA" ? 2 : 2;
      const rr = 0.09;
      if (!inBox(u, v, 0, 0, 1, 1, rr, asp)) return 0;
      return f.tex === "appA" ? appATex(u, v, step) : f.tex === "appB" ? appBTex(u, v) : appCTex(u, v);
    }
  }
}

/** Is (lu, lv) on the outer edge of the whole surface (a bezel), not a seam between panels? */
function onBezel(f: Face, lu: number, lv: number, w: number) {
  return (f.ci === 0 && lu < w) || (f.ci === f.nc - 1 && lu > 1 - w) || (f.cj === 0 && lv < w) || (f.cj === f.nr - 1 && lv > 1 - w);
}

/** Paints the panels, farthest first. */
function drawPanels(b: Uint32Array, step: number, under: Uint32Array) {
  const cam = camAt(step);
  const list = panelsAt(step).map((pn) => {
    // The flip turns the panel about its upright axis.
    const n = cross(pn.u, pn.v);
    const nl = len3(n) || 1;
    const ul = len3(pn.u);
    const uf: V3 = add([pn.u[0] * Math.cos(pn.flip), pn.u[1] * Math.cos(pn.flip), pn.u[2] * Math.cos(pn.flip)], n, (ul / nl) * Math.sin(pn.flip));
    const c0 = project(cam, pn.p);
    const cu = project(cam, add(pn.p, uf, 0.5));
    const cv = project(cam, add(pn.p, pn.v, 0.5));
    return { pn, c0, ax: 2 * (cu[0] - c0[0]), ay: 2 * (cu[1] - c0[1]), bx: 2 * (cv[0] - c0[0]), by: 2 * (cv[1] - c0[1]) };
  });
  list.sort((a, b2) => b2.c0[2] - a.c0[2]);
  for (const { pn, c0, ax, ay, bx, by } of list) {
    const det = ax * by - ay * bx;
    if (Math.abs(det) < 2) continue; // edge-on
    const front = det > 0;
    const face = front ? pn.front : pn.back;
    const hw = (Math.abs(ax) + Math.abs(bx)) / 2 + 1;
    const hh = (Math.abs(ay) + Math.abs(by)) / 2 + 1;
    const c1 = Math.max(0, Math.floor(c0[0] - hw));
    const c2 = Math.min(COLS - 1, Math.ceil(c0[0] + hw));
    const r1 = Math.max(0, Math.floor(c0[1] - hh));
    const r2 = Math.min(ROWS - 1, Math.ceil(c0[1] + hh));
    // Seam width in panel units: about 1.2 tiles.
    const sw = Math.min(0.2, 1.2 / Math.max(4, Math.min(Math.hypot(ax, ay), Math.hypot(bx, by))));
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++) {
        const x = c - c0[0];
        const y = r - c0[1];
        let u = (x * by - y * bx) / det;
        const v = (ax * y - ay * x) / det;
        if (u < -0.5 || u > 0.5 || v < -0.5 || v > 0.5) continue;
        if (!front) u = -u;
        const lu = u + 0.5;
        const lv = v + 0.5;
        const edge = lu < sw || lu > 1 - sw || lv < sw || lv > 1 - sw;
        let hit: Hit | 0;
        if (edge && pn.seam > 0 && hash(c, r, 31) < pn.seam && (face.tex === "mirror" || face.tex === "screen" || face.tex === "keys" || pn.seam > 0.2)) {
          hit = [hash(c, r, 32) < 0.3 ? C_RIM_HI : C_RIM, 2];
        } else if (edge && onBezel(face, lu, lv, sw) && face.tex !== "mirror") {
          hit = [C_RIM, 2];
        } else if (face.tex === "mirror" && pn.land > 0 && hash(c, r, 33) < pn.land) {
          hit = faceTex(laptopFace(pn.k), lu, lv, step, pn.k, c, r);
        } else hit = faceTex(face, lu, lv, step, pn.k, c, r);
        if (!hit) continue;
        put(b, c, r, hit[0], hit[1], SKY_PX);
        under[r * COLS + c] = hit[0];
      }
  }
  return cam;
}

/** Where on the picture the laptop's button is (for the fingertip). */
function buttonAt(): [number, number] {
  const cam = camAt(LAPTOP);
  // The button's middle: u 0.5, v 0.62 on the screen.
  const top = add([0, HINGE[1], HINGE[2]], UP, 1.5);
  const p = add(top, UP, -1.5 * 0.62);
  const [c, r] = project(cam, p);
  return [c, r];
}

// ───────────────────────────── the hand ─────────────────────────────
// Drawn in "hand units" (the palm is one unit wide), fingers up, palm facing the viewer.
type Finger = { bx: number; by: number; ang: number; len: number; w: number };
const FINGERS: Finger[] = [
  { bx: -0.3, by: -0.42, ang: -0.1, len: 0.92, w: 0.23 }, // index
  { bx: -0.09, by: -0.47, ang: -0.02, len: 1.02, w: 0.24 }, // middle
  { bx: 0.12, by: -0.45, ang: 0.06, len: 0.95, w: 0.23 }, // ring
  { bx: 0.32, by: -0.37, ang: 0.15, len: 0.76, w: 0.2 }, // little
];
const THUMB: Finger = { bx: -0.4, by: -0.02, ang: -0.62, len: 0.62, w: 0.26 };
type Pose = { cx: number; cy: number; s: number; rot: number; spread: number; curl: number[]; thumb: number; arm: number; press: number };

function fingerTip(f: Finger, spread: number, curl: number, isThumb: boolean): [number, number, number, number] {
  const ang = isThumb ? f.ang * (1 - 0.6 * curl) : f.ang * (0.6 + 1.6 * spread);
  const l = f.len * (1 - 0.62 * curl);
  return [f.bx, f.by, f.bx + l * Math.sin(ang), f.by - l * Math.cos(ang)];
}
function toScreen(p: Pose, hx: number, hy: number): [number, number] {
  const cr = Math.cos(p.rot);
  const sr = Math.sin(p.rot);
  return [p.cx + p.s * (hx * cr - hy * sr), p.cy + p.s * (hx * sr + hy * cr)];
}

const TAP_ROT = -2.3;
const TAP_S = 78;
const tapPose = (press: number, back: number): Pose => {
  const base: Pose = { cx: 0, cy: 0, s: TAP_S, rot: TAP_ROT, spread: 0.1, curl: [0, 1, 1, 1], thumb: 0.8, arm: 1, press };
  const [, , tx, ty] = fingerTip(FINGERS[0], base.spread, 0, false);
  const [bc, br] = buttonAt();
  const [ox, oy] = toScreen(base, tx, ty);
  // `back` pulls the hand away along its arm.
  const dir: [number, number] = [-Math.sin(TAP_ROT), Math.cos(TAP_ROT)];
  base.cx = bc - ox + dir[0] * back;
  base.cy = br - oy + dir[1] * back;
  return base;
};

function poseAt(step: number): Pose | null {
  if (step < HAND_IN) return null;
  if (step <= SWING) {
    const p = clamp((step - HAND_IN) / (HAND_PEAK - HAND_IN));
    const over = step === HAND_PEAK + 1 ? 1.04 : step === HAND_PEAK + 2 ? 1.01 : 1;
    const s = 3 * Math.pow(205 / 3, Math.pow(p, 1.5)) * over;
    const grab = smooth((step - (HAND_PEAK - 4)) / 4);
    return { cx: CX - 8 * p, cy: mix(CY, 352, Math.pow(p, 1.5)), s, rot: -0.12 * p, spread: 0.25 + 0.75 * p, curl: [0.12 + 0.3 * grab, 0.12 + 0.3 * grab, 0.12 + 0.3 * grab, 0.15 + 0.3 * grab], thumb: 0.1, arm: 0, press: 0 };
  }
  if (step < LAPTOP) {
    const e = smooth((step - SWING) / 30);
    const a = poseAt(SWING)!;
    const b = tapPose(0, 120);
    return {
      cx: mix(a.cx, b.cx, e),
      cy: mix(a.cy, b.cy, e),
      s: mix(a.s, b.s, e),
      rot: mix(a.rot, b.rot, e),
      spread: mix(a.spread, b.spread, e),
      curl: a.curl.map((v, i) => mix(v, b.curl[i], smooth(e * 1.6))),
      thumb: mix(a.thumb, b.thumb, e),
      arm: e,
      press: 0,
    };
  }
  if (step < TAP) {
    // Glide in over the button, a hair past, and settle two steps before the press.
    const x = clamp((step - LAPTOP) / 9);
    const back = 120 * Math.pow(1 - x, 2.2) - 4 * Math.sin(Math.PI * x);
    return tapPose(0, step >= TAP - 2 ? 2 : back);
  }
  if (step < TAP + 2) return tapPose(1, -2);
  const away = step - (TAP + 2);
  if (away > 14) return null;
  return tapPose(0, 4 + 600 * Math.pow(away / 14, 1.8));
}

const capsule = (hx: number, hy: number, x0: number, y0: number, x1: number, y1: number) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const t = clamp(((hx - x0) * dx + (hy - y0) * dy) / (dx * dx + dy * dy || 1));
  return [Math.hypot(hx - x0 - dx * t, hy - y0 - dy * t), t];
};

function drawHand(b: Uint32Array, step: number, under: Uint32Array) {
  const p = poseAt(step);
  if (!p) return;
  const fingers = FINGERS.map((f, i) => fingerTip(f, p.spread, p.curl[i], false));
  const thumb = fingerTip(THUMB, p.spread, p.thumb, true);
  const parts: { seg: number[]; w: number; tip: boolean; taper: number }[] = [
    ...fingers.map((seg, i) => ({ seg, w: FINGERS[i].w * (1 + 0.25 * p.curl[i]) * (i === 0 ? 1 - 0.08 * p.press : 1), tip: true, taper: 0.88 })),
    { seg: thumb, w: THUMB.w, tip: true, taper: 0.85 },
  ];
  // The arm: a short wrist reaching back into the hole, or the whole forearm leaving the picture.
  const armLen = mix(0.5, 6, p.arm);
  parts.push({ seg: [0, 0.4, 0, 0.4 + armLen], w: 0.7, tip: false, taper: mix(0.35, 1.05, p.arm) });
  const reach = p.s * (1.7 + armLen);
  const c1 = Math.max(0, Math.floor(p.cx - reach));
  const c2 = Math.min(COLS - 1, Math.ceil(p.cx + reach));
  const r1 = Math.max(0, Math.floor(p.cy - reach));
  const r2 = Math.min(ROWS - 1, Math.ceil(p.cy + reach));
  const cr = Math.cos(p.rot);
  const sr = Math.sin(p.rot);
  const pulse = kick(step);
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++) {
      const dx = (c - p.cx) / p.s;
      const dy = (r - p.cy) / p.s;
      const hx = dx * cr + dy * sr;
      const hy = -dx * sr + dy * cr;
      // Distance inside the hand's edge, in tiles (above zero: inside).
      let inside = -1;
      let tipGlow = 0;
      const pal = Math.pow(Math.abs(hx) / 0.5, 2.6) + Math.pow(Math.abs(hy) / 0.52, 2.6);
      if (pal <= 1) inside = Math.max(inside, (1 - pal) * 0.22 * p.s);
      for (const part of parts) {
        const [d, t] = capsule(hx, hy, part.seg[0], part.seg[1], part.seg[2], part.seg[3]);
        const rad = (part.w / 2) * mix(1, part.taper, t);
        const e = (rad - d) * p.s;
        if (e > inside) inside = e;
        if (part.tip && e > 0 && t > 0.8) tipGlow = Math.max(tipGlow, (t - 0.8) * 5);
      }
      if (inside <= 0) continue;
      const i = r * COLS + c;
      let col: number;
      let size = 2;
      if (inside < Math.max(1.2, p.s * 0.012)) col = HAND_RIM[Math.floor(hash(c, r, 41) * 3)];
      else {
        // Lit from the upper left, rounder toward the middle, with the illusion's lines running through it.
        const vol = clamp(inside / (0.09 * p.s));
        const s = 0.18 + 0.3 * vol + 0.18 * clamp(-hx * 0.6 - hy * 0.4 + 0.3) + 0.35 * field[i] + 0.25 * tipGlow;
        col = HAND[Math.min(4, Math.max(0, Math.floor(s * 5)))];
        size = field[i] > 0.55 - 0.15 * pulse ? 3 : field[i] < 0.05 && hash(c, r, 42) < 0.15 ? 1 : 2;
      }
      put(b, c, r, col, size, SKY_PX);
      under[i] = col;
    }
}

// ───────────────────────────── the words ─────────────────────────────

type Line = [string, number, readonly string[]];
const LINES: Line[] = [
  ["KINGDOM SITES", 4, T_WHITE],
  ["GET YOUR", 6, T_WHITE],
  ["CUSTOM APP", 6, T_LIME],
  ["TODAY.", 7, T_WHITE],
];
type WTile = { c: number; r: number; tone: number; j: number };
const WORDS: WTile[] = (() => {
  const heights = LINES.map(([, s]) => 7 * s);
  const gaps = LINES.slice(1).map(([, s], j) => Math.round(1.6 * (s + LINES[j][1])) + (j === 0 ? 10 : 0));
  let top = Math.round(CY - (heights.reduce((a, h) => a + h, 0) + gaps.reduce((a, g) => a + g, 0)) / 2);
  const out: WTile[] = [];
  LINES.forEach(([str, scale, tones], j) => {
    const w = wordUnits(str) * scale;
    if (w > COLS - 4) throw new Error(`"${str}" is ${w} tiles wide; the wall is ${COLS}`);
    for (const { c, r } of wordCells(str, Math.round(CX - w / 2), top, scale)) out.push({ c, r, tone: px(pick(tones, hash(c, r, 300 + j))), j: hash(c, r, 307) });
    top += heights[j] + (gaps[j] ?? 0);
  });
  return out;
})();

// ───────────────────────────── the burst ─────────────────────────────

let frozen: Uint32Array | null = null; // the picture on the step before the burst, one colour per tile
let sources: Int32Array | null = null; // for each word tile, the bursting tile it is made from
function freeze() {
  if (frozen) return;
  const b = new Uint32Array(W * H);
  const under = new Uint32Array(N);
  paintScene(b, EXPLODE - 1, under);
  frozen = new Uint32Array(N);
  for (let i = 0; i < N; i++) frozen[i] = b[((i / COLS) | 0) * CELL * W + (i % COLS) * CELL];
  const lit: number[] = [];
  for (let i = 0; i < N; i++) if (lum(frozen[i]) > 0.09 && Math.abs((i % COLS) - CX) < 120) lit.push(i);
  sources = Int32Array.from(WORDS, (t) => lit[Math.floor(hash(t.c, t.r, 311) * lit.length)]);
}
const BURST_C = CX;
const BURST_R = CY - 20;
const BURST_STEPS = 10;
function burst(i: number, since: number): [number, number, number] | null {
  const c0 = i % COLS;
  const r0 = (i / COLS) | 0;
  const dc = c0 - BURST_C;
  const dr = r0 - BURST_R;
  const l = since - (Math.hypot(dc, dr) > 250 ? 1 : 0);
  if (l < 0) return [c0, r0, 2];
  const life = 4 + Math.floor(hash(c0, r0, 95) * 5);
  if (l >= life) return null;
  const angle = Math.atan2(dr, dc || 0.01) + (hash(c0, r0, 96) - 0.5) * 0.6 + 0.25 * (l + 1);
  const gone = (70 * (0.5 + hash(c0, r0, 97)) * (1 - Math.pow(0.72, l + 1))) / 0.28;
  const c = Math.round(c0 + Math.cos(angle) * gone);
  const r = Math.round(r0 + Math.sin(angle) * gone);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return [c, r, l === 0 ? 3 : l / life > 0.5 ? 1 : 2];
}

// ───────────────────────────── drawing ─────────────────────────────

let img: ImageData | null = null;
let buf: Uint32Array;
let base: Uint32Array | null = null;
function wallPicture(): Uint32Array {
  if (base) return base;
  base = new Uint32Array(W * H);
  for (let i = 0; i < N; i++) put(base, i % COLS, (i / COLS) | 0, WALL_PX[i], 2, isPale[i] ? PALE_PX : SKY_PX);
  return base;
}

/** The illusion laid over whatever is in `b`, at a strength. */
function paintIllusion(b: Uint32Array, step: number, strength: number, onlyDark: boolean, under: Uint32Array) {
  const pulse = kick(step);
  for (let i = 0; i < N; i++) {
    if (onlyDark && !isDark[i]) continue;
    const s = field[i] * strength;
    if (s <= 0.04) continue;
    const col = RAMPS[fieldRamp[i]][Math.min(4, Math.floor(s * 5))];
    const size = s > 0.5 - 0.18 * pulse ? 2 : 1;
    put(b, i % COLS, (i / COLS) | 0, col, size, SKY_PX);
    under[i] = col;
  }
}

/** Everything up to the burst. */
function paintScene(b: Uint32Array, step: number, under: Uint32Array) {
  b.set(wallPicture());
  under.set(WALL_PX);
  rings(step);
  if (step < SWING) paintIllusion(b, step, 1, true, under);
  drawPanels(b, step, under);
  drawHand(b, step, under);
}

const underNow = new Uint32Array(N);
/** Paints the pose for one step. */
export function drawStep(ctx: CanvasRenderingContext2D, step: number) {
  if (!img) {
    img = ctx.createImageData(W, H);
    buf = new Uint32Array(img.data.buffer);
  }
  if (step < EXPLODE) paintScene(buf, step, underNow);
  else {
    freeze();
    buf.fill(INK_PX);
    underNow.fill(INK_PX);
    // The tunnel comes back, dim, behind the words.
    if (step >= EXPLODE + 8) {
      rings(step);
      const fadeOut = step >= FADE ? 1 - (step - FADE + 1) / (STEPS - FADE) : 1;
      paintIllusion(buf, step, 0.55 * clamp((step - EXPLODE - 8) / 14) * fadeOut, false, underNow);
    }
    const since = step - EXPLODE;
    if (since <= BURST_STEPS) {
      const all = frozen!;
      for (let i = 0; i < N; i++) {
        const d = burst(i, since);
        if (d) put(buf, d[0], d[1], all[i], d[2], INK_PX);
      }
    }
    drawWords(buf, step);
  }
  ctx.putImageData(img, 0, 0);
}

function drawWords(b: Uint32Array, step: number) {
  const src = sources!;
  const all = frozen!;
  for (let n = 0; n < WORDS.length; n++) {
    const t = WORDS[n];
    if (step < LAND) {
      // Out with the burst, then curving back in, faster as they come, onto the beat.
      const s0 = src[n];
      const sc = s0 % COLS;
      const sr = (s0 / COLS) | 0;
      const x = (step - EXPLODE) / (LAND - EXPLODE);
      // Out with the burst for half a second, then swirling in around the middle: the letters are
      // a wide, turned spiral at first and tighten into place, faster as they come, onto the beat.
      const ang = Math.atan2(sr - BURST_R, sc - BURST_C || 0.01) + (t.j - 0.5) * 0.8;
      const far = 50 + 90 * hash(t.c, t.r, 312);
      const out = 1 - Math.pow(1 - clamp((step - EXPLODE) / 6), 2);
      const bc = sc + Math.cos(ang) * far * out;
      const br = sr + Math.sin(ang) * far * out;
      const x2 = clamp((step - EXPLODE - 4) / (LAND - EXPLODE - 4));
      const k = clamp(1 - Math.pow(x2, 1.5) + (t.j - 0.5) * 0.12 * (1 - x2));
      const dx = t.c - CX;
      const dy = t.r - CY;
      const d = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx) + k * k * 3.4 * (200 / (d + 100));
      const sp = d * (1 + 1.3 * k);
      const w = smooth(x2 / 0.4);
      let c = mix(bc, CX + sp * Math.cos(th), w);
      let r = mix(br, CY + sp * Math.sin(th), w);
      c = Math.min(COLS - 1, Math.max(0, Math.round(c)));
      r = Math.min(ROWS - 1, Math.max(0, Math.round(r)));
      put(b, c, r, mixPx(all[s0], t.tone, 0.88 * smooth((x - 0.1) / 0.6)), x < 0.08 ? 3 : 2, INK_PX);
    } else {
      // Standing: a sway with the beat, a bounce on each beat, and a band of larger tiles.
      const l = step - LAND;
      const fade = step >= FADE ? (step - FADE + 1) / (STEPS - FADE) : 0;
      const c = t.c + Math.round(1.3 * Math.sin(t.r / 33 + (2 * Math.PI * step) / 12));
      const r = t.r + Math.round(1.7 * Math.sin(t.c / 40 + (2 * Math.PI * step) / 24) - 2.4 * kick(step));
      const sweep = step % 12;
      const band = sweep < 6 && Math.abs(t.c * 2 + t.r - (200 + sweep * 150)) < 7;
      if (fade > 0 && hash(t.c, t.r, 313) < fade * 0.9) continue;
      put(b, c, r, fade > 0 ? mixPx(t.tone, INK_PX, fade * 0.6) : t.tone, l === 0 || (band && fade === 0) ? 3 : fade > 0.4 ? 1 : 2, INK_PX);
    }
  }
}

// ───────────────────────────── checks ─────────────────────────────

const TEXT = LINES.map((x) => x[0]).join(" ");
export const HOLD_SECONDS = (FADE - LAND) / SPS;
{
  const least = 0.45 * TEXT.split(/\s+/).length + 1;
  if (HOLD_SECONDS + 0.05 < least) throw new Error(`"${TEXT}" stands for ${HOLD_SECONDS.toFixed(2)} s, under its ${least.toFixed(2)} s reading time`);
}

/** When each moment that should sit on the music happens, in seconds of the film. */
export function moments() {
  const sec = (step: number) => Math.ceil((step * T.fps) / SPS) / T.fps;
  return [
    ["hand nearest (reaching out)", HAND_PEAK],
    ["laptop assembled", LAPTOP],
    ["tap", TAP],
    ["app floating", FLOAT],
    ["burst", EXPLODE],
    ["words land", LAND],
    ["words begin to dim", FADE],
  ].map(([what, step]) => ({ what: what as string, step: step as number, seconds: sec(step as number) }));
}
