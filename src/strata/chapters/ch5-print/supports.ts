// Print supports under the bracket's overhangs (the clamp ear and any strut that starts in mid-air), so nothing in
// the time-lapse is printed onto air. Contacts come from the part SDF: every 2 mm column whose first solid point is
// well above the plate, thinned to local low points at least 8 mm apart. Columns taper from a foot on the plate to a
// 0.5 mm tip just under the part; they print with the part through the same growth material.
import { BufferGeometry, CylinderGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PART_BOUNDS, sdOptimized } from '@/strata/part';

const GRID = 2;
const MIN_HEIGHT = 2.5;
const SPACING = 8;
const GAP = 0.25;
/** Supports start on layer 2, so layer 1 matches Ch4's layer-1 toolpaths exactly at the handoff. */
const BASE = 0.051;

/** First solid y above the plate in the column (x, z), or Infinity. Sphere-traced on the part SDF. */
function firstSolid(x: number, z: number): number {
  const p = { x, y: 0.3, z };
  for (let i = 0; i < 160 && p.y < PART_BOUNDS.max[1]; i++) {
    const d = sdOptimized(p);
    if (d < 0.02) return p.y;
    p.y += Math.max(d * 0.8, 0.05);
  }
  return Infinity;
}

export function supportContacts(): { x: number; y: number; z: number }[] {
  const nx = Math.floor((PART_BOUNDS.max[0] - PART_BOUNDS.min[0]) / GRID) + 1;
  const nz = Math.floor((PART_BOUNDS.max[2] - PART_BOUNDS.min[2]) / GRID) + 1;
  const ys = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      ys[j * nx + i] = firstSolid(PART_BOUNDS.min[0] + i * GRID, PART_BOUNDS.min[2] + j * GRID);
    }
  }
  const candidates: { x: number; y: number; z: number }[] = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const y = ys[j * nx + i];
      if (!Number.isFinite(y) || y < MIN_HEIGHT) continue;
      // a 45 degree underside is self-supporting: only columns at a local low point of the underside need a post
      let low = true;
      for (let dj = -1; dj <= 1 && low; dj++) {
        for (let di = -1; di <= 1; di++) {
          const ii = i + di,
            jj = j + dj;
          if ((di || dj) && ii >= 0 && jj >= 0 && ii < nx && jj < nz && ys[jj * nx + ii] < y - GRID * 0.9) {
            low = false;
            break;
          }
        }
      }
      if (low) candidates.push({ x: PART_BOUNDS.min[0] + i * GRID, y, z: PART_BOUNDS.min[2] + j * GRID });
    }
  }
  candidates.sort((a, b) => a.y - b.y);
  const picked: { x: number; y: number; z: number }[] = [];
  for (const c of candidates) {
    if (picked.every((q) => (q.x - c.x) ** 2 + (q.z - c.z) ** 2 >= SPACING * SPACING)) picked.push(c);
  }
  return picked;
}

/** Merged support geometry (mm, plate at y = 0): tapered posts, no pads. The caller disposes it. */
export function buildSupports(contacts: { x: number; y: number; z: number }[]): BufferGeometry | null {
  const parts: BufferGeometry[] = [];
  for (const c of contacts) {
    const h = c.y - GAP - BASE;
    const post = new CylinderGeometry(0.5, 1.5, h, 10, 1);
    post.translate(c.x, BASE + h / 2, c.z);
    parts.push(post);
  }
  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  merged?.computeBoundingSphere();
  return merged;
}

let supports: BufferGeometry | null | undefined;

/** Built once per page from the cached contacts; an unmount frees only its GPU buffers. */
export function getSupports(contacts: { x: number; y: number; z: number }[]): BufferGeometry | null {
  if (supports === undefined) supports = buildSupports(contacts);
  return supports;
}
