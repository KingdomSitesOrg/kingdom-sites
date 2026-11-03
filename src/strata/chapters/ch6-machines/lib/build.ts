import { BoxGeometry, BufferGeometry, Color, CylinderGeometry, MeshStandardMaterial, type Material } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { acquireGrain, grainGLSL, releaseGrain } from './grain';
import { patch } from './patch';

/** Box by size and centre. */
export function box(w: number, h: number, d: number, x = 0, y = 0, z = 0): BufferGeometry {
  return new BoxGeometry(w, h, d).translate(x, y, z);
}

/** Box with rounded edges (radius r), so the studio strips draw a highlight along every edge. */
export function rbox(w: number, h: number, d: number, x = 0, y = 0, z = 0, r = 2): BufferGeometry {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01));
  return g.translate(x, y, z);
}

/** Cylinder by radius and length along an axis, centred at (x, y, z). */
export function cyl(r: number, len: number, x = 0, y = 0, z = 0, axis: 'x' | 'y' | 'z' = 'y', seg = 20): BufferGeometry {
  const g = new CylinderGeometry(r, r, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g.translate(x, y, z);
}

/** Merges and disposes the sources. */
export function merge(parts: BufferGeometry[]): BufferGeometry {
  const mixed = parts.some((g) => !g.index);
  const list = mixed ? parts.map((g) => (g.index ? g.toNonIndexed() : g)) : parts;
  const out = mergeGeometries(list, false);
  if (!out) throw new Error('ch6: incompatible geometries in merge');
  new Set([...parts, ...list]).forEach((g) => g.dispose());
  out.computeBoundingSphere();
  return out;
}

/** Uniform holding the shared grain texture; released when the material is disposed. */
export function grainUniforms<T extends Material>(material: T) {
  const tex = acquireGrain();
  material.addEventListener('dispose', releaseGrain);
  return { uGrain: { value: tex } };
}

/** Black anodised aluminium (STORYBOARD 3.2) with a faint satin grain. */
export function anodised(key: string, hex = '#16181D') {
  const m = new MeshStandardMaterial({ color: new Color(hex), metalness: 0.6, roughness: 0.42, envMapIntensity: 0.45 });
  return patch(m, {
    key: `anod-${key}`,
    uniforms: grainUniforms(m),
    fragmentHead: grainGLSL,
    roughness: 'roughnessFactor = clamp(roughnessFactor + (ch6G(vObj.xz * 0.011 + vObj.y * 0.007).x - 0.5) * 0.12, 0.05, 1.0);',
  });
}

/** Brushed aluminium: noise stretched along `axis` into roughness and a touch of albedo. */
export function brushed(key: string, axis: 'x' | 'y' | 'z' = 'x', hex = '#B7BCC4') {
  const uv =
    axis === 'x'
      ? 'vec2(vObj.x * 0.004, (vObj.y + vObj.z) * 0.4)'
      : axis === 'y'
        ? 'vec2(vObj.y * 0.004, (vObj.x + vObj.z) * 0.4)'
        : 'vec2(vObj.z * 0.004, (vObj.x + vObj.y) * 0.4)';
  const m = new MeshStandardMaterial({ color: new Color(hex), metalness: 1, roughness: 0.3 });
  return patch(m, {
    key: `brushed-${key}-${axis}`,
    uniforms: grainUniforms(m),
    fragmentHead: `${grainGLSL}
float ch6Brush() { return ch6G(${uv}).x; }`,
    color: 'float brush = ch6Brush(); diffuseColor.rgb *= 0.96 + 0.08 * brush;',
    roughness: 'roughnessFactor = clamp(roughnessFactor + (brush - 0.5) * 0.12, 0.05, 1.0);',
  });
}

/** Polished chrome for lead screws and rails. */
export function chrome() {
  return new MeshStandardMaterial({ color: new Color('#7E848D'), metalness: 1, roughness: 0.32 });
}
