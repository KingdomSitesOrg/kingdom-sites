// Geometry Ch3 derives from the shared part. The shared attributes are reused (one GPU buffer); only the
// triangle order is ours (order.ts).
import { BufferAttribute, BufferGeometry, Float32BufferAttribute } from 'three';
import { seededRandom } from '@/strata/story';
import type { PartData } from '@/strata/part';

export type DerivedGeometry = { geometry: BufferGeometry; shared: string[] };

/** A geometry that shares every attribute of `src` (one GPU buffer each) with its own triangle order. */
export function derive(src: BufferGeometry, index: Uint32Array): DerivedGeometry {
  const g = new BufferGeometry();
  const shared: string[] = [];
  for (const name of Object.keys(src.attributes)) {
    g.setAttribute(name, src.getAttribute(name));
    shared.push(name);
  }
  const small = src.getAttribute('position').count < 65536;
  g.setIndex(new BufferAttribute(small ? Uint16Array.from(index) : index, 1));
  g.boundingBox = src.boundingBox;
  g.boundingSphere = src.boundingSphere;
  return { geometry: g, shared };
}

/** First triangle index whose min-z exceeds z (binary search). */
export function countBelow(minZ: Float32Array, z: number) {
  let lo = 0;
  let hi = minZ.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (minZ[mid] <= z) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Releases our index buffer without touching the attribute buffers other chapters still use. */
export function disposeDerived(s: DerivedGeometry) {
  const g = s.geometry;
  const saved = s.shared.map((n) => [n, g.getAttribute(n)] as const);
  for (const n of s.shared) g.deleteAttribute(n);
  g.dispose();
  for (const [n, a] of saved) g.setAttribute(n, a);
}

/** Dust seeds on the solid surface: position, outward normal and a seed per point. */
export function buildDust(part: PartData, count: number): BufferGeometry {
  const { positions, normals } = part.samplesWithNormals('solid', count, 43);
  const rand = seededRandom(43);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = rand();
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('aNormal', new Float32BufferAttribute(normals, 3));
  g.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
  g.computeBoundingSphere();
  return g;
}

/** The highest-stress vertex on the camera-facing (+z) half: the sigma-max leader's anchor. */
export function maxStressPoint(part: PartData): [number, number, number] {
  const s = part.optimized.getAttribute('stress');
  const p = part.optimized.getAttribute('position');
  let best = -1;
  for (let i = 0; i < s.count; i++) {
    if (p.getZ(i) < 0) continue;
    if (best < 0 || s.getX(i) > s.getX(best)) best = i;
  }
  return best < 0 ? [0, 21, 0] : [p.getX(best), p.getY(best), p.getZ(best)];
}
