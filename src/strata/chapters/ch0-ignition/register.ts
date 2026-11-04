/**
 * Keeps the DOM headline glued to the 3D one while they crossfade: the plane of the bead tops (y = 3.6) seen by
 * the chapter camera is a homography, which CSS expresses as a matrix3d on the SVG. No three.js here (the
 * Overlay is first-paint code), so the camera maths is done by hand from the same keys the Scene uses.
 */
import { createCameraPath, type CameraKeyframe } from '@/strata/story';
import { cameraKeys, K0_SCREEN_Y, LIFT_OFF } from './stage';
import { BEAD_TOP, desktop } from './strokes';

const path = createCameraPath(cameraKeys(desktop) as CameraKeyframe[]);
const pose = new Float32Array(7);
const k0 = new Float32Array(7);
path.sample(0, k0);

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Vertical view offset (fraction of the frame): the target sits on the DOM headline's line (K0_SCREEN_Y) while the
 * copy panel is up, so the 3D headline never slides behind it, and settles to centre as the panel leaves.
 */
export function liftAt(p: number) {
  return (0.5 - K0_SCREEN_Y) * (1 - smooth(LIFT_OFF[0], LIFT_OFF[1], p));
}


const col = new Float64Array(16);

/**
 * CSS matrix3d (column-major) that maps the SVG's local px onto the screen, relative to its layout anchor
 * (left: 50 %, top: K0_SCREEN_Y, transform-origin 0 0). `w` is the SVG's rendered width in px. `mix` blends
 * the camera from K0 (0) to the live pose at p (1).
 */
export function svgMatrix(p: number, W: number, H: number, w: number, mix: number): string {
  path.sample(p, pose);
  for (let i = 0; i < 7; i++) pose[i] = k0[i] + (pose[i] - k0[i]) * mix;
  const lift = liftAt(p);
  const [vx, vy, vw] = desktop.viewBox;
  const k = vw / w;

  const ex = pose[0];
  const ey = pose[1];
  const ez = pose[2];
  let fx = pose[3] - ex;
  let fy = pose[4] - ey;
  let fz = pose[5] - ez;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl;
  fy /= fl;
  fz /= fl;
  // right = forward x up(0, 1, 0); up' = right x forward.
  let rx = -fz;
  let rz = fx;
  const rl = Math.hypot(rx, rz);
  rx /= rl;
  rz /= rl;
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;

  const t = Math.tan((pose[6] * Math.PI) / 360);
  const aspect = W / H;
  const yOff = K0_SCREEN_Y - 0.5 + lift;
  // Offset (dx, dy, dz) from the eye (or a direction, for the derivative columns) -> homogeneous screen px.
  const put = (dx: number, dy: number, dz: number, at: number) => {
    const cx = rx * dx + rz * dz;
    const cy = ux * dx + uy * dy + uz * dz;
    const d = fx * dx + fy * dy + fz * dz;
    col[at] = (0.5 * W * cx) / (t * aspect);
    col[at + 1] = -(0.5 * H * cy) / t - yOff * H * d;
    col[at + 2] = 0;
    col[at + 3] = d;
  };
  put(k, 0, 0, 0);
  put(0, 0, k, 4);
  col[8] = 0;
  col[9] = 0;
  col[10] = 1;
  col[11] = 0;
  put(vx - ex, BEAD_TOP - ey, vy - ez, 12);
  let s = 'matrix3d(';
  for (let i = 0; i < 16; i++) s += (i ? ',' : '') + col[i].toPrecision(9);
  return s + ')';
}
