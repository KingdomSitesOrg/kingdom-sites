// The one pointer's motion, from timeline.json's cursor keys. Pure (no JSON
// import, no React), so the film and verify/ (Node strips the types) compute
// exactly the same thing.
//
// Craft (film-studio craft.md, SCRIPT.md "Cursor"):
// - Between two keys at different spots it travels a short arc (a quadratic
//   curve bowed upward, the hand lifting) on a monotone cubic ease, starting
//   from rest. Arriving, it runs about 1% past its target along the direction
//   of travel and settles back exactly on it at the key frame; the build puts
//   that key two frames before the press, so it is still when it presses.
// - Leaving, it accelerates away to the off-screen key with no overshoot.
// - Pressed: scale about the tip, 1 → 0.9 fully down on the press frame (from
//   two frames before), springing back past 1 by a hair and still by +6.
// - Shown only between a scene's first and last key and only while any part of
//   it is on the frame; it enters and leaves from off-screen.

import { clamp01, monotone, type Key } from "./ease.ts";

export type CursorKey = { frame: number; x: number; y: number; press: boolean; show: boolean; scene: string; note?: string };
export type Sprite = { tipX: number; tipY: number; width: number; height: number };
export type CursorState = { x: number; y: number; scale: number; pressed: number; visible: boolean; scene: string | null };

export const PRESS_SCALE = 0.9;
const ARRIVE_MAX = 22; // frames for an entry or a move between targets, at most
const LEAVE_MAX = 14;
const BOW = 0.14; // the arc's bow, as a share of the distance
const OVERSHOOT = 0.012; // about 1% past the target

// the arrival's progress: rest at 0, a hair past 1 at 78%, settled at 1
const ARRIVE: Key[] = [
  [0, 0],
  [0.78, 1 + OVERSHOOT],
  [1, 1],
];
// the leave: from rest, accelerating out (monotone, no overshoot)
const LEAVE: Key[] = [
  [0, 0],
  [1, 1],
];

type Pt = { x: number; y: number };

/** The control point that bows the move upward on screen (smaller y), the hand lifting. */
function bowControl(a: Pt, b: Pt): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  let px = -dy / d;
  let py = dx / d;
  if (py > 0 || (py === 0 && px < 0)) {
    px = -px;
    py = -py;
  }
  return { x: (a.x + b.x) / 2 + px * BOW * d, y: (a.y + b.y) / 2 + py * BOW * d };
}

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

/** Groups the keys into runs, one per scene's visit (enter … leave). */
export function cursorRuns(keys: readonly CursorKey[]): CursorKey[][] {
  const runs: CursorKey[][] = [];
  for (const k of keys) {
    const last = runs[runs.length - 1];
    if (!last || last[last.length - 1].show === false || last[0].scene !== k.scene) runs.push([k]);
    else last.push(k);
  }
  return runs;
}

/** Where the tip is at frame f (frame pixels), and nothing about pressing. */
export function tipAt(keys: readonly CursorKey[], f: number): { x: number; y: number; scene: string | null; inRun: boolean } {
  for (const run of cursorRuns(keys)) {
    const first = run[0];
    const last = run[run.length - 1];
    if (f < first.frame || f > last.frame) continue;
    for (let k = 0; k < run.length - 1; k++) {
      const a = run[k];
      const b = run[k + 1];
      if (f < a.frame || f > b.frame) continue;
      if (a.x === b.x && a.y === b.y) return { x: a.x, y: a.y, scene: a.scene, inRun: true };
      const gap = b.frame - a.frame;
      const leaving = b.show === false;
      const dur = Math.min(gap, leaving ? LEAVE_MAX : ARRIVE_MAX);
      // arrivals end on the key (they start late and hold off-screen or at rest before);
      // leaves start on the key (they go as soon as the rest is over)
      const t0 = leaving ? a.frame : b.frame - dur;
      const u = clamp01((f - t0) / dur);
      const s = monotone(leaving ? LEAVE : ARRIVE, u);
      const c = bowControl(a, b);
      if (s <= 1) {
        const p = quad(a, c, b, s);
        return { x: p.x, y: p.y, scene: a.scene, inRun: true };
      }
      // past the target along the arrival's direction (the curve's end tangent)
      const tx = b.x - c.x;
      const ty = b.y - c.y;
      const tl = Math.hypot(tx, ty) || 1;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      return { x: b.x + (tx / tl) * (s - 1) * dist, y: b.y + (ty / tl) * (s - 1) * dist, scene: a.scene, inRun: true };
    }
    return { x: last.x, y: last.y, scene: last.scene, inRun: true };
  }
  return { x: NaN, y: NaN, scene: null, inRun: false };
}

/** How far down a press is at f: 0 at rest, 1 fully down on the press frame, a hair negative springing back, 0 by +6. */
export function pressedAt(keys: readonly CursorKey[], f: number): number {
  let v = 0;
  for (const k of keys) {
    if (!k.press || f < k.frame - 2 || f > k.frame + 6) continue;
    const P = k.frame;
    const track: Key[] = [
      [P - 2, 0],
      [P, 1],
      [P + 4, -0.12],
      [P + 6, 0],
    ];
    const p = monotone(track, f);
    if (Math.abs(p) > Math.abs(v)) v = p;
  }
  return v;
}

/** The whole state the sprite is drawn from. */
export function cursorAt(keys: readonly CursorKey[], sprite: Sprite, width: number, height: number, f: number): CursorState {
  const tip = tipAt(keys, f);
  const pressed = pressedAt(keys, f);
  const scale = 1 - (1 - PRESS_SCALE) * pressed;
  if (!tip.inRun) return { x: NaN, y: NaN, scale, pressed, visible: false, scene: null };
  // the sprite's box around the tip: any part on the frame means it shows
  const left = tip.x - sprite.tipX * scale;
  const top = tip.y - sprite.tipY * scale;
  const onFrame = left < width && top < height && left + sprite.width * scale > 0 && top + sprite.height * scale > 0;
  return { x: tip.x, y: tip.y, scale, pressed, visible: onFrame, scene: tip.scene };
}
