// Printer materials (STORYBOARD 3.2). Physical materials patched with onBeforeCompile; every patch carries its
// own program cache key. Colour values are the storyboard's material table, not UI tokens.
import {
  Color,
  LinearSRGBColorSpace,
  Material,
  MeshBasicMaterial,

  MeshStandardMaterial,
  Vector2,
  Vector3,
  Vector4,
  type Texture,
  type IUniform,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { simplex3DGLSL } from '@/strata/shaders/noise';
import { paletteGLSL, linearRGB } from '@/strata/shaders/palette';
import { createPeiTextures } from './pei';
import { BED, type MatKey } from './printer';

const MATERIAL_HEX = {
  alu: '#B7BCC4',
  black: '#16181D',
  steel: '#A1A7B0',
  nozzle: '#5E6168',
  rubber: '#111215',
  sock: '#2A2D33',
  brass: '#B5893F',
  pei: '#2B2620',
  fan: '#0D0E11',
  floor: '#0B0F18',
} as const;

const bumpGLSL = /* glsl */ `
vec3 ch5Bump(vec3 pos, vec3 n, float h) {
  vec3 dpdx = dFdx(pos), dpdy = dFdy(pos);
  float dhdx = dFdx(h), dhdy = dFdy(h);
  vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
  return normalize(abs(det) * n - grad);
}
`;

interface Patch {
  key: string;
  uniforms?: Record<string, IUniform>;
  vertexHead?: string;
  vertexBody?: string;
  vertexNormal?: string;
  fragmentHead?: string;
  color?: string;
  roughness?: string;
  normal?: string;
  emissive?: string;
  output?: string;
}

/** Shared by every printer material: the machine "prints itself" upward behind a molten edge (STORYBOARD Ch5 0.00-0.06). */
const reveal = { uReveal: { value: 1e4 } };

const revealVertex = /* glsl */ `
  {
    vec4 rvw = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      rvw = instanceMatrix * rvw;
    #endif
    vRevealY = (modelMatrix * rvw).y;
  }
`;

function patch<M extends Material>(m: M, p: Patch): M {
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    Object.assign(s.uniforms, reveal, p.uniforms ?? {});
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\nvarying float vRevealY;\n${p.vertexHead ?? ''}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${p.vertexNormal ?? ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${p.vertexBody ?? ''}`)
      .replace('#include <project_vertex>', `${revealVertex}\n#include <project_vertex>`);
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${paletteGLSL}\nuniform float uReveal;\nvarying float vRevealY;\n${p.fragmentHead ?? ''}`,
      )
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (vRevealY > uReveal) discard;')
      .replace('#include <color_fragment>', `#include <color_fragment>\n${p.color ?? ''}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${p.roughness ?? ''}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${p.normal ?? ''}`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n${p.emissive ?? ''}\n  if (uReveal < 1000.0 && vRevealY > 0.4) totalEmissiveRadiance += (PAL_MOLTEN_CORE * 4.0 * (1.0 - smoothstep(0.0, 0.6, uReveal - vRevealY)) + PAL_MOLTEN * 0.8 * (1.0 - smoothstep(0.0, 2.2, uReveal - vRevealY))) * (1.0 - smoothstep(0.55, 0.9, abs(dot(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)))));`,
      )
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${p.output ?? ''}`);
  };
  m.customProgramCacheKey = () => `ch5-${p.key}`;
  return m;
}

const localVaryings = /* glsl */ `
attribute vec4 aAxis;
varying vec3 vLocal;
varying vec4 vAxis;
`;
const localBody = /* glsl */ `
vLocal = position;
vAxis = aAxis;
`;
const localFrag = /* glsl */ `
varying vec3 vLocal;
varying vec4 vAxis;
${simplex3DGLSL}
${bumpGLSL}
`;

export interface PrinterUniforms {
  /** Fan rotation (radians) and blur 0..1. */
  fan: { value: Vector4 };
  /** Belt scroll offsets in mm: left, right, X upper, X lower. */
  belt: { value: Vector4 };
  /** Nozzle tip heat 0..1. */
  tipHeat: { value: number };
  /** Filament tube Bezier control points (world mm). */
  tube: { value: Vector3 }[];
  /** World y below which the machine exists (the reveal front). */
  reveal: { value: number };
  /** Bed brightness 0..1 (it rises out of the dark under Ch4's lines). */
  dim: { value: number };
  /** The molten nozzle as a cheap local light: world position and premultiplied colour. */
  glowPos: { value: Vector3 };
  glowColor: { value: Vector3 };
}

export type PrinterMaterials = Record<MatKey, Material> & {
  link: MeshStandardMaterial;
  tube: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  backdrop: MeshBasicMaterial;
  heater: MeshBasicMaterial;
  uniforms: PrinterUniforms;
  textures: Texture[];
};

function hdr(token: 'molten' | 'molten-core' | 'molten-hot', k: number) {
  const [r, g, b] = linearRGB(token);
  return new Color().setRGB(r * k, g * k, b * k, LinearSRGBColorSpace);
}

export function createPrinterMaterials(): PrinterMaterials {
  const textures: Texture[] = [];
  const uniforms: PrinterUniforms = {
    fan: { value: new Vector4(0, 0.3, 0, 0) },
    belt: { value: new Vector4() },
    tipHeat: { value: 1 },
    tube: [{ value: new Vector3() }, { value: new Vector3() }, { value: new Vector3() }, { value: new Vector3() }],
    reveal: reveal.uReveal,
    dim: { value: 1 },
    glowPos: { value: new Vector3() },
    glowColor: { value: new Vector3() },
  };

  const alu = patch(
    new MeshStandardMaterial({ color: MATERIAL_HEX.alu, metalness: 1, roughness: 0.3 }),
    {
      key: 'alu',
      vertexHead: localVaryings,
      vertexBody: localBody,
      fragmentHead: localFrag,
      roughness: /* glsl */ `
        {
          vec3 ax = normalize(vAxis.xyz);
          float along = dot(vLocal, ax);
          vec3 across = vLocal - ax * along;
          vec2 q = vec2(across.x + across.y * 0.71 + across.z * 0.37, across.y * 0.53 + across.z);
          float fw = length(fwidth(vLocal));
          float fine = snoise(vec3(along * 0.125, q * 5.0)) * (1.0 - smoothstep(0.06, 0.35, fw));
          float coarse = sin(along * 0.19 + sin(q.x * 0.9) * 1.7) * sin(q.y * 1.3 + along * 0.05);
          float n = fine * 0.75 + coarse * 0.35;
          roughnessFactor = clamp(roughnessFactor + n * 0.08, 0.08, 1.0);
          diffuseColor.rgb *= 0.97 + 0.035 * n;
        }
      `,
    },
  );

  // The dark parts take the rig's strips harder, so they read as anodised metal on the dark set instead of holes.
  const black = patch(
    new MeshStandardMaterial({ color: MATERIAL_HEX.black, metalness: 0.6, roughness: 0.42, envMapIntensity: 1.8 }),
    { key: 'black' },
  );

  const steel = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.steel, metalness: 1, roughness: 0.2 }), { key: 'steel' });
  const brass = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.brass, metalness: 1, roughness: 0.32 }), { key: 'brass' });
  const rubber = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.rubber, roughness: 0.78, metalness: 0 }), { key: 'rubber' });
  const sock = patch(
    new MeshStandardMaterial({ color: MATERIAL_HEX.sock, roughness: 0.7, metalness: 0, envMapIntensity: 1.8 }),
    { key: 'sock' },
  );
  const heater = patch(new MeshBasicMaterial({ color: hdr('molten', 2) }), { key: 'heater' });
  const led = patch(new MeshBasicMaterial({ color: new Color().setRGB(2.6, 2.5, 2.35, LinearSRGBColorSpace) }), { key: 'led' });

  // studio backdrop: a soft navy pool behind the machine so its silhouette reads against the void
  const backdrop = new MeshBasicMaterial({ color: '#ffffff' });
  backdrop.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vBack;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBack = position.xy;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${paletteGLSL}\nvarying vec2 vBack;`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
  float r = length((vBack - vec2(0.0, -120.0)) * vec2(0.6, 1.0));
  float pool = (1.0 - smoothstep(80.0, 1200.0, r)) * smoothstep(-900.0, -380.0, vBack.y);
  gl_FragColor.rgb = mix(PAL_BG_0, PAL_BG_2 * 0.75, pool);`,
      );
  };
  backdrop.customProgramCacheKey = () => 'ch5-backdrop';

  const nozzle = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.nozzle, metalness: 1, roughness: 0.3 }), {
    key: 'nozzle',
    uniforms: { uTipHeat: uniforms.tipHeat },
    vertexHead: localVaryings,
    vertexBody: localBody,
    fragmentHead: `${localFrag}\nuniform float uTipHeat;`,
    emissive: /* glsl */ `
      {
        float core = 1.0 - smoothstep(0.0, 0.55, vLocal.y);
        float warm = 1.0 - smoothstep(0.2, 1.6, vLocal.y);
        totalEmissiveRadiance += (PAL_MOLTEN_CORE * 6.0 * core * core + PAL_MOLTEN * 0.9 * warm * warm) * uTipHeat;
      }
    `,
  });

  const peiMaps = createPeiTextures();
  peiMaps.normal.repeat.set(BED.size / 6, BED.size / 6);
  peiMaps.roughness.repeat.copy(peiMaps.normal.repeat);
  const pei = patch(
    new MeshStandardMaterial({
      color: MATERIAL_HEX.pei,
      metalness: 0,
      roughness: 1,
      roughnessMap: peiMaps.roughness,
      normalMap: peiMaps.normal,
      normalScale: new Vector2(0.45, 0.45),
      // the bed fills half the macro frame: lit by the key and the nozzle, not washed tan by the studio
      envMapIntensity: 0.45,
    }),
    {
      key: 'pei',
      uniforms: { uDim: uniforms.dim, uGlowPos: uniforms.glowPos, uGlowColor: uniforms.glowColor },
      vertexHead: 'varying vec2 vPei;\nvarying vec3 vGlowW;',
      vertexBody: 'vPei = position.xz;\nvGlowW = (modelMatrix * vec4(position, 1.0)).xyz;',
      fragmentHead: 'uniform float uDim;\nuniform vec3 uGlowPos;\nuniform vec3 uGlowColor;\nvarying vec2 vPei;\nvarying vec3 vGlowW;',
      color: 'diffuseColor.rgb *= 0.93 + 0.07 * sin(vPei.x * 0.031 + 2.0 * sin(vPei.y * 0.023)) * sin(vPei.y * 0.027 + 1.3);',
      emissive: /* glsl */ `
        vec3 gd = vGlowW - uGlowPos;
        { float gq = 1.0 + dot(gd, gd) * 0.05; totalEmissiveRadiance += diffuseColor.rgb * uGlowColor / (gq * gq); }
      `,
      output: 'gl_FragColor.rgb *= uDim;',
    },
  );
  textures.push(peiMaps.normal, peiMaps.roughness);

  const fan = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.fan, roughness: 0.55, metalness: 0.2 }), {
    key: 'fan',
    uniforms: { uFan: uniforms.fan },
    vertexHead: 'varying vec2 vFanUv;',
    vertexBody: 'vFanUv = uv;',
    fragmentHead: 'varying vec2 vFanUv;\nuniform vec4 uFan;',
    color: /* glsl */ `
      {
        vec2 c = vFanUv - 0.5;
        float r = length(c) * 2.0;
        float a = atan(c.y, c.x) + uFan.x + r * 0.9;
        float v = fract(a * 7.0 / 6.2831853);
        float blur = uFan.y;
        float blade = smoothstep(0.0, blur, v) * (1.0 - smoothstep(0.46, 0.46 + blur, v));
        blade = mix(blade, 0.42, smoothstep(0.15, 0.6, blur));
        float hub = 1.0 - smoothstep(0.3, 0.33, r);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.055, 0.058, 0.066), blade * (1.0 - hub) * step(r, 0.97));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.031, 0.035), hub);
      }
    `,
  });

  const belt = patch(new MeshStandardMaterial({ color: '#141519', roughness: 0.72, metalness: 0 }), {
    key: 'belt',
    uniforms: { uBelt: uniforms.belt },
    vertexHead: `${localVaryings}\nuniform vec4 uBelt;\nvarying vec2 vBelt;`,
    vertexBody: /* glsl */ `
      ${localBody}
      float off = aAxis.w < 0.5 ? uBelt.x : aAxis.w < 1.5 ? uBelt.y : aAxis.w < 2.5 ? uBelt.z : uBelt.w;
      vBelt = vec2(uv.x + off, uv.y);
    `,
    fragmentHead: `${localFrag}\nvarying vec2 vBelt;`,
    color: /* glsl */ `
      {
        float fw = fwidth(vBelt.x);
        float rib = abs(fract(vBelt.x * 0.5) - 0.5) * 2.0;
        diffuseColor.rgb *= 0.8 + 0.4 * smoothstep(0.35, 0.65, rib) * (1.0 - smoothstep(0.3, 1.2, fw));
        float m = 1.0 - smoothstep(0.0, max(fw, 0.05) * 1.5, abs(fract(vBelt.x / 48.0 + 0.5) - 0.5) * 48.0 - 1.2);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.31, 0.33), m * step(0.3, vBelt.y) * step(vBelt.y, 0.7));
      }
    `,
  });

  const link = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.rubber, roughness: 0.62, metalness: 0 }), { key: 'link' });

  const tube = patch(new MeshStandardMaterial({ color: '#1A1C21', roughness: 0.42, metalness: 0 }), {
    key: 'tube',
    uniforms: { uT0: uniforms.tube[0], uT1: uniforms.tube[1], uT2: uniforms.tube[2], uT3: uniforms.tube[3] },
    vertexHead: /* glsl */ `
      uniform vec3 uT0, uT1, uT2, uT3;
      vec3 tubeAt(float t) {
        float s = 1.0 - t;
        return s * s * s * uT0 + 3.0 * s * s * t * uT1 + 3.0 * s * t * t * uT2 + t * t * t * uT3;
      }
      vec3 tubeTan(float t) {
        float s = 1.0 - t;
        return normalize(3.0 * s * s * (uT1 - uT0) + 6.0 * s * t * (uT2 - uT1) + 3.0 * t * t * (uT3 - uT2));
      }
    `,
    vertexNormal: /* glsl */ `
      vec3 tT = tubeTan(position.y);
      vec3 tRef = abs(tT.y) > 0.8 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      vec3 tN = normalize(cross(tRef, tT));
      vec3 tB = cross(tT, tN);
      objectNormal = normalize(tN * normal.x + tB * normal.z);
    `,
    vertexBody: /* glsl */ `transformed = tubeAt(position.y) + tN * position.x + tB * position.z;`,
  });

  const floor = patch(new MeshStandardMaterial({ color: MATERIAL_HEX.floor, roughness: 0.88, metalness: 0 }), {
    key: 'floor',
    vertexHead: 'varying vec2 vFloor;',
    vertexBody: 'vFloor = (modelMatrix * vec4(position, 1.0)).xz;',
    fragmentHead: 'varying vec2 vFloor;',
    output: /* glsl */ `gl_FragColor.rgb = mix(gl_FragColor.rgb, PAL_BG_0, smoothstep(260.0, 1500.0, length(vFloor)));`,
  });

  return { alu, black, steel, nozzle, rubber, sock, brass, pei, heater, led, fan, belt, link, tube, floor, backdrop, uniforms, textures };
}

export function disposePrinterMaterials(m: PrinterMaterials) {
  for (const [k, v] of Object.entries(m)) if (k !== 'uniforms' && k !== 'textures') (v as Material).dispose();
  m.textures.forEach((t) => t.dispose());
}
