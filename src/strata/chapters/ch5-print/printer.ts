// Procedural CoreXY printer with a dropping bed (STORYBOARD Ch5 "Machine"). Millimetres, print plane y = 0.
// Everything static is merged by material at mount; moving assemblies (gantry, toolhead, bed) are merged per
// assembly, so the whole machine is a couple of dozen draw calls.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  LatheGeometry,
  Matrix3,
  Matrix4,
  Path,
  Quaternion,
  Shape,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type MatKey = 'alu' | 'black' | 'steel' | 'rubber' | 'sock' | 'brass' | 'pei' | 'heater' | 'nozzle' | 'fan' | 'belt' | 'led';
type V3 = readonly [number, number, number];

export const FRAME = { half: 230, bottom: -360, top: 140, gantryY: 30, beamY: 72, beamZ: -48 } as const;
export const BED = { size: 256, plate: 262, front: 128 } as const;
/** Fixed end of the X cable chain (gantry-local x), link pitch, count, bend radius, lower-run height. */
export const CHAIN = { fixedX: -196, pitch: 10, links: 42, radius: 14, y: 97, z: -50 } as const;

class Batch {
  private lists = new Map<MatKey, BufferGeometry[]>();
  private m = new Matrix4();
  private q = new Quaternion();
  private e = new Euler();
  private n3 = new Matrix3();

  add(key: MatKey, geo: BufferGeometry, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], axis: V3 = [0, 1, 0], extra?: number) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.getAttribute('uv')) g.setAttribute('uv', new BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
    this.e.set(rot[0], rot[1], rot[2]);
    this.q.setFromEuler(this.e);
    this.m.compose(new Vector3(...pos), this.q, new Vector3(1, 1, 1));
    g.applyMatrix4(this.m);
    const ax = new Vector3(...axis).applyMatrix3(this.n3.setFromMatrix4(this.m)).normalize();
    const count = g.getAttribute('position').count;
    const a = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      a[i * 4] = ax.x;
      a[i * 4 + 1] = ax.y;
      a[i * 4 + 2] = ax.z;
      a[i * 4 + 3] = extra ?? 0;
    }
    g.setAttribute('aAxis', new BufferAttribute(a, 4));
    g.clearGroups();
    let list = this.lists.get(key);
    if (!list) this.lists.set(key, (list = []));
    list.push(g);
  }

  box(key: MatKey, size: V3, pos: V3, rot: V3 = [0, 0, 0], extra?: number) {
    const axis: V3 = size[0] >= size[1] && size[0] >= size[2] ? [1, 0, 0] : size[1] >= size[2] ? [0, 1, 0] : [0, 0, 1];
    this.add(key, new BoxGeometry(size[0], size[1], size[2]), pos, rot, axis, extra);
  }

  rbox(key: MatKey, size: V3, radius: number, pos: V3, rot: V3 = [0, 0, 0]) {
    this.add(key, new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), pos, rot);
  }

  /** Cylinder along local y, rotated by rot. */
  cyl(key: MatKey, r: number, h: number, pos: V3, rot: V3 = [0, 0, 0], seg = 24, r2 = r) {
    this.add(key, new CylinderGeometry(r2, r, h, seg, 1), pos, rot, [0, 1, 0]);
  }

  build(): Partial<Record<MatKey, BufferGeometry>> {
    const out: Partial<Record<MatKey, BufferGeometry>> = {};
    for (const [key, list] of this.lists) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (merged) {
        merged.computeBoundingBox();
        merged.computeBoundingSphere();
        out[key] = merged;
      }
    }
    this.lists.clear();
    return out;
  }
}

/** 2020 extrusion profile: four T-slot grooves, chamfered corners, centre bore. */
function profile2020(): Shape {
  const s = new Shape();
  const pts: [number, number][] = [
    [-9.5, -10], [-3.1, -10], [-3.1, -8.2], [3.1, -8.2], [3.1, -10], [9.5, -10],
    [10, -9.5], [10, -3.1], [8.2, -3.1], [8.2, 3.1], [10, 3.1], [10, 9.5],
    [9.5, 10], [3.1, 10], [3.1, 8.2], [-3.1, 8.2], [-3.1, 10], [-9.5, 10],
    [-10, 9.5], [-10, 3.1], [-8.2, 3.1], [-8.2, -3.1], [-10, -3.1], [-10, -9.5],
  ];
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  const bore = new Path();
  bore.absarc(0, 0, 2.1, 0, Math.PI * 2, true);
  s.holes.push(bore);
  return s;
}

const PROFILE = profile2020();

/** A 2020 extrusion of length len centred at pos along 'x' | 'y' | 'z'. */
function extrusion(b: Batch, key: MatKey, len: number, pos: V3, along: 'x' | 'y' | 'z') {
  const g = new ExtrudeGeometry(PROFILE, { depth: len, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -len / 2);
  const rot: V3 = along === 'x' ? [0, Math.PI / 2, 0] : along === 'y' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  b.add(key, g, pos, rot, [0, 0, 1]);
}

/** NEMA 17: black body, brushed caps, shaft and GT2 pulley pointing down (shaftDown) or up. */
function stepper(b: Batch, x: number, yBottom: number, z: number, shaftDown: boolean) {
  b.box('black', [42, 28, 42], [x, yBottom + 20, z]);
  b.box('alu', [42.4, 6, 42.4], [x, yBottom + 3, z]);
  b.box('alu', [42.4, 6, 42.4], [x, yBottom + 37, z]);
  for (let i = 0; i < 4; i++) {
    const sx = i & 1 ? 15.5 : -15.5,
      sz = i & 2 ? 15.5 : -15.5;
    b.cyl('steel', 1.6, 1.2, [x + sx, shaftDown ? yBottom - 0.6 : yBottom + 40.6, z + sz], [0, 0, 0], 10);
  }
  const sy = shaftDown ? yBottom - 9 : yBottom + 49;
  b.cyl('steel', 2.5, 18, [x, sy, z], [0, 0, 0], 12);
}

export interface PrinterGeometry {
  frame: Partial<Record<MatKey, BufferGeometry>>;
  gantry: Partial<Record<MatKey, BufferGeometry>>;
  toolhead: Partial<Record<MatKey, BufferGeometry>>;
  bed: Partial<Record<MatKey, BufferGeometry>>;
  link: BufferGeometry;
  tube: BufferGeometry;
}

export function buildPrinter(): PrinterGeometry {
  const H = FRAME.half;
  const b = new Batch();

  // ---------- frame ----------
  const postLen = FRAME.top - FRAME.bottom;
  const postY = (FRAME.top + FRAME.bottom) / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) extrusion(b, 'black', postLen, [sx * H, postY, sz * H], 'y');
  const inner = 2 * H - 20;
  for (const y of [FRAME.bottom + 10, FRAME.top - 10]) {
    for (const s of [-1, 1]) {
      extrusion(b, 'black', inner, [0, y, s * H], 'x');
      extrusion(b, 'black', inner, [s * H, y, 0], 'z');
    }
  }
  for (const s of [-1, 1]) {
    extrusion(b, 'black', inner, [s * H, FRAME.gantryY, 0], 'z');
    // mid side post carrying the Z rail
    extrusion(b, 'black', FRAME.gantryY - 10 - (FRAME.bottom + 20), [s * H, (FRAME.gantryY - 10 + FRAME.bottom + 20) / 2, 0], 'y');
  }
  // brushed corner caps
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box('alu', [21, 6, 21], [sx * H, FRAME.top + 3, sz * H]);
  // base pan and feet
  b.box('black', [2 * H + 20, 3, 2 * H + 20], [0, FRAME.bottom - 1.5, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl('black', 14, 8, [sx * (H - 8), FRAME.bottom - 7, sz * (H - 8)], [0, 0, 0], 20);
  // Y rails on the gantry-level members
  for (const s of [-1, 1]) b.box('steel', [12, 8, 2 * H - 30], [s * H, FRAME.gantryY + 14, 0]);
  // Z rails on the mid posts and lead screws behind them
  for (const s of [-1, 1]) {
    b.box('steel', [8, 330, 12], [s * (H - 14), -165, 0]);
    b.cyl('steel', 4, 330, [s * 205, -150, -40], [0, 0, 0], 16);
    stepper(b, s * 205, FRAME.bottom + 18, -40, false);
  }
  // XY motors at the rear corners, pulleys down at belt height
  for (const s of [-1, 1]) {
    stepper(b, s * 198, 92, -198, true);
    b.cyl('alu', 6.5, 16, [s * 198, 74, -198], [0, 0, 0], 20);
    // front idlers
    b.cyl('alu', 9, 16, [s * 198, 74, 198], [0, 0, 0], 24);
    b.cyl('steel', 2.5, 22, [s * 198, 74, 198], [0, 0, 0], 10);
    b.box('black', [24, 6, 30], [s * 198, 86, 198]);
    b.box('black', [24, 6, 30], [s * 198, 62, 198]);
  }
  // side belts (two levels per side), belt id in aAxis.w: 0 left, 1 right
  for (const s of [-1, 1]) {
    for (const [dy, dx] of [[-4, -5], [4, 5]]) {
      const g = new BoxGeometry(1.4, 6, 396);
      beltUV(g, 396, 'z');
      b.add('belt', g, [s * 198 + dx, 74 + dy, 0], [0, 0, 0], [0, 0, 1], s < 0 ? 0 : 1);
    }
  }

  const frame = b.build();

  // ---------- gantry (moves in z with the nozzle; local z 0 = nozzle z) ----------
  const by = FRAME.beamY;
  const bz = FRAME.beamZ;
  b.box('alu', [2 * H - 16, 36, 20], [0, by, bz]);
  // grooves on the beam front and back read as an extrusion
  for (const s of [-1, 1]) b.box('black', [2 * H - 18, 2.2, 21], [0, by + s * 9, bz]);
  b.box('steel', [2 * H - 30, 12, 8], [0, by, bz + 14]);
  for (const s of [-1, 1]) {
    b.box('steel', [26, 14, 46], [s * H, FRAME.gantryY + 25, bz]);
    b.rbox('black', [34, 44, 52], 2, [s * (H - 4), by + 2, bz]);
    b.cyl('alu', 8, 16, [s * 198, by + 2, bz - 22], [0, 0, 0], 20);
  }
  for (const [dy, id] of [[-4, 2], [4, 3]] as const) {
    const g = new BoxGeometry(410, 6, 1.4);
    beltUV(g, 410, 'x');
    b.add('belt', g, [0, 74 + dy, bz - 14], [0, 0, 0], [1, 0, 0], id);
  }
  // chain tray on top of the beam
  b.box('black', [2 * H - 40, 2, 24], [0, by + 19, CHAIN.z]);
  const gantry = b.build();

  // ---------- toolhead (local origin = nozzle tip) ----------
  // hardened-steel nozzle: tip cone, hex, neck
  const nozzle = new LatheGeometry(
    [new Vector2(0.001, 0), new Vector2(0.2, 0), new Vector2(0.55, 0.35), new Vector2(2.3, 2.5), new Vector2(2.3, 2.6)],
    32,
  );
  b.add('nozzle', nozzle, [0, 0, 0]);
  b.add('nozzle', new CylinderGeometry(4.04, 4.04, 2.8, 6, 1), [0, 4.0, 0], [0, Math.PI / 6, 0]);
  b.cyl('nozzle', 3, 1.2, [0, 6.0, 0], [0, 0, 0], 20);
  // heat block in a silicone sock, cartridge and thermistor poking out
  b.rbox('sock', [22.5, 12, 18.5], 3.2, [2, 12.4, 0]);
  b.cyl('steel', 3, 9, [15.5, 11, 3.5], [0, 0, Math.PI / 2], 16);
  b.cyl('sock', 0.9, 34, [19.5, 26, 2.4], [0, 0, 0.18], 8);
  b.cyl('sock', 0.9, 34, [19.5, 26, 4.6], [0, 0, 0.18], 8);
  b.cyl('steel', 1.6, 6, [14, 14.5, -4.5], [0, 0, Math.PI / 2], 10);
  // heat break and the 12-fin heatsink
  b.cyl('steel', 2.6, 5.5, [0, 21.2, 0], [0, 0, 0], 16);
  b.cyl('alu', 5.5, 24.5, [0, 36.2, 0], [0, 0, 0], 24);
  for (let i = 0; i < 12; i++) b.cyl('alu', 11.5, 1.1, [0, 24.5 + i * 2.05, 0], [0, 0, 0], 32);
  // housing: black anodised shell with the 40 mm hotend fan in front, blower on the left
  b.rbox('black', [54, 40, 46], 4, [0, 68, 0]);
  b.rbox('black', [50, 6, 40], 2, [0, 49, -2]);
  b.box('steel', [46, 27, 9], [0, by, -26.5]);
    // fan grille rings and cross
  for (const r of [17, 11.5, 6]) b.add('black', new TorusGeometry(r, 0.75, 6, 48), [0, 68, 23.6]);
  b.box('black', [36, 1.4, 1.4], [0, 68, 23.6], [0, 0, Math.PI / 4]);
  b.box('black', [36, 1.4, 1.4], [0, 68, 23.6], [0, 0, -Math.PI / 4]);
  b.add('fan', new CircleGeometry(18.5, 48), [0, 68, 23.1]);
  b.add('fan', new CircleGeometry(15, 40), [-27.2, 66, 0], [0, -Math.PI / 2, 0]);
  b.add('black', new TorusGeometry(15.4, 1.1, 6, 40), [-27.4, 66, 0], [0, Math.PI / 2, 0]);
  // part-cooling ducts: two arms down the sides, each ending in a slot outlet angled at the nozzle
  for (const s of [-1, 1]) {
    b.rbox('black', [7, 40, 10], 2.5, [s * 19, 28, -8]);
    b.rbox('black', [12, 6, 11], 2.2, [s * 14.5, 7.2, -6], [0, 0, s * 0.42]);
  }
  // bracket up to the cable chain
  b.box('black', [12, 36, 10], [0, 104, -20]);
  b.box('black', [12, 8, 36], [0, 122, -36]);
  const toolhead = b.build();

  // ---------- bed (local origin = top of the PEI sheet) ----------
  b.box('pei', [BED.size, 0.6, BED.size], [0, -0.3, 0]);
  b.box('alu', [BED.plate, 8, BED.plate], [0, -4.6, 0]);
  b.box('black', [BED.plate - 10, 1.6, BED.plate - 10], [0, -9.4, 0]);
  b.box('heater', [BED.size - 10, 0.6, 0.6], [0, -1.15, BED.plate / 2 + 0.05]);
  for (const s of [-1, 1]) {
    b.box('black', [20, 20, 250], [s * 100, -20.2, 0]);
    b.box('black', [118, 20, 60], [s * 160, -20.2, -20]);
    b.box('alu', [14, 26, 24], [s * 205, -20.2, 0]);
    b.cyl('brass', 8, 14, [s * 205, -20.2, -40], [0, 0, 0], 20);
    b.box('black', [30, 6, 30], [s * 205, -30, -40]);
  }
  const bed = b.build();

  // cable-chain link (one instance per link): two side plates and a bridge
  const lb = new Batch();
  lb.box('rubber', [9.2, 11, 2], [0, 0, 7.5]);
  lb.box('rubber', [9.2, 11, 2], [0, 0, -7.5]);
  lb.box('rubber', [9.2, 2, 15], [0, 5, 0]);
  lb.box('rubber', [9.2, 2, 15], [0, -5, 0]);
  const link = lb.build().rubber!;

  // filament tube: a unit cylinder along +y, bent in the vertex shader
  const tube = new CylinderGeometry(2.2, 2.2, 1, 10, 48, true);
  tube.translate(0, 0.5, 0);

  return { frame, gantry, toolhead, bed, link, tube };
}

/** Belt UVs: u = position along the belt in mm (for the tooth stripe), v = across. */
function beltUV(g: BoxGeometry, len: number, along: 'x' | 'z') {
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const a = along === 'x' ? pos.getX(i) : pos.getZ(i);
    uv.setX(i, a + len / 2);
  }
  uv.needsUpdate = true;
}

export function disposePrinter(p: PrinterGeometry) {
  for (const group of [p.frame, p.gantry, p.toolhead, p.bed]) for (const g of Object.values(group)) g?.dispose();
  p.link.dispose();
  p.tube.dispose();
}

let built: PrinterGeometry | null = null;

/**
 * The printer's CPU geometry, built once per page (idle, as soon as the chunk is prefetched) and kept: an unmount
 * only frees its GPU buffers (disposePrinter), and the next mount uploads the same arrays again.
 */
export function getPrinter(): PrinterGeometry {
  return (built ??= buildPrinter());
}
