import { BufferAttribute, CylinderGeometry, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const STEEL = 0;
const ALU = 1;
const DARK = 2;
const TIP = 3;

function tag(g: BufferGeometry, mat: number) {
  g.deleteAttribute('uv');
  g.setAttribute('aMat', new BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(mat), 1));
  return g;
}

function cyl(rTop: number, rBottom: number, h: number, seg: number, y0: number, mat: number, x = 0, z = 0) {
  const g = new CylinderGeometry(rTop, rBottom, h, seg, 1);
  g.translate(x, y0 + h / 2, z);
  return tag(g, mat);
}

/**
 * A compact hotend, nozzle tip at the origin, y up: hardened-steel nozzle (cone + hex), aluminium heat block
 * 22 x 12 x 18 mm with its heater cartridge and thermistor, a steel heat break and a finned heatsink above.
 * One geometry, one draw call; aMat selects the finish.
 */
export function buildHotend(detail: 'high' | 'medium' | 'low'): BufferGeometry {
  const seg = detail === 'high' ? 32 : detail === 'medium' ? 24 : 16;
  const fins = detail === 'low' ? 6 : 9;
  const parts: BufferGeometry[] = [
    cyl(0.5, 0.42, 0.3, seg, 0, TIP),
    cyl(3.6, 0.5, 4.65, seg, 0.3, STEEL),
    (() => {
      const hex = cyl(4.15, 4.15, 3, 6, 4.95, STEEL);
      hex.rotateY(Math.PI / 6);
      return hex;
    })(),
    cyl(3, 3, 0.5, seg, 7.95, STEEL),
    (() => {
      const block = new RoundedBoxGeometry(22, 12, 18, 2, 1.1);
      block.translate(4.5, 8.45 + 6, 0);
      return tag(block, ALU);
    })(),
    (() => {
      const c = cyl(3.1, 3.1, 25, seg, -12.5, DARK);
      c.rotateX(Math.PI / 2);
      c.translate(11.2, 13.6, -1.5);
      return c;
    })(),
    ...[-1, 1].map((sx) => {
      const w = cyl(0.55, 0.55, 20, 8, 0, DARK);
      w.rotateX(-Math.PI / 2 + 0.06);
      w.rotateZ(sx * 0.12);
      w.translate(11.2 + sx * 1.3, 13.6 + 0.4, -14);
      return w;
    }),
    (() => {
      const t = cyl(1.5, 1.5, 4, 12, -2, STEEL);
      t.rotateX(Math.PI / 2);
      t.translate(-3.5, 17.5, -9.2);
      return t;
    })(),
    cyl(1.45, 1.45, 7.2, seg, 20.45, STEEL),
    cyl(6.6, 6.6, 3, seg, 27.6, ALU),
    cyl(5, 5, 28, seg, 30.6, ALU),
    ...Array.from({ length: fins }, (_, i) => cyl(11.5, 11.5, 1, seg, 31.4 + i * (27 / fins), ALU)),
  ];
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const merged = mergeGeometries(flat, false)!;
  for (const p of flat) p.dispose();
  for (const p of parts) p.dispose();
  merged.computeBoundingSphere();
  return merged;
}
