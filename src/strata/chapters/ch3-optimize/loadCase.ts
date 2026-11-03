// The FEA load case drawn as thin 3D line meshes: a 120 N arrow onto the collar and four fixed-support
// symbols under the bolt holes. aDraw orders the draw-on (0..1).
import { BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BOSS, COLLAR } from '@/strata/part/sdf';

type P = [number, number, number];
const R = 0.24;

/** Where the load enters the part (the collar crown, mm) and the arrow's tail for the HUD anchor. */
export const LOAD_POINT: P = [(COLLAR.x0 + COLLAR.x1) / 2, COLLAR.y + COLLAR.rOuter, 0];
export const LOAD_TAIL: P = [LOAD_POINT[0], LOAD_POINT[1] + 26, 0];
/** Bolt-hole centres on the build plate (x, z). */
export const BOLTS: [number, number][] = [
  [BOSS.x[0], BOSS.z],
  [BOSS.x[1], BOSS.z],
  [BOSS.x[0], -BOSS.z],
  [BOSS.x[1], -BOSS.z],
];

const up = new Vector3(0, 1, 0);

function segment(a: P, b: P, d0: number, d1: number, r = R) {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const g = new CylinderGeometry(r, r, len, 6, 1, true);
  // Cylinder runs -len/2 (bottom ring) .. +len/2 (top ring) along y: bottom = a, top = b.
  const pos = g.getAttribute('position');
  const draw = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) draw[i] = pos.getY(i) > 0 ? d1 : d0;
  g.setAttribute('aDraw', new BufferAttribute(draw, 1));
  g.applyQuaternion(new Quaternion().setFromUnitVectors(up, dir.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}

function cone(tip: P, height: number, radius: number, d0: number, d1: number) {
  const g = new ConeGeometry(radius, height, 16, 1, false);
  g.rotateX(Math.PI);
  const pos = g.getAttribute('position');
  const draw = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) draw[i] = d0 + (d1 - d0) * (0.5 - pos.getY(i) / height);
  g.setAttribute('aDraw', new BufferAttribute(draw, 1));
  g.translate(tip[0], tip[1] + height / 2, tip[2]);
  return g;
}

export function buildLoadCase(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const [lx, , lz] = LOAD_POINT;
  const tipY = LOAD_POINT[1] + 1.2;
  const headH = 6.5;
  parts.push(segment(LOAD_TAIL, [lx, tipY + headH - 0.2, lz], 0, 0.3));
  parts.push(cone([lx, tipY, lz], headH, 2.1, 0.3, 0.4));
  // Fixed supports: apex at the hole, base 5 mm below, ground line and four hatch strokes.
  for (const [bx, bz] of BOLTS) {
    const apex: P = [bx, -0.8, bz];
    const l: P = [bx - 3.2, -5.6, bz];
    const r: P = [bx + 3.2, -5.6, bz];
    parts.push(segment(apex, l, 0.42, 0.55));
    parts.push(segment(apex, r, 0.42, 0.55));
    parts.push(segment(l, r, 0.55, 0.68));
    parts.push(segment([bx - 4.6, -7.2, bz], [bx + 4.6, -7.2, bz], 0.68, 0.8));
    for (let k = 0; k < 4; k++) {
      const x = bx - 3.3 + k * 2.3;
      parts.push(segment([x, -7.2, bz], [x - 1.6, -9.4, bz], 0.8 + k * 0.04, 0.88 + k * 0.04));
    }
  }
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  return merged;
}
