import type { Box3, Camera, Matrix4 } from 'three';
import type { Vec3Like } from './framing';

/**
 * Screen-space signals for the HUD kit (STORYBOARD 3.7). The Scene writes them inside useChapterFrame
 * after its camera update; the Overlay's Leader / BBoxBrackets read them on the ticker. No React state,
 * no allocation, no runtime three.js import (safe in the '@/strata/story' barrel).
 *
 *   signals.anchors[key] = Float32Array(3) [x CSS px, y CSS px, visible 0 | 1]
 *   signals.bbox         = Float32Array(4) [minX, minY, maxX, maxY] CSS px; NaN in slot 0 when hidden
 */
export type Anchors = Record<string, Float32Array>;
export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * One hidden anchor slot per key, in the chapter's signals.ts: `anchors: createAnchors('collar', 'tip')`
 * (an array, `createAnchors(['collar'])`, works too). Also exported from '@/strata/hud'.
 */
export function createAnchors<K extends string>(...keys: (K | readonly K[])[]): Record<K, Float32Array> {
  const out = {} as Record<K, Float32Array>;
  for (const k of keys.flat() as K[]) out[k] = new Float32Array(3);
  return out;
}

/** A hidden bbox slot: `bbox: createBBox()`. */
export function createBBox(): Float32Array {
  const b = new Float32Array(4);
  b[0] = Number.NaN;
  return b;
}

const P = new Float64Array(16);

/** camera.projectionMatrix x camera.matrixWorldInverse into P (camera matrices refreshed first). */
function viewProjection(camera: Camera) {
  camera.updateMatrixWorld();
  const a = camera.projectionMatrix.elements;
  const b = camera.matrixWorldInverse.elements;
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      P[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
}

const comp = (v: Vec3Like, i: 0 | 1 | 2) =>
  'x' in v ? (i === 0 ? v.x : i === 1 ? v.y : v.z) : (v as ArrayLike<number>)[i];

/** Projects with the current P. Returns false behind the camera. */
function project(x: number, y: number, z: number, size: ScreenSize, out: Float32Array, o: number) {
  const cx = P[0] * x + P[4] * y + P[8] * z + P[12];
  const cy = P[1] * x + P[5] * y + P[9] * z + P[13];
  const cw = P[3] * x + P[7] * y + P[11] * z + P[15];
  if (cw <= 1e-6) return false;
  out[o] = ((cx / cw) * 0.5 + 0.5) * size.width;
  out[o + 1] = (0.5 - (cy / cw) * 0.5) * size.height;
  return true;
}

/**
 * Writes `signals.anchors[key]` for a world point. `size` is the canvas size in CSS px (R3F `state.size`).
 * visible = 1 when in front of the camera and inside the viewport.
 */
export function writeAnchor(
  signals: { anchors: Anchors },
  key: string,
  worldPos: Vec3Like,
  camera: Camera,
  size: ScreenSize,
) {
  const a = signals.anchors[key];
  if (!a) return;
  viewProjection(camera);
  const ok = project(comp(worldPos, 0), comp(worldPos, 1), comp(worldPos, 2), size, a, 0);
  a[2] = ok && a[0] >= 0 && a[0] <= size.width && a[1] >= 0 && a[1] <= size.height ? 1 : 0;
}

export function hideAnchor(signals: { anchors: Anchors }, key: string) {
  const a = signals.anchors[key];
  if (a) a[2] = 0;
}

const corner = new Float32Array(2);

/**
 * Writes `signals.bbox`: the projected screen rectangle of `box3` (local space) under `matrixWorld`
 * (for example the part mesh's matrixWorld). Hidden (NaN) when any corner is behind the camera.
 */
export function writeBBox(
  signals: { bbox: Float32Array },
  box3: Box3,
  matrixWorld: Matrix4,
  camera: Camera,
  size: ScreenSize,
) {
  const out = signals.bbox;
  if (box3.isEmpty()) {
    out[0] = Number.NaN;
    return;
  }
  viewProjection(camera);
  const m = matrixWorld.elements;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < 8; i++) {
    const lx = i & 1 ? box3.max.x : box3.min.x;
    const ly = i & 2 ? box3.max.y : box3.min.y;
    const lz = i & 4 ? box3.max.z : box3.min.z;
    const x = m[0] * lx + m[4] * ly + m[8] * lz + m[12];
    const y = m[1] * lx + m[5] * ly + m[9] * lz + m[13];
    const z = m[2] * lx + m[6] * ly + m[10] * lz + m[14];
    if (!project(x, y, z, size, corner, 0)) {
      out[0] = Number.NaN;
      return;
    }
    if (corner[0] < minX) minX = corner[0];
    if (corner[1] < minY) minY = corner[1];
    if (corner[0] > maxX) maxX = corner[0];
    if (corner[1] > maxY) maxY = corner[1];
  }
  out[0] = minX;
  out[1] = minY;
  out[2] = maxX;
  out[3] = maxY;
}

export function hideBBox(signals: { bbox: Float32Array }) {
  signals.bbox[0] = Number.NaN;
}
