import type { PerspectiveCamera } from 'three';
import { handoffPose, poseCamera, type CameraPose } from '@/strata/story';
import { expoInOut, sineInOut } from './timeline';

type V3 = readonly [number, number, number];
type Key = {
  t: number;
  pos: V3;
  target: V3;
  fov: number;
  fx: number;
  /** Zero tangent here: the path does not bend toward the next group (cells and trucks). */
  stop?: boolean;
  /** Easing for the segment that starts at this key. */
  ease?: 'expo';
};

const O1 = -4800;
const O2 = -2400;
const add = (o: number, x: number, y: number, z: number): V3 => [o + x, y, z];

const A7 = handoffPose('6-7', 0);

// STORYBOARD Ch6 camera (desktop), cell keys local to their origin. Each segment eases sine.inOut.
const KEYS: Key[] = [
  { t: -0.25, pos: add(O1, -10, 16, 262), target: add(O1, 0, 20, 0), fov: 27, fx: 0.6, stop: true },
  { t: 0.0, pos: add(O1, 0, 54, 250), target: add(O1, 0, 24, 0), fov: 26, fx: 0.6 },
  { t: 0.14, pos: add(O1, 100, 60, 190), target: add(O1, 0, 18, 0), fov: 24, fx: 0.6 },
  { t: 0.205, pos: add(O1, 86, 66, 215), target: add(O1, 0, 24, 0), fov: 24, fx: 0.6 },
  { t: 0.26, pos: add(O1, 56, 100, 262), target: add(O1, 0, 78, 0), fov: 24, fx: 0.6, stop: true },
  { t: 0.31, pos: [-3600, 600, 900], target: [-3600, 0, 0], fov: 30, fx: 0.6 },
  { t: 0.36, pos: add(O2, 10, 420, 380), target: add(O2, 20, 0, -10), fov: 32, fx: 0.6, stop: true },
  { t: 0.48, pos: add(O2, -130, 120, 200), target: add(O2, 30, 0, -10), fov: 26, fx: 0.6 },
  { t: 0.58, pos: add(O2, 120, 180, 320), target: add(O2, 0, 30, 0), fov: 28, fx: 0.64 },
  { t: 0.6, pos: add(O2, 112, 186, 330), target: add(O2, 0, 32, 0), fov: 28, fx: 0.64, stop: true },
  { t: 0.63, pos: [-1200, 500, 700], target: [-1200, 0, 0], fov: 30, fx: 0.6 },
  { t: 0.68, pos: [12, 18, 70], target: [-28, 2, 0], fov: 20, fx: 0.6, stop: true },
  { t: 0.78, pos: [120, 70, 180], target: [0, 20, 0], fov: 24, fx: 0.62 },
  { t: 0.88, pos: [112, 74, 204], target: [0, 20, 0], fov: 24, fx: 0.66 },
  { t: 0.9, pos: [110, 74, 210], target: [0, 21, 0], fov: 24, fx: 0.67, stop: true, ease: 'expo' },
  { t: 1.0, pos: A7.pos, target: A7.target, fov: A7.fov, fx: A7.fx, stop: true },
];

const N = KEYS.length;
const P = KEYS.map((k) => [...k.pos, ...k.target]);
const M = KEYS.map((k, i) => {
  const out = [0, 0, 0, 0, 0, 0];
  if (k.stop || i === 0 || i === N - 1) return out;
  for (let c = 0; c < 6; c++) out[c] = (P[i + 1][c] - P[i - 1][c]) * 0.5;
  return out;
});

/**
 * Pure camera pose for raw progress. During the exit handoff (raw > 1) the pose is the shared H7 camera at
 * the exit fraction, so Ch6 and Ch7 render one camera across the crossfade.
 */
export function sampleCamera(raw: number, exit: number, out: CameraPose, portrait = false) {
  if (raw >= 1) return handoffPose('6-7', exit, portrait, undefined, out);
  out.up[0] = 0;
  out.up[1] = 1;
  out.up[2] = 0;
  if (raw <= KEYS[0].t) {
    const k = KEYS[0];
    for (let c = 0; c < 3; c++) {
      out.pos[c] = k.pos[c];
      out.target[c] = k.target[c];
    }
    out.fov = k.fov;
    out.fx = k.fx;
    return out;
  }
  let i = 0;
  while (i < N - 2 && raw >= KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = (raw - a.t) / (b.t - a.t);
  const e = a.ease === 'expo' ? expoInOut(u) : sineInOut(u);
  const e2 = e * e;
  const e3 = e2 * e;
  const h00 = 2 * e3 - 3 * e2 + 1;
  const h10 = e3 - 2 * e2 + e;
  const h01 = -2 * e3 + 3 * e2;
  const h11 = e3 - e2;
  const pa = P[i];
  const pb = P[i + 1];
  const ma = M[i];
  const mb = M[i + 1];
  for (let c = 0; c < 6; c++) {
    const v = h00 * pa[c] + h10 * ma[c] + h01 * pb[c] + h11 * mb[c];
    if (c < 3) out.pos[c] = v;
    else out.target[c - 3] = v;
  }
  out.fov = a.fov + (b.fov - a.fov) * e;
  out.fx = a.fx + (b.fx - a.fx) * e;
  return out;
}

/** Writes the pose through the story's framing (near/far, screen-x offset, portrait rule); returns the distance. */
export function applyCamera(camera: PerspectiveCamera, pose: CameraPose, portrait: boolean) {
  poseCamera(camera, pose, { portrait });
  const p = camera.position;
  return Math.hypot(p.x - pose.target[0], p.y - pose.target[1], p.z - pose.target[2]);
}
