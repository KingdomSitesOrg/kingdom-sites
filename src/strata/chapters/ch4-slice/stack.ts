// The slab stack: one draw call, every beat in the vertex shader (fan, snap, lift-off) keyed on aSlice.
import { Color, FrontSide, MeshPhysicalMaterial, Vector2 } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { hashGLSL } from '@/strata/shaders/noise';
import { linearRGB } from '@/strata/shaders/palette';

export const PIVOT = new Vector2(-48, -24);
export const FAN_DEG = { landscape: 62, portrait: 48 } as const;
/** Slabs fill their whole pitch: the cards part when they fan, and a tight stack has no sub-pixel gaps to alias. */
export const FILL = 1;

const vertex = /* glsl */ `
attribute float aSlice;
uniform float uFan;
uniform float uCount;
uniform float uSpacing;
uniform float uFanAngle;
uniform float uGap;
uniform float uGroup;
uniform float uLift;
uniform float uStandIn;
uniform vec2 uPivot;
varying float vY;
varying float vSide;
varying float vIndex;
varying float vPivot;
varying vec3 vWorld;
varying vec3 vWN;

float liftT(float k) { return clamp((uLift - (1.0 - k) * 0.72) / 0.28, 0.0, 1.0); }

void main() {
  float i = uStandIn > 0.5 ? floor(position.y / uSpacing) : aSlice;
  float k = i / max(uCount - 1.0, 1.0);
  // slabs fan in cards of uGroup, so about forty cards separate instead of a hundred-odd hairlines
  float card = floor(i / uGroup);
  float kc = card / max(ceil(uCount / uGroup) - 1.0, 1.0);
  float ang = kc * uFanAngle * uFan;
  float c = cos(ang);
  float s = sin(ang);
  vec3 p = position;
  vec2 d = p.xz - uPivot;
  p.xz = uPivot + vec2(d.x * c + d.y * s, -d.x * s + d.y * c);
  p.y += card * uGap * max(uFan, 0.0);

  // lift-off, top slab first; slab 0 stays
  float lt = liftT(k);
  float le = 1.0 - (1.0 - lt) * (1.0 - lt);
  float keep = max(step(i, 0.5), uStandIn);
  p.y += (1.0 - keep) * (40.0 + i * 0.3) * le;

  vec3 n = normal;
  n.xz = vec2(n.x * c + n.z * s, -n.x * s + n.z * c);
  csm_Position = p;
  csm_Normal = n;
  vY = position.y;
  vSide = 1.0 - abs(normal.y);
  vIndex = i;
  vPivot = length(p.xz - uPivot);
  vWorld = p;
  vWN = n;
}
`;

const fragment = /* glsl */ `
${hashGLSL}
uniform vec3 uTop;
uniform vec3 uSideCol;
uniform vec3 uCyan;
uniform vec3 uMolten;
uniform vec3 uCore;
uniform float uCount;
uniform float uSpacing;
uniform float uFill;
uniform float uStandIn;
uniform float uLine;
uniform float uFlash;
uniform float uEdge;
uniform float uBase;
uniform float uSelf;
uniform float uFade;
uniform float uSeamY;
uniform float uSeamPx;
uniform float uSeam;
varying float vY;
varying float vSide;
varying float vIndex;
varying float vPivot;
varying vec3 vWorld;
varying vec3 vWN;
uniform float uFan;
uniform float uLift;
uniform float uGroup;
uniform float uGap;

float liftT(float k) { return clamp((uLift - (1.0 - k) * 0.72) / 0.28, 0.0, 1.0); }

float bandInt(float x, float a) { return clamp(x, a, 1.0) - a; }

void main() {
  float f = vY / uSpacing;
  float local = (fract(f) - (0.5 - 0.5 * uFill)) / uFill;
#ifdef STACK_FADE
  if (uStandIn > 0.5 && (local < 0.0 || local > 1.0)) discard;
#endif
  float i = uStandIn > 0.5 ? floor(f) : floor(vIndex + 0.5);
  float k = i / max(uCount - 1.0, 1.0);
  // lift-off fade, top slab first; slab 0 stays
#ifdef STACK_FADE
  float lt = i < 0.5 ? 0.0 : liftT(k);
  float vAlpha = 1.0 - smoothstep(0.05, 0.7, lt);
  if (vAlpha * uFade < 0.004) discard;
#else
  // the solid variant (no discard, no blending) keeps the GPU's hidden-surface removal for the tight stack
  float lt = 0.0;
  float vAlpha = 1.0;
#endif

  float tint = 1.0 + 0.06 * (hash11(i * 7.31 + 1.7) * 2.0 - 1.0);
  vec3 warm = mix(vec3(1.06, 1.0, 0.93), vec3(0.97, 1.0, 1.04), k);
  float side = smoothstep(0.35, 0.65, vSide);
  vec3 base = mix(uTop, uSideCol, side) * tint * warm;

  // box-filtered band over the top quarter of each wall: stays a hairline up close, averages out far away
  float w = max(fwidth(local), 1e-4);
  float band0 = uStandIn > 0.5 ? 0.82 : 0.74;
  float edgeRaw = side * (bandInt(local + 0.5 * w, band0) - bandInt(local - 0.5 * w, band0)) / w;
  // level of detail: an edge stays only while its own spacing on screen is wider than ~2.5 px, so the stack never
  // aliases into moire. Every card's top edge outlives the slabs inside it, every fourth card's outlives both.
  float spx = 1.0 / max(fwidth(f), 1e-4);
  float fanOpen = clamp(uFan, 0.0, 1.0);
  float cpx = spx * (uGroup + uGap * fanOpen / uSpacing);
  float slot = mod(i, uGroup);
  float cardTop = step(uGroup - 1.5, slot);
  float major = cardTop * step(2.5, mod(floor(i / uGroup), 4.0));
  float lod = cardTop > 0.5
    ? max(smoothstep(1.8, 3.2, cpx), major * smoothstep(1.8, 3.2, cpx * 4.0))
    : 0.25 * smoothstep(1.8, 3.2, spx);
  float edge = edgeRaw * lod;
  float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 3.0);
  // every fourth card is a major tick, like a ruler; edges brighten toward the top of the deck
  float gain = mix(0.7, 1.3, k) * mix(1.0, 1.8, major);
  // overlapping cards near the pivot shade each other while fanned
  float ao = mix(1.0, 0.45 + 0.55 * smoothstep(8.0, 85.0, vPivot), clamp(uFan, 0.0, 1.0));
  // studio falloff: a pool of light on the part, brighter toward the key above
  float pool = mix(0.6, 1.25, smoothstep(-6.0, 110.0, vWorld.y)) * (1.0 - 0.5 * smoothstep(45.0, 150.0, length(vWorld.xz - vec2(0.0, -10.0))));
  // a soft key from the front-right: as the cards turn, their walls sweep through it
  float key = pow(max(dot(normalize(vWN), normalize(vec3(0.75, 0.25, 0.6))), 0.0), 6.0) * side;
  base *= ao * pool;
  base += vec3(0.16, 0.2, 0.26) * key * pool * clamp(uFan * 1.4, 0.0, 1.0);
  // lifted slabs burn their edges brighter as they fade, so the stack leaves as light
  vec3 em = uCyan * uEdge * edge * gain * mix(1.0, ao, 0.5) * mix(0.8, 1.15, pool) * (1.0 + 3.0 * sin(3.14159 * min(lt * 1.4, 1.0))) + vec3(0.06) * fres * uBase * pool;
  // the molten line travels up the card edges: a hot hairline with a short cooling trail below it
  float band = uLine < 0.0 ? 0.0 : exp(-abs(k - uLine) * 40.0);
  float lead = uLine < 0.0 ? 0.0 : smoothstep(0.0, 0.02, uLine - k) * exp(-(uLine - k) * 9.0);
  float hot = edgeRaw * cardTop;
  em += uMolten * (band * (0.5 + 3.0 * hot) + lead * (0.12 + 0.6 * hot));
  em += uCore * band * band * hot * 2.0;
  em += vec3(3.4, 3.2, 3.0) * uFlash * edge;
  // Entry wipe: slabs the seam has just cut leave it molten and cool to cyan further down.
  float cut = max(uSeamY - gl_FragCoord.y, 0.0) / uSeamPx;
  em += uMolten * exp(-cut * 0.045) * (0.25 + 1.8 * edge) * uSeam;

#ifdef STACK_FADE
  float alpha = vAlpha * uFade;
#else
  float alpha = 1.0;
#endif
  csm_DiffuseColor = vec4(base * uBase, alpha);
  csm_Emissive = (em + base * uBase * uSelf) * alpha;
}
`;

function createStackUniforms() {
  return {
    uFan: { value: 0 },
    uCount: { value: 120 },
    uSpacing: { value: 42 / 120 },
    uFill: { value: FILL },
    uFanAngle: { value: (FAN_DEG.landscape * Math.PI) / 180 },
    uGap: { value: 2.2 },
    uGroup: { value: 3 },
    uLift: { value: 0 },
    uStandIn: { value: 1 },
    uPivot: { value: PIVOT },
    uTop: { value: new Color('#3B4A66') },
    uSideCol: { value: new Color('#1A2233') },
    uCyan: { value: new Color().setRGB(...linearRGB('resin')) },
    uMolten: { value: new Color().setRGB(...linearRGB('molten')) },
    uCore: { value: new Color().setRGB(...linearRGB('molten-core')) },
    uLine: { value: -1 },
    uFlash: { value: 0 },
    uEdge: { value: 0.7 },
    uBase: { value: 1 },
    uSelf: { value: 0.62 },
    uFade: { value: 1 },
    /** The entry wipe's seam in drawing-buffer pixels from the bottom, the device pixel ratio, and its strength. */
    uSeamY: { value: 0 },
    uSeamPx: { value: 1 },
    uSeam: { value: 0 },
  };
}

function createStackVariant(uniforms: ReturnType<typeof createStackUniforms>, fade: boolean) {
  const m = new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    emissive: 0xffffff,
    transparent: fade,
    side: FrontSide,
  });
  if (fade) m.defines = { ...m.defines, STACK_FADE: '' };
  return m;
}

/** Two programs over one uniform set: `solid` for the opaque stack, `fade` for the stand-in and the lift-off. */
export function createStackMaterials() {
  const uniforms = createStackUniforms();
  return { uniforms, solid: createStackVariant(uniforms, false), fade: createStackVariant(uniforms, true) };
}

export type StackMaterials = ReturnType<typeof createStackMaterials>;
