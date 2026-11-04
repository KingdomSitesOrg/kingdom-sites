'use client';

import { useMemo } from 'react';
import type { Camera, PerspectiveCamera } from 'three';
import { createPose, FRAMING, layoutFor, poseCamera, type CameraPose } from './framing';
import { storyStore } from './store';

export type Vec3 = readonly [number, number, number];

export interface CameraKeyframe {
  /** Position on the chapter's raw axis: 0 = pin start, 1 = pin end. Keys outside 0..1 shape the handoffs. */
  t: number;
  pos: Vec3;
  target: Vec3;
  fov?: number;
  /** Camera up at this key (default +y). Eased between keys, normalised. */
  up?: Vec3;
  /** Desktop screen-x of the target (default 0.60, framing.ts). Eased between keys. */
  fx?: number;
  /** Portrait screen-y of the target from the top (default 0.58). Eased between keys. */
  fy?: number;
}

export interface CameraApplyOptions {
  /** Defaults to the live viewport (height > width). */
  portrait?: boolean;
  /** Overrides the keys' fx for this frame. */
  fx?: number;
  /** Multiplies the final fov. */
  fovScale?: number;
}

export interface CameraPath {
  /**
   * Positions, aims, zooms and frames the camera for this raw progress (framing.ts): fx on desktop,
   * the portrait rule in portrait unless the path has portrait keys, near/far from the distance.
   * Legacy form: a number as the third argument is a bare fovScale with no framing at all.
   */
  apply(camera: Camera, raw: number, options?: CameraApplyOptions | number): void;
  /** Writes [px, py, pz, tx, ty, tz, fov] into out. */
  sample(raw: number, out: Float32Array | number[]): void;
  /** The full desktop (or portrait-key) pose at raw: pos, target, fov, up, fx, fy. */
  pose(raw: number, out: CameraPose, portrait?: boolean): CameraPose;
}

const CH = 7;
const easeSine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u);

/**
 * Time-aware Catmull-Rom (cubic Hermite with tangents from neighbouring keys and their spacing), so
 * velocity is continuous through every key. Outside the first and last key it extrapolates linearly
 * along the end tangent: the camera keeps moving through the handoffs instead of stopping at an edge.
 * fx, fy and up are eased per segment (sine.inOut) and held beyond the end keys.
 * `portraitKeys` replaces the portrait rule with the chapter's own portrait keys.
 */
export function createCameraPath(keys: readonly CameraKeyframe[], portraitKeys?: readonly CameraKeyframe[]): CameraPath {
  if (!keys.length) throw new Error('createCameraPath needs at least one keyframe');
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  const n = sorted.length;
  const hasFov = sorted.some((k) => k.fov !== undefined);
  const fovs = sorted.map((k) => k.fov);
  const firstFov = fovs.find((f) => f !== undefined) ?? 35;
  let carry = firstFov;
  const t = sorted.map((k) => k.t);
  const v = sorted.map((k) => {
    carry = k.fov ?? carry;
    return [k.pos[0], k.pos[1], k.pos[2], k.target[0], k.target[1], k.target[2], carry];
  });
  const m = v.map((_, i) => {
    const out = new Array<number>(CH).fill(0);
    if (n < 2) return out;
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const dt = t[b] - t[a] || 1;
    for (let c = 0; c < CH; c++) out[c] = (v[b][c] - v[a][c]) / dt;
    return out;
  });
  // Eased channels: fx, fy, up x/y/z.
  const e = sorted.map((k) => [k.fx ?? FRAMING.fx, k.fy ?? FRAMING.portraitFy, ...(k.up ?? [0, 1, 0])]);
  const scratch = new Float32Array(CH);
  const portraitPath = portraitKeys?.length ? createCameraPath(portraitKeys) : null;
  const scratchPose = createPose();

  function sample(raw: number, out: Float32Array | number[]) {
    if (n === 1 || raw <= t[0] || raw >= t[n - 1]) {
      const k = n === 1 || raw <= t[0] ? 0 : n - 1;
      const d = n === 1 ? 0 : raw - t[k];
      for (let c = 0; c < CH; c++) out[c] = v[k][c] + m[k][c] * d;
    } else {
      let k = 0;
      while (k < n - 2 && raw >= t[k + 1]) k++;
      const h = t[k + 1] - t[k];
      const u = (raw - t[k]) / h;
      const u2 = u * u;
      const u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1;
      const h10 = u3 - 2 * u2 + u;
      const h01 = -2 * u3 + 3 * u2;
      const h11 = u3 - u2;
      for (let c = 0; c < CH; c++) {
        out[c] = h00 * v[k][c] + h10 * h * m[k][c] + h01 * v[k + 1][c] + h11 * h * m[k + 1][c];
      }
    }
    out[6] = Math.min(120, Math.max(5, out[6]));
  }

  function eased(raw: number, c: number) {
    if (n === 1 || raw <= t[0]) return e[0][c];
    if (raw >= t[n - 1]) return e[n - 1][c];
    let k = 0;
    while (k < n - 2 && raw >= t[k + 1]) k++;
    const u = easeSine((raw - t[k]) / (t[k + 1] - t[k]));
    return e[k][c] + (e[k + 1][c] - e[k][c]) * u;
  }

  function pose(raw: number, out: CameraPose, portrait = false): CameraPose {
    if (portrait && portraitPath) return portraitPath.pose(raw, out);
    sample(raw, scratch);
    out.pos[0] = scratch[0];
    out.pos[1] = scratch[1];
    out.pos[2] = scratch[2];
    out.target[0] = scratch[3];
    out.target[1] = scratch[4];
    out.target[2] = scratch[5];
    out.fov = scratch[6];
    out.fx = eased(raw, 0);
    out.fy = eased(raw, 1);
    const ux = eased(raw, 2);
    const uy = eased(raw, 3);
    const uz = eased(raw, 4);
    const l = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    out.up[0] = ux / l;
    out.up[1] = uy / l;
    out.up[2] = uz / l;
    return out;
  }

  return {
    sample,
    pose,
    apply(camera, raw, options) {
      if (typeof options === 'number') {
        applyLegacy(camera, raw, options);
        return;
      }
      const cam = camera as PerspectiveCamera;
      if (!cam.isPerspectiveCamera) {
        applyLegacy(camera, raw, 1);
        return;
      }
      const vp = storyStore.getState().viewport;
      const portrait = options?.portrait ?? layoutFor(vp.width) === 'stacked';
      pose(raw, scratchPose, portrait);
      if (options?.fx !== undefined) scratchPose.fx = options.fx;
      if (options?.fovScale !== undefined) scratchPose.fov = Math.min(120, scratchPose.fov * options.fovScale);
      poseCamera(cam, scratchPose, { portrait, portraitRule: !(portrait && portraitPath) });
    },
  };

  function applyLegacy(camera: Camera, raw: number, fovScale: number) {
    sample(raw, scratch);
    camera.position.set(scratch[0], scratch[1], scratch[2]);
    camera.lookAt(scratch[3], scratch[4], scratch[5]);
    if (hasFov && (camera as PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as PerspectiveCamera;
      const fov = Math.min(120, scratch[6] * fovScale);
      if (Math.abs(cam.fov - fov) > 1e-4) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    }
  }
}

/** Memoised createCameraPath. Keep the keyframe arrays module constants. */
export function useCameraPath(keys: readonly CameraKeyframe[], portraitKeys?: readonly CameraKeyframe[]): CameraPath {
  return useMemo(() => createCameraPath(keys, portraitKeys), [keys, portraitKeys]);
}
