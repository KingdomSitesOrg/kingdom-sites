import { AdditiveBlending, Color, LinearSRGBColorSpace, MeshPhysicalMaterial, ShaderMaterial, type IUniform, type MeshPhysicalMaterialParameters } from 'three';
import { fbmGLSL, hashGLSL } from '@/strata/shaders/noise';
import { PART_GLSL } from '@/strata/part';
import { linearRGB } from '@/strata/shaders/palette';
import type { Quality } from '@/strata/story';

/** Uniforms every studio material shares: the rim-then-key reveal and the material-swap band. */
export interface StudioUniforms {
  uRim: IUniform<number>;
  uKey: IUniform<number>;
  /** Swap band height in part millimetres (part base = 0). */
  uScanY: IUniform<number>;
  /** Band glow 0..1 (only during a swap). */
  uBand: IUniform<number>;
}


export function createStudioUniforms(): StudioUniforms {
  return { uRim: { value: 1 }, uKey: { value: 1 }, uScanY: { value: 43 }, uBand: { value: 0 } };
}

type Finish = 'titanium' | 'carbon' | 'glass' | 'glassFallback' | 'anodised';

/** A studio material plus its clip uniform: +1 keeps y <= band (incoming), -1 keeps y > band (outgoing), 0 off. */
export interface StudioMaterial {
  material: MeshPhysicalMaterial;
  clip: IUniform<number>;
}

/** Ambient occlusion from the part's own SDF, per vertex (cheap: the mesh, not the screen). */
const AO_GLSL = /* glsl */ `
${PART_GLSL}
float stAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.8 + 2.4 * float(i);
    occ += (h - sdOptimized(p + n * h)) * sca;
    sca *= 0.72;
  }
  return clamp(1.0 - 0.11 * occ, 0.25, 1.0);
}
`;

/** The reveal's first beat: before the key comes up, sideways-facing silhouettes glow as two thin lines of light. */
const rimGLSL = (strength: number) => /* glsl */ `
  {
    float rimOnly = uRim * (1.0 - uKey);
    vec3 nWe = inverseTransformDirection(normal, viewMatrix);
    float fr = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
    totalEmissiveRadiance += vec3(0.9, 0.93, 1.0) * fr * smoothstep(0.25, 0.75, abs(nWe.x)) * rimOnly * ${strength.toFixed(2)};
  }`;

const glslVec = ([r, g, b]: readonly number[]) => `vec3(${r.toFixed(5)}, ${g.toFixed(5)}, ${b.toFixed(5)})`;
const MOLTEN = linearRGB('molten');
const MOLTEN_HOT = `${glslVec(MOLTEN)} * 4.0`;

const srgb = (hex: string) => new Color(hex);

function patch(material: MeshPhysicalMaterial, shared: StudioUniforms, finish: Finish, fill: number, extra: Record<string, IUniform> = {}) {
  const clip: IUniform<number> = { value: 0 };
  const fillU: IUniform<number> = { value: fill };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, extra, { uClip: clip, uFill: fillU });
    const ao = finish === 'titanium' || finish === 'carbon' || finish === 'glass' || finish === 'glassFallback';
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vStPos;\nvarying vec3 vStNormal;\nvarying float vStAO;\n${ao ? AO_GLSL : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvStPos = position;\nvStNormal = normal;\nvStAO = ${ao ? 'stAO(position, normal)' : '1.0'};`,
      );

    const fragPars = /* glsl */ `
uniform float uRim;
uniform float uKey;
uniform float uScanY;
uniform float uBand;
uniform float uClip;
uniform float uFill;
${finish === 'anodised' ? 'uniform float uHair;' : ''}
varying vec3 vStPos;
varying vec3 vStNormal;
varying float vStAO;
${hashGLSL}
${finish === 'titanium' ? `#define FBM_OCTAVES 3\n${fbmGLSL}` : ''}
float stReveal(vec3 d) {
  return max(uKey, uRim * smoothstep(0.42, 0.78, abs(d.x)));
}
// The studio's own softboxes, evaluated in the reflection direction: an overhead box, two front strips,
// a low back strip and a faint camera-side card over dim walls. Edges soften with roughness, so satin
// metal shows real highlight shapes instead of reflecting black between the shared rig's lights.
float stBox(vec3 d, vec3 axis, vec3 u, vec3 v, vec2 halfSize, float soft) {
  float k = dot(d, axis);
  if (k <= 0.05) return 0.0;
  vec2 e = abs(vec2(dot(d, u), dot(d, v)) / k) - halfSize;
  float s = 0.03 + soft * 1.0;
  return (1.0 - smoothstep(-s, s, e.x)) * (1.0 - smoothstep(-s, s, e.y)) * smoothstep(0.05, 0.25, k);
}
vec3 stFill(vec3 d, float soft) {
  float walls = mix(0.04, 0.26, smoothstep(-0.4 - soft * 0.3, 0.15 + soft * 0.2, d.y));
  float top = stBox(d, normalize(vec3(0.0, 1.0, 0.3)), vec3(1.0, 0.0, 0.0), normalize(vec3(0.0, 0.3, -1.0)), vec2(0.95, 0.6), soft);
  float left = stBox(d, normalize(vec3(-1.0, 0.2, 0.45)), vec3(0.0, 1.0, 0.0), normalize(vec3(0.45, 0.0, 1.0)), vec2(0.9, 0.1), soft);
  float right = stBox(d, normalize(vec3(1.0, 0.25, 0.3)), vec3(0.0, 1.0, 0.0), normalize(vec3(-0.3, 0.0, 1.0)), vec2(0.9, 0.07), soft);
  float back = stBox(d, normalize(vec3(0.0, 0.2, -1.0)), vec3(1.0, 0.0, 0.0), normalize(vec3(0.0, 1.0, 0.2)), vec2(1.8, 0.05), soft);
  float card = stBox(d, normalize(vec3(0.0, 0.25, 1.0)), vec3(1.0, 0.0, 0.0), normalize(vec3(0.0, 1.0, -0.25)), vec2(0.7, 0.25), soft);
  return vec3(0.88, 0.91, 0.97) * (walls + top * 2.2 + left * 1.6 + right * 1.0 + back * 1.3 + card * 0.3);
}
`;
    let frag = shader.fragmentShader.replace('#include <common>', `#include <common>\n${fragPars}`);

    frag = frag.replace(
      '#include <clipping_planes_fragment>',
      /* glsl */ `#include <clipping_planes_fragment>
  float stScan = vStPos.y - uScanY;
  if (uClip > 0.5 && stScan > 0.0) discard;
  if (uClip < -0.5 && stScan <= 0.0) discard;
  float stFoot = length(fwidth(vStPos));`,
    );

    let rough = '';
    let normal = '';
    if (finish === 'titanium') {
      rough = /* glsl */ `
  roughnessFactor = clamp(roughnessFactor + fbm(vStPos * 2.5) * 0.06 * (1.0 - smoothstep(0.2, 0.7, stFoot)), 0.05, 1.0);`;
    } else if (finish === 'carbon') {
      rough = /* glsl */ `
  vec3 stCell = floor(vStPos * 5.0);
  float stH = hash13(stCell);
  float stNear = 1.0 - smoothstep(0.08, 0.3, stFoot);
  float stGlint = step(0.975, stH) * stNear * 0.4;
  roughnessFactor = clamp(roughnessFactor + (stH - 0.5) * 0.08 * stNear, 0.3, 1.0);
  roughnessFactor = mix(roughnessFactor, 0.46, stGlint);`;
      normal = /* glsl */ `
  {
    vec3 jit = (hash33(stCell + 7.0) - 0.5) * 0.3 * stGlint;
    float ripple = sin(vStPos.y * 125.66371) * 0.08 * (1.0 - smoothstep(0.012, 0.03, fwidth(vStPos.y)));
    normal = normalize(normal + jit + viewMatrix[1].xyz * ripple);
  }`;
    } else if (finish === 'anodised') {
      rough = /* glsl */ `
  roughnessFactor = vStNormal.y > 0.9 ? 0.18 : roughnessFactor;`;
    }
    frag = frag.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>${rough}`);
    if (normal) frag = frag.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>${normal}`);

    let emissive = '';
    if (finish === 'titanium' || finish === 'carbon' || finish === 'glass' || finish === 'glassFallback') {
      emissive = /* glsl */ `
  {
    float fw = max(fwidth(stScan), 1e-4);
    float line = 1.0 - smoothstep(0.4 - fw, 0.4 + fw, abs(stScan));
    float fresh = uClip > 0.5 ? exp(min(stScan, 0.0) / 1.6) * 0.15 : 0.0;
    totalEmissiveRadiance += ${MOLTEN_HOT} * uBand * (line * 0.9 + fresh);
  }
${rimGLSL(2.6)}`;
    } else if (finish === 'anodised') {
      emissive = /* glsl */ `
  if (vStNormal.y > 0.9) {
    vec3 stW = cameraPosition + (vec4(-vViewPosition, 0.0) * viewMatrix).xyz;
    vec2 stQ = vec2(stW.x / 70.0, (stW.z + 35.0) / 32.0);
    totalEmissiveRadiance += vec3(0.82, 0.88, 1.0) * 0.07 * exp(-dot(stQ, stQ)) * uKey;
  }
  {
    float r = length(vStPos.xz);
    float groove = step(89.0, r) * step(r, 89.95) * (1.0 - smoothstep(0.26, 0.32, abs(vStPos.y - 6.0)));
    totalEmissiveRadiance += ${glslVec(MOLTEN)} * groove * uHair;
  }
${rimGLSL(0.9)}`;
    }
    frag = frag.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${emissive}`);

    frag = frag.replace(
      '#include <lights_fragment_maps>',
      /* glsl */ `#include <lights_fragment_maps>
  {
    vec3 rW = inverseTransformDirection(reflect(-geometryViewDir, geometryNormal), viewMatrix);
    vec3 nW = inverseTransformDirection(geometryNormal, viewMatrix);
    float stK = ${finish === 'anodised' ? 'vStNormal.y > 0.9 ? 0.05 : uFill' : 'uFill'};
    radiance = (radiance * stReveal(rW) + stFill(rW, material.roughness) * stK * uKey) * mix(1.0, vStAO, 0.8);
    iblIrradiance = (iblIrradiance * stReveal(nW) + stFill(nW, 1.0) * PI * uFill * uKey) * vStAO;
  }`,
    );

    if (finish === 'glassFallback') {
      frag = frag.replace(
        '#include <opaque_fragment>',
        /* glsl */ `
  {
    float f = pow(1.0 - saturate(dot(normal, geometryViewDir)), 3.0);
    outgoingLight += f * 0.3 * reflectedLight.indirectSpecular;
    diffuseColor.a = clamp(diffuseColor.a + f * 0.45 + luminance(reflectedLight.indirectSpecular) * 0.3, 0.0, 1.0);
  }
  #include <opaque_fragment>`,
      );
    }
    shader.fragmentShader = frag;
  };
  material.customProgramCacheKey = () => `strata-ch8-${finish}`;
  return { material, clip } satisfies StudioMaterial;
}

const physical = (params: MeshPhysicalMaterialParameters) => new MeshPhysicalMaterial(params);

/** The three part materials (STORYBOARD 3.2), resin with real transmission on high and the fake glass elsewhere. */
export function createPartMaterials(shared: StudioUniforms, quality: Quality): [StudioMaterial, StudioMaterial, StudioMaterial] {
  const titanium = patch(physical({ color: srgb('#8C9096'), metalness: 1, roughness: 0.34, envMapIntensity: 1.5 }), shared, 'titanium', 2.2);
  const carbon = patch(
    physical({ color: srgb('#1B1C20'), metalness: 0, roughness: 0.62, sheen: 0.45, sheenColor: srgb('#3A3F4A'), sheenRoughness: 0.5, envMapIntensity: 1.4 }),
    shared,
    'carbon',
    2,
  );
  const resin =
    quality === 'high'
      ? patch(
          physical({
            color: srgb('#FFFFFF'),
            metalness: 0,
            roughness: 0.05,
            transmission: 1,
            ior: 1.5,
            thickness: 4,
            attenuationColor: srgb('#9FE9FF'),
            attenuationDistance: 120,
            envMapIntensity: 2.4,
          }),
          shared,
          'glass',
          2.6,
        )
      : patch(
          physical({ color: srgb('#0D2A33'), metalness: 0, roughness: 0.06, transparent: true, opacity: 0.32, depthWrite: false }),
          shared,
          'glassFallback',
          1,
        );
  return [titanium, carbon, resin];
}

/**
 * The gyroid infill seen through clear resin: a soft additive cyan glow drawn over the resin, so it stays out of
 * the transmission pre-pass (half-resolution, it read as speckle) and costs one draw instead of two.
 */
export function createInfillMaterial(shared: StudioUniforms) {
  const clip: IUniform<number> = { value: 0 };
  const material = new ShaderMaterial({
    name: 'Ch8Infill',
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uKey: shared.uKey,
      uScanY: shared.uScanY,
      uClip: clip,
      uLine: { value: new Color().setRGB(...linearRGB('resin'), LinearSRGBColorSpace) },
    },
    vertexShader: /* glsl */ `
varying float vY;
varying vec3 vN;
varying vec3 vV;
void main() {
  vY = position.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */ `
uniform float uKey;
uniform float uScanY;
uniform float uClip;
uniform vec3 uLine;
varying float vY;
varying vec3 vN;
varying vec3 vV;
void main() {
  float s = vY - uScanY;
  if (uClip > 0.5 && s > 0.0) discard;
  if (uClip < -0.5 && s <= 0.0) discard;
  float edge = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  gl_FragColor = vec4(uLine * (edge * edge * 0.12 + 0.008) * uKey, 1.0);
}`,
  });
  return { material, clip };
}

/** Black anodised turntable with a glossy top and the molten hairline in the rim groove. */
export function createTurntableMaterial(shared: StudioUniforms) {
  const hair: IUniform<number> = { value: 0.6 };
  const mat = patch(physical({ color: srgb('#16181D'), metalness: 0.6, roughness: 0.42 }), shared, 'anodised', 0.03, { uHair: hair });
  return { ...mat, hair };
}
