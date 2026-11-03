import type { IUniform, Material, WebGLProgramParametersWithUniforms } from 'three';

/**
 * Small onBeforeCompile helper for the built-in lit materials. Every patched shader gets
 * `vObj` (object-space position, before instancing) and `vWorld` (world position).
 */
export type Patch = {
  /** Unique program cache key: three would otherwise share one program between patches. */
  key: string;
  uniforms?: Record<string, IUniform>;
  vertexHead?: string;
  /** After <begin_vertex>: edit `transformed` (object space). */
  vertexMain?: string;
  fragmentHead?: string;
  /** After <color_fragment>: `diffuseColor` (discard here). */
  color?: string;
  /** After <roughnessmap_fragment>: `roughnessFactor`. */
  roughness?: string;
  /** After <metalnessmap_fragment>: `metalnessFactor`. */
  metalness?: string;
  /** After <normal_fragment_maps>: `normal` (view space). */
  normal?: string;
  /** After <clearcoat_normal_fragment_maps>: `clearcoatNormal`. */
  clearcoatNormal?: string;
  /** After <emissivemap_fragment>: `totalEmissiveRadiance`. */
  emissive?: string;
  /** Before <dithering_fragment>: `gl_FragColor`. */
  end?: string;
};

const after = (src: string, chunk: string, code?: string) =>
  code ? src.replace(`#include <${chunk}>`, `#include <${chunk}>\n${code}`) : src;

export function patch<T extends Material>(material: T, p: Patch): T {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    if (p.uniforms) Object.assign(shader.uniforms, p.uniforms);
    let v = shader.vertexShader;
    v = v.replace(
      'void main() {',
      `varying vec3 vObj;\nvarying vec3 vWorld;\n${p.vertexHead ?? ''}\nvoid main() {`,
    );
    v = after(v, 'begin_vertex', `${p.vertexMain ?? ''}\nvObj = transformed;`);
    v = after(
      v,
      'project_vertex',
      `{ vec4 wp = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  wp = instanceMatrix * wp;
#endif
  vWorld = (modelMatrix * wp).xyz; }`,
    );
    shader.vertexShader = v;

    let f = shader.fragmentShader;
    f = f.replace('void main() {', `varying vec3 vObj;\nvarying vec3 vWorld;\n${p.fragmentHead ?? ''}\nvoid main() {`);
    f = after(f, 'color_fragment', p.color);
    f = after(f, 'roughnessmap_fragment', p.roughness);
    f = after(f, 'metalnessmap_fragment', p.metalness);
    f = after(f, 'normal_fragment_maps', p.normal);
    f = after(f, 'clearcoat_normal_fragment_maps', p.clearcoatNormal);
    f = after(f, 'emissivemap_fragment', p.emissive);
    if (p.end) f = f.replace('#include <dithering_fragment>', `${p.end}\n#include <dithering_fragment>`);
    shader.fragmentShader = f;
  };
  material.customProgramCacheKey = () => `ch6:${p.key}`;
  return material;
}

/** View-space normal for a horizontal surface whose world height field has gradient (dx, dz). */
export const planeNormalGLSL = /* glsl */ `
vec3 ch6PlaneNormal(vec2 g) {
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  return normalize((viewMatrix * vec4(n, 0.0)).xyz);
}
`;

/** Blackbody-ish ramp for hot metal: 0 = cold, 1 = 940 °C. Linear HDR. */
export const heatGLSL = /* glsl */ `
vec3 ch6Heat(float t) {
  t = clamp((t - 0.3) / 0.7, 0.0, 1.0);
  vec3 c = mix(vec3(0.0), vec3(0.09, 0.008, 0.002), smoothstep(0.0, 0.25, t));
  c = mix(c, vec3(0.9, 0.12, 0.012), smoothstep(0.2, 0.5, t));
  c = mix(c, vec3(3.2, 0.62, 0.1), smoothstep(0.45, 0.8, t));
  c = mix(c, vec3(6.0, 2.6, 0.9), smoothstep(0.78, 1.0, t));
  return c;
}
`;
