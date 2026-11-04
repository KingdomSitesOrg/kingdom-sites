import type { PerspectiveCamera } from 'three';

/**
 * Screen framing (STORYBOARD 2.3, 6). Chapter keys are written for desktop. On desktop the target is
 * shifted to screen-x `fx` with setViewOffset (the camera still looks straight at it, so no parallax
 * change). Portrait keeps the key's direction, pushes the camera back x1.45, widens the lens by 6 deg
 * and puts the target at 58 % height, centred. Every call also sets near/far from the distance.
 * No runtime imports: safe for DOM code and node tests.
 */
export const FRAMING = {
  fx: 0.6,
  portraitFy: 0.58,
  portraitDistance: 1.45,
  portraitFovAdd: 6,
  /** Width (CSS px) where the copy column starts: the CSS `md` breakpoint. Below it the layout is stacked. */
  columnMinWidth: 768,
  /** Column layout narrower than this (the 1440 x 900 desktop) widens the lens to keep the desktop horizontal view. */
  minColumnAspect: 1.6,
} as const;

export type Layout = 'stacked' | 'column';

/** The single layout rule: stacked (portrait framing) below 768 px wide, column from 768 px. */
export function layoutFor(width: number): Layout {
  return width < FRAMING.columnMinWidth ? 'stacked' : 'column';
}

export type Vec3Like = ArrayLike<number> | { x: number; y: number; z: number };
type MutableVec3 = [number, number, number];

/** A full camera state. Arrays are reused by the writers; copy them if you keep them. */
export interface CameraPose {
  pos: MutableVec3;
  target: MutableVec3;
  fov: number;
  up: MutableVec3;
  /** Desktop screen-x of the target, 0..1. */
  fx: number;
  /** Portrait screen-y of the target from the top, 0..1. */
  fy: number;
}

export function createPose(): CameraPose {
  return { pos: [0, 0, 1], target: [0, 0, 0], fov: 30, up: [0, 1, 0], fx: FRAMING.fx, fy: FRAMING.portraitFy };
}

export interface FramingOptions {
  /** The point the camera looks at (world units). Required: framing is relative to it. */
  target: Vec3Like;
  /** Desktop screen-x of the target, default 0.60. Ignored in portrait (centred). */
  fx?: number;
  portrait?: boolean;
  /** Portrait screen-y of the target from the top, default 0.58. */
  fy?: number;
  /** Portrait only: apply the x1.45 distance and +6 deg rule (default true). False for a chapter's own portrait key. */
  portraitRule?: boolean;
}

const vx = (v: Vec3Like, i: 0 | 1 | 2) =>
  'x' in v ? (i === 0 ? v.x : i === 1 ? v.y : v.z) : (v as ArrayLike<number>)[i];

/** near = clamp(d x 0.02, 0.5, 200), far = d x 80 (STORYBOARD 6), d = distance camera to target. */
export function nearFarFor(d: number): { near: number; far: number } {
  const near = Math.min(200, Math.max(0.5, d * 0.02));
  return { near, far: Math.max(d * 80, near * 4) };
}

/**
 * Frames a camera whose position, fov and up already hold the desktop key. Call it once per frame,
 * after the key is written (the portrait rule scales the current position and fov).
 */
export function applyFraming(camera: PerspectiveCamera, opts: FramingOptions) {
  const tx = vx(opts.target, 0);
  const ty = vx(opts.target, 1);
  const tz = vx(opts.target, 2);
  const portrait = opts.portrait === true;
  const p = camera.position;
  if (portrait && opts.portraitRule !== false) {
    const k = FRAMING.portraitDistance;
    p.set(tx + (p.x - tx) * k, ty + (p.y - ty) * k, tz + (p.z - tz) * k);
    camera.fov = Math.min(120, camera.fov + FRAMING.portraitFovAdd);
  }
  const aspect = camera.aspect || 1;
  if (!portrait && aspect < FRAMING.minColumnAspect) {
    // Tablet portrait in the column layout: keep the desktop key's horizontal view.
    const half = Math.tan((camera.fov * Math.PI) / 360) * (FRAMING.minColumnAspect / aspect);
    camera.fov = Math.min(120, (Math.atan(half) * 360) / Math.PI);
  }
  camera.lookAt(tx, ty, tz);
  const dx = p.x - tx;
  const dy = p.y - ty;
  const dz = p.z - tz;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  camera.near = Math.min(200, Math.max(0.5, d * 0.02));
  camera.far = Math.max(d * 80, camera.near * 4);
  const ox = portrait ? 0 : (0.5 - (opts.fx ?? FRAMING.fx)) * aspect;
  const oy = portrait ? 0.5 - (opts.fy ?? FRAMING.portraitFy) : 0;
  // setViewOffset also refreshes the projection matrix (and pins aspect to fullWidth / fullHeight).
  camera.setViewOffset(aspect, 1, ox, oy, aspect, 1);
}

/** Writes a whole pose (position, up, fov) and frames it. Idempotent: safe to call every frame. */
export function poseCamera(
  camera: PerspectiveCamera,
  pose: CameraPose,
  opts: { portrait?: boolean; portraitRule?: boolean } = {},
) {
  camera.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
  camera.up.set(pose.up[0], pose.up[1], pose.up[2]);
  camera.fov = pose.fov;
  applyFraming(camera, {
    target: pose.target,
    fx: pose.fx,
    fy: pose.fy,
    portrait: opts.portrait,
    portraitRule: opts.portraitRule,
  });
}

/** Removes the framing offset (for scenes that frame themselves). */
export function clearFraming(camera: PerspectiveCamera) {
  camera.clearViewOffset();
}
