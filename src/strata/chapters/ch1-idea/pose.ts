import { handoffPose, type CameraPose } from '@/strata/story';

type V3 = [number, number, number];

/** The molten dot's start, where Ch0's period hands over (STORYBOARD Ch1). */
export const D: V3 = [0, 20, 200];
/** Centre of the part envelope: the cloud's centre. */
export const CLOUD_CENTER: V3 = [0, 21, 0];

// Hermite keys over [px, py, pz, tx, ty, tz, fov] with explicit velocities (per raw unit), so the path can
// carry H1's push-in, settle into a near-hold while the prompt types, flow into the orbit and arrive at A2
// already drifting at H2's own speed.
type Key = { t: number; v: number[]; vel: number[] };

const H01_A = handoffPose('0-1', 0, false, D);
const H01_B = handoffPose('0-1', 1, false, D);
const H12_A = handoffPose('1-2', 0);
const H12_B = handoffPose('1-2', 1);
const key = (t: number, pos: readonly number[], target: readonly number[], fov: number): Key => ({
  t,
  v: [pos[0], pos[1], pos[2], target[0], target[1], target[2], fov],
  vel: [0, 0, 0, 0, 0, 0, 0],
});

/** Raw units of one handoff on desktop (length 3: h = 1 / 2). */
const HANDOFF_RAW = 0.5;
/** fx eases 0.50 -> 0.60 over p 0..0.12 (STORYBOARD Ch1). */
const FX_IN = 0.12;

const K0 = key(0, H01_B.pos, H01_B.target, H01_B.fov);
const K1 = key(0.12, [0, 46, 330], [0, -10, 0], 30);
const K2 = key(0.6, [-40, 70, 360], [0, -6, 0], 30);
const K4 = key(1, H12_A.pos, H12_A.target, H12_A.fov);
const DRIFT = K4.v.map((_, i) => (i < 3 ? (H12_B.pos[i] - H12_A.pos[i]) / HANDOFF_RAW : 0));
const K3 = key(0.88, H12_A.pos, H12_A.target, H12_A.fov);
K3.v = K4.v.map((x, i) => x - DRIFT[i] * (K4.t - K3.t));
K3.vel = DRIFT;
K4.vel = DRIFT;
for (let i = 0; i < 3; i++) K0.vel[i] = (H01_B.pos[i] - H01_A.pos[i]) / HANDOFF_RAW;
K2.vel = K2.v.map((_, i) => (i < 6 ? (K3.v[i] - K1.v[i]) / (K3.t - K1.t) : 0));

const KEYS: Key[] = [K0, K1, K2, K3, K4];
const scratch = new Array<number>(7).fill(0);

function samplePath(raw: number, out: number[]) {
  const t = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  let k = 0;
  while (k < KEYS.length - 2 && t >= KEYS[k + 1].t) k++;
  const a = KEYS[k];
  const b = KEYS[k + 1];
  const h = b.t - a.t;
  const u = (t - a.t) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  for (let c = 0; c < 7; c++) out[c] = h00 * a.v[c] + h10 * h * a.vel[c] + h01 * b.v[c] + h11 * h * b.vel[c];
}

const smooth = (x: number) => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/**
 * Ch1's camera: H1 around D while entering, the keyed path while pinned, H2 while leaving. Feed the
 * result to poseCamera(camera, pose, { portrait }).
 */
export function poseAt(raw: number, enter: number, exit: number, portrait: boolean, out: CameraPose): CameraPose {
  if (enter < 1 && raw < 0) return handoffPose('0-1', enter, portrait, D, out);
  if (exit > 0 && raw > 1) return handoffPose('1-2', exit, portrait, undefined, out);
  samplePath(raw, scratch);
  for (let i = 0; i < 3; i++) {
    out.pos[i] = scratch[i];
    out.target[i] = scratch[3 + i];
  }
  out.up[0] = 0;
  out.up[1] = 1;
  out.up[2] = 0;
  out.fov = scratch[6];
  out.fx = H01_B.fx + (H12_A.fx - H01_B.fx) * smooth(raw / FX_IN);
  out.fy = H12_A.fy;
  return out;
}
