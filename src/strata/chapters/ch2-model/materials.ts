import { AdditiveBlending, Color, MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial, Vector3 } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { easingsGLSL } from '@/strata/shaders/common';
import { simplex3DGLSL } from '@/strata/shaders/noise';
import { linearRGB } from '@/strata/shaders/palette';
import { cloudSpriteGLSL } from '@/strata/story/shared/cloud';
import { FRONT_ORIGIN } from './geometry';

// Storyboard 3.2 material constants (sRGB hex) that have no palette token.
const LOW_A = '#141B2A';
const LOW_B = '#2A3346';
const CLAY = '#9AA3B2';
export const TITANIUM = { color: '#8C9096', metalness: 1, roughness: 0.34, micro: 0.06, microMM: 0.4, env: 1.5 } as const;
export const CLAY_ENV = 0.6;

const srgb = (hex: string) => new Color(hex);
const lin = (token: Parameters<typeof linearRGB>[0]) => new Color(...linearRGB(token));
const HOT = new Color(1.6, 1.55, 1.45);

const frontUniforms = (radius: number) => ({
  uOrigin: { value: new Vector3(...FRONT_ORIGIN) },
  uRadius: { value: radius },
});

const frontGLSL = /* glsl */ `
uniform vec3 uOrigin;
uniform float uRadius;
float frontAt(vec3 p) { return length(p - uOrigin) / uRadius; }
`;

/**
 * The shared cloud, exactly as Ch1 leaves it at uFade = 1. uFade dims the whole cloud (to 25 % while the wire
 * draws), points behind the wire front dim a little further, and the white-hot head fades on its own (uHead).
 */
export function createCloudMaterial(radius: number) {
  return new ShaderMaterial({
    uniforms: {
      ...frontUniforms(radius),
      uSize: { value: 3 },
      uBreath: { value: 1 },
      uFront: { value: 0 },
      uFade: { value: 1 },
      uHead: { value: 1 },
      uColor: { value: lin('resin') },
      uHot: { value: HOT },
    },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uBreath;
      uniform float uFront;
      attribute float aFront;
      varying float vDim;
      varying float vHead;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uBreath;
        float lag = uFront - aFront;
        vDim = mix(1.0, 0.6, smoothstep(0.0, 0.08, lag));
        vHead = lag > 0.0 ? exp(-lag * 45.0) : 0.0;
      }
    `,
    fragmentShader: /* glsl */ `
      ${cloudSpriteGLSL}
      uniform vec3 uColor;
      uniform vec3 uHot;
      uniform float uFade;
      uniform float uHead;
      varying float vDim;
      varying float vHead;
      void main() {
        float h = vHead * 0.8 * uHead;
        float a = cloudSprite(gl_PointCoord) * mix(uFade, 1.0, h);
        if (a < 0.003) discard;
        gl_FragColor = vec4(mix(uColor * vDim, uHot, h) * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/** One bright node per low-poly vertex: white-hot when the front reaches it, then a small cyan dot. */
export function createNodeMaterial(radius: number) {
  return new ShaderMaterial({
    uniforms: {
      ...frontUniforms(radius),
      uSize: { value: 4 },
      uFront: { value: 0 },
      uRefine: { value: 0 },
      uFade: { value: 1 },
      uColor: { value: lin('resin') },
      uHot: { value: HOT },
    },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uFront;
      uniform float uRefine;
      uniform float uFade;
      attribute float aFront;
      varying float vA;
      varying float vHot;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float lag = uFront - aFront;
        float on = step(0.0, lag) * step(uRefine, aFront);
        vHot = on * exp(-max(lag, 0.0) * 30.0);
        vA = on * uFade;
        gl_PointSize = uSize * (1.0 + 1.2 * vHot) * on;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uHot;
      varying float vA;
      varying float vHot;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.2, d) * vA;
        if (a <= 0.0) discard;
        gl_FragColor = vec4(mix(uColor * 1.2, uHot * 1.6, vHot), a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/**
 * Low-poly edges plus the cloud-to-vertex connectors, drawn by a front from the collar top. Behind the refine
 * front the edges stay on as the subdivision cage (uCage), pulled uBias mm toward the camera so they sit on the
 * smooth surface instead of sinking into it.
 */
export function createWireMaterial(radius: number) {
  return new ShaderMaterial({
    uniforms: {
      ...frontUniforms(radius),
      uFront: { value: 0 },
      uRefine: { value: 0 },
      uEdge: { value: 1 },
      uConn: { value: 0.5 },
      uCage: { value: 0 },
      uBias: { value: 1.2 },
      uTime: { value: 0 },
      uColor: { value: lin('resin') },
      uHot: { value: HOT },
    },
    vertexShader: /* glsl */ `
      uniform float uBias;
      attribute float aFront;
      attribute float aKind;
      varying float vFront;
      varying float vKind;
      varying vec3 vObj;
      void main() {
        vFront = aFront;
        vKind = aKind;
        vObj = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        mv.xyz *= 1.0 - uBias / max(length(mv.xyz), uBias * 2.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${frontGLSL}
      uniform float uFront;
      uniform float uRefine;
      uniform float uEdge;
      uniform float uConn;
      uniform float uCage;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uHot;
      varying float vFront;
      varying float vKind;
      varying vec3 vObj;
      void main() {
        float drawn = 1.0 - smoothstep(uFront - 0.04, uFront, vFront);
        float f = frontAt(vObj);
        bool cage = f < uRefine;
        if (drawn <= 0.0 || (cage && (vKind > 0.5 || uCage <= 0.0))) discard;
        float lag = uFront - vFront;
        float head = lag > 0.0 ? exp(-lag * 60.0) * 3.0 : 0.0;
        float k = cage ? uCage : vKind < 0.5 ? uEdge : uConn * mix(1.0, 0.22, smoothstep(0.0, 0.2, lag));
        float pulse = smoothstep(0.92, 1.0, fract(vFront * 6.0 - uTime * 0.18)) * smoothstep(0.1, 0.3, lag);
        k *= 1.0 + 0.6 * pulse;
        float seam = uRefine > 0.0 ? exp(-abs(f - uRefine) * 90.0) : 0.0;
        vec3 col = uColor * k * drawn + uHot * head * k + uHot * seam * uEdge * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/**
 * Low-poly faces: each pops from its centroid once the front has passed it and settles to slate. The cyan flash
 * follows the front across the face, so a large panel glows only along its newest edge.
 */
export function createLowPolyMaterial(radius: number) {
  return new CustomShaderMaterial({
    baseMaterial: MeshStandardMaterial,
    flatShading: true,
    roughness: 0.55,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2,
    uniforms: {
      ...frontUniforms(radius),
      uFaceFront: { value: 0 },
      uRefine: { value: 0 },
      uLowA: { value: srgb(LOW_A) },
      uLowB: { value: srgb(LOW_B) },
      uResin: { value: lin('resin') },
      uHot: { value: HOT },
    },
    vertexShader: /* glsl */ `
      ${easingsGLSL}
      uniform float uFaceFront;
      attribute vec3 aCentroid;
      attribute float aFront;
      varying float vAge;
      varying vec3 vObj;
      void main() {
        float k = clamp((uFaceFront - aFront) / 0.07, 0.0, 1.0);
        float s = k <= 0.0 ? 0.0 : easeOutBack(k);
        csm_Position = aCentroid + (position - aCentroid) * s;
        vAge = uFaceFront - aFront;
        vObj = csm_Position;
      }
    `,
    fragmentShader: /* glsl */ `
      ${frontGLSL}
      uniform float uRefine;
      uniform float uFaceFront;
      uniform vec3 uLowA;
      uniform vec3 uLowB;
      uniform vec3 uResin;
      uniform vec3 uHot;
      varying float vAge;
      varying vec3 vObj;
      void main() {
        float f = frontAt(vObj);
        if (f < uRefine) discard;
        float settle = smoothstep(0.0, 0.3, vAge);
        csm_DiffuseColor = vec4(mix(uLowA, uLowB, settle), 1.0);
        float flash = exp(-max(uFaceFront - f, 0.0) * 22.0);
        float seam = uRefine > 0.0 ? exp(-(f - uRefine) * 110.0) : 0.0;
        csm_Emissive = uResin * flash * 0.35 + uHot * seam * 0.8;
      }
    `,
  });
}

/**
 * The subdivided solid: flat-to-smooth normals, a barycentric wire overlay, then clay to bead-blasted titanium.
 * At uSmooth = 1, uWire = 0, uMat >= 1.2 it is exactly the titanium of STORYBOARD 3.2.
 */
export function createSurfaceMaterial(radius: number) {
  const material = new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    color: srgb(CLAY),
    roughness: 0.8,
    metalness: 0,
    uniforms: {
      ...frontUniforms(radius),
      uRefine: { value: 0 },
      uWire: { value: 0.6 },
      uSmooth: { value: 0 },
      uMat: { value: 0 },
      uClay: { value: srgb(CLAY) },
      uTitan: { value: srgb(TITANIUM.color) },
      uResin: { value: lin('resin') },
      uHot: { value: HOT },
    },
    vertexShader: /* glsl */ `
      varying vec3 vBary;
      varying vec3 vObj;
      void main() {
        int c = gl_VertexID % 3;
        vBary = vec3(c == 0 ? 1.0 : 0.0, c == 1 ? 1.0 : 0.0, c == 2 ? 1.0 : 0.0);
        vObj = position;
      }
    `,
    fragmentShader: /* glsl */ `
      ${simplex3DGLSL}
      ${frontGLSL}
      uniform float uRefine;
      uniform float uWire;
      uniform float uSmooth;
      uniform float uMat;
      uniform vec3 uClay;
      uniform vec3 uTitan;
      uniform vec3 uResin;
      uniform vec3 uHot;
      varying vec3 vBary;
      varying vec3 vObj;
      void main() {
        float f = frontAt(vObj);
        float behind = uRefine - f;
        if (behind < 0.0) discard;

        vec3 nFlat = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        csm_FragNormal = normalize(mix(nFlat, normalize(vNormal), uSmooth));

        // The dense mesh's own wire fades out where its triangles get too small on screen to read as lines.
        vec3 fw = fwidth(vBary);
        vec3 e = smoothstep(vec3(0.0), fw * 0.9, vBary);
        float dense = smoothstep(0.06, 0.16, max(max(fw.x, fw.y), fw.z));
        float wire = (1.0 - min(min(e.x, e.y), e.z)) * uWire * (1.0 - dense);

        float m = 1.0 - smoothstep(uMat - 0.2, uMat, f);
        float micro = 0.0;
        if (m > 0.0) {
          vec3 q = vObj / ${TITANIUM.microMM.toFixed(2)};
          micro = snoise(q) * 0.65 + snoise(q * 2.03 + 17.0) * 0.35;
        }
        vec3 base = mix(uClay, uTitan, m);
        csm_DiffuseColor = vec4(base * (1.0 - wire * 0.4), 1.0);
        csm_Roughness = mix(0.8, ${TITANIUM.roughness.toFixed(2)} + micro * ${TITANIUM.micro.toFixed(2)}, m);
        csm_Metalness = m;

        float seam = uRefine < 1.2 ? exp(-behind * 110.0) : 0.0;
        csm_Emissive = uResin * wire * 0.6 + uHot * seam * 1.1;
      }
    `,
  });
  // CSM extends its base material at runtime; its typing hides the physical properties.
  return material as typeof material & MeshPhysicalMaterial;
}
