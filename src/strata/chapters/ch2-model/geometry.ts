import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';
import { COLLAR, type PartData } from '@/strata/part';
import { seededRandom, type Quality } from '@/strata/story';

/** Every stage grows outward from the top of the clamp collar (the calibrated bracket's, not the storyboard's x 0). */
export const FRONT_ORIGIN = [(COLLAR.x0 + COLLAR.x1) / 2, COLLAR.y + COLLAR.rOuter, 0] as const;
const CONNECTORS: Record<Quality, number> = { high: 6000, medium: 3000, low: 0 };

export interface ModelGeometry {
  cloud: BufferGeometry;
  nodes: BufferGeometry;
  wire: BufferGeometry;
  low: BufferGeometry;
  surface: BufferGeometry;
  /** Distance from FRONT_ORIGIN to the farthest point of the part, mm. */
  frontRadius: number;
  counts: { points: number; edges: number; faces: number; subdFaces: number };
  dispose(): void;
}

function frontOf(x: number, y: number, z: number, r: number) {
  const dx = x - FRONT_ORIGIN[0];
  const dy = y - FRONT_ORIGIN[1];
  const dz = z - FRONT_ORIGIN[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz) / r;
}

const BOUNDS = new Sphere(new Vector3(0, 21, 0), 70);

export function buildModelGeometry(part: PartData, quality: Quality, cloudPositions: Float32Array): ModelGeometry {
  const solidPos = part.solid.getAttribute('position').array as Float32Array;
  let r = 0;
  for (let i = 0; i < solidPos.length; i += 3) {
    const dx = solidPos[i] - FRONT_ORIGIN[0];
    const dy = solidPos[i + 1] - FRONT_ORIGIN[1];
    const dz = solidPos[i + 2] - FRONT_ORIGIN[2];
    r = Math.max(r, dx * dx + dy * dy + dz * dz);
  }
  r = Math.sqrt(r);

  // Cloud: the shared samples, plus each point's front and a seeded twinkle phase.
  const nPts = cloudPositions.length / 3;
  const cloudFront = new Float32Array(nPts);
  const cloudSeed = new Float32Array(nPts);
  const rand = seededRandom(207);
  for (let i = 0; i < nPts; i++) {
    cloudFront[i] = frontOf(cloudPositions[i * 3], cloudPositions[i * 3 + 1], cloudPositions[i * 3 + 2], r);
    cloudSeed[i] = rand();
  }
  const cloud = new BufferGeometry();
  cloud.setAttribute('position', new BufferAttribute(cloudPositions, 3));
  cloud.setAttribute('aFront', new BufferAttribute(cloudFront, 1));
  cloud.setAttribute('aSeed', new BufferAttribute(cloudSeed, 1));
  cloud.boundingSphere = BOUNDS.clone();

  // Low-poly topology: weld solidLow's corners into vertices, collect unique edges.
  const lowPos = part.solidLow.getAttribute('position').array as Float32Array;
  const lowNrm = part.solidLow.getAttribute('normal').array as Float32Array;
  const corners = lowPos.length / 3;
  const ids = new Uint32Array(corners);
  const keyToId = new Map<string, number>();
  const verts: number[] = [];
  for (let i = 0; i < corners; i++) {
    const x = lowPos[i * 3];
    const y = lowPos[i * 3 + 1];
    const z = lowPos[i * 3 + 2];
    const key = `${Math.round(x * 1000)},${Math.round(y * 1000)},${Math.round(z * 1000)}`;
    let id = keyToId.get(key);
    if (id === undefined) {
      id = verts.length / 3;
      keyToId.set(key, id);
      verts.push(x, y, z);
    }
    ids[i] = id;
  }
  const nVerts = verts.length / 3;
  const edgeSet = new Set<number>();
  const edges: number[] = [];
  for (let f = 0; f < corners / 3; f++) {
    for (let e = 0; e < 3; e++) {
      const a = ids[f * 3 + e];
      const b = ids[f * 3 + ((e + 1) % 3)];
      const k = a < b ? a * nVerts + b : b * nVerts + a;
      if (a === b || edgeSet.has(k)) continue;
      edgeSet.add(k);
      edges.push(a, b);
    }
  }
  const nEdges = edges.length / 2;

  // Connectors: every k-th cloud point to its nearest low-poly vertex.
  const cap = Math.min(CONNECTORS[quality], nPts);
  const stride = cap > 0 ? Math.max(1, Math.floor(nPts / cap)) : 0;
  const nConn = cap > 0 ? Math.floor(nPts / stride) : 0;

  const segs = nEdges + nConn;
  const wirePos = new Float32Array(segs * 6);
  const wireFront = new Float32Array(segs * 2);
  const wireKind = new Float32Array(segs * 2);
  for (let i = 0; i < nEdges; i++) {
    for (let j = 0; j < 2; j++) {
      const v = edges[i * 2 + j];
      const o = (i * 2 + j) * 3;
      wirePos[o] = verts[v * 3];
      wirePos[o + 1] = verts[v * 3 + 1];
      wirePos[o + 2] = verts[v * 3 + 2];
      wireFront[i * 2 + j] = frontOf(wirePos[o], wirePos[o + 1], wirePos[o + 2], r);
    }
  }
  for (let c = 0; c < nConn; c++) {
    const pi = c * stride;
    const px = cloudPositions[pi * 3];
    const py = cloudPositions[pi * 3 + 1];
    const pz = cloudPositions[pi * 3 + 2];
    let best = 0;
    let bestD = Infinity;
    for (let v = 0; v < nVerts; v++) {
      const dx = verts[v * 3] - px;
      const dy = verts[v * 3 + 1] - py;
      const dz = verts[v * 3 + 2] - pz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    const s = nEdges + c;
    const o = s * 6;
    wirePos[o] = px;
    wirePos[o + 1] = py;
    wirePos[o + 2] = pz;
    wirePos[o + 3] = verts[best * 3];
    wirePos[o + 4] = verts[best * 3 + 1];
    wirePos[o + 5] = verts[best * 3 + 2];
    wireFront[s * 2] = cloudFront[pi];
    wireFront[s * 2 + 1] = frontOf(wirePos[o + 3], wirePos[o + 4], wirePos[o + 5], r);
    wireKind[s * 2] = 1;
    wireKind[s * 2 + 1] = 1;
  }
  const wire = new BufferGeometry();
  wire.setAttribute('position', new BufferAttribute(wirePos, 3));
  wire.setAttribute('aFront', new BufferAttribute(wireFront, 1));
  wire.setAttribute('aKind', new BufferAttribute(wireKind, 1));
  wire.boundingSphere = BOUNDS.clone();

  // Vertex nodes: one bright point per low-poly vertex.
  const nodePos = new Float32Array(verts);
  const nodeFront = new Float32Array(nVerts);
  for (let v = 0; v < nVerts; v++) nodeFront[v] = frontOf(verts[v * 3], verts[v * 3 + 1], verts[v * 3 + 2], r);
  const nodes = new BufferGeometry();
  nodes.setAttribute('position', new BufferAttribute(nodePos, 3));
  nodes.setAttribute('aFront', new BufferAttribute(nodeFront, 1));
  nodes.boundingSphere = BOUNDS.clone();

  // Low-poly faces: own copy of solidLow with each face's centroid, front and a seeded jitter. A face waits for
  // the front to pass its farthest corner and the farthest corner of every coplanar neighbour, so a large flat
  // panel fills in one piece and never pops ahead of the small faces around it.
  const faces = corners / 3;
  const centroid = new Float32Array(corners * 3);
  const faceFront = new Float32Array(corners);
  const far = new Float32Array(faces);
  const normal = new Float32Array(faces * 3);
  const edgeFaces = new Map<number, number[]>();
  for (let f = 0; f < faces; f++) {
    const o = f * 9;
    const ux = lowPos[o + 3] - lowPos[o];
    const uy = lowPos[o + 4] - lowPos[o + 1];
    const uz = lowPos[o + 5] - lowPos[o + 2];
    const vx = lowPos[o + 6] - lowPos[o];
    const vy = lowPos[o + 7] - lowPos[o + 1];
    const vz = lowPos[o + 8] - lowPos[o + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    normal[f * 3] = nx / len;
    normal[f * 3 + 1] = ny / len;
    normal[f * 3 + 2] = nz / len;
    for (let k = 0; k < 3; k++) {
      far[f] = Math.max(far[f], frontOf(lowPos[o + k * 3], lowPos[o + k * 3 + 1], lowPos[o + k * 3 + 2], r));
      const a = ids[f * 3 + k];
      const b = ids[f * 3 + ((k + 1) % 3)];
      const key = a < b ? a * nVerts + b : b * nVerts + a;
      const list = edgeFaces.get(key);
      if (list) list.push(f);
      else edgeFaces.set(key, [f]);
    }
  }
  const panel = Float32Array.from(far);
  for (const list of edgeFaces.values()) {
    for (const f of list) {
      for (const g of list) {
        const dot = normal[f * 3] * normal[g * 3] + normal[f * 3 + 1] * normal[g * 3 + 1] + normal[f * 3 + 2] * normal[g * 3 + 2];
        if (dot > 0.999) panel[f] = Math.max(panel[f], far[g]);
      }
    }
  }
  const frand = seededRandom(311);
  for (let f = 0; f < faces; f++) {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let k = 0; k < 3; k++) {
      cx += lowPos[(f * 3 + k) * 3] / 3;
      cy += lowPos[(f * 3 + k) * 3 + 1] / 3;
      cz += lowPos[(f * 3 + k) * 3 + 2] / 3;
    }
    const ff = panel[f] + (frand() - 0.5) * 0.03;
    for (let k = 0; k < 3; k++) {
      const o = f * 3 + k;
      centroid[o * 3] = cx;
      centroid[o * 3 + 1] = cy;
      centroid[o * 3 + 2] = cz;
      faceFront[o] = ff;
    }
  }
  const low = new BufferGeometry();
  low.setAttribute('position', new BufferAttribute(new Float32Array(lowPos), 3));
  low.setAttribute('normal', new BufferAttribute(new Float32Array(lowNrm), 3));
  low.setAttribute('aCentroid', new BufferAttribute(centroid, 3));
  low.setAttribute('aFront', new BufferAttribute(faceFront, 1));
  low.boundingSphere = BOUNDS.clone();

  // Subdivision surface: a non-indexed copy of part.solid so the shader can read barycentrics from gl_VertexID.
  const surface = part.solid.index ? part.solid.toNonIndexed() : part.solid.clone();
  for (const name of Object.keys(surface.attributes)) {
    if (name !== 'position' && name !== 'normal') surface.deleteAttribute(name);
  }
  surface.boundingSphere = BOUNDS.clone();

  const subdFaces = (part.solid.index ? part.solid.index.count : part.solid.getAttribute('position').count) / 3;

  return {
    cloud,
    nodes,
    wire,
    low,
    surface,
    frontRadius: r,
    counts: { points: nPts, edges: nEdges, faces, subdFaces },
    dispose() {
      cloud.dispose();
      nodes.dispose();
      wire.dispose();
      low.dispose();
      surface.dispose();
    },
  };
}
