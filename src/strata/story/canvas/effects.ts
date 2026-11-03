import { BloomEffect, Effect, EffectAttribute, KawaseBlurPass, KernelSize } from 'postprocessing';
import { Uniform, Vector4, WebGLRenderTarget, type TextureDataType, type WebGLRenderer } from 'three';
import { MAX_HAZE } from '../fx';
import type { ChapterFx } from '../types';

// Kept branch-light on purpose: ANGLE's Metal backend does not skip noise inside loops cheaply, so
// the haze is one uniform-gated block with an analytic shimmer instead of per-spot simplex noise.
const lensFrag = /* glsl */ `
uniform float ca;
uniform float seed;
uniform float hazeOn;
uniform vec4 spots[${MAX_HAZE}];

float spotWeight(vec4 s, vec2 uv) {
  vec2 d = (uv - s.xy) * vec2(aspect, 1.0);
  float r = clamp(length(d) / max(s.z, 1e-3), 0.0, 1.0);
  // Strongest just above the source: heat rises.
  return (1.0 - r) * (1.0 - r) * smoothstep(-0.6, 0.4, d.y / max(s.z, 1e-3) + 0.2) * s.w;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 st = uv;
  if (hazeOn > 0.5) {
    float w = spotWeight(spots[0], uv) + spotWeight(spots[1], uv) + spotWeight(spots[2], uv) + spotWeight(spots[3], uv);
    vec2 q = uv * vec2(aspect, 1.0) * 70.0;
    float t = seed * 6.0;
    vec2 wobble = vec2(
      sin(q.y * 1.13 - t * 1.7 + sin(q.x * 0.71 + t * 0.6) * 1.8),
      sin(q.x * 0.93 + t * 1.3 + sin(q.y * 0.87 - t * 0.9) * 1.8));
    st += wobble * w * 0.0035;
  }
  if (ca > 0.001) {
    vec2 dir = (st - 0.5) * vec2(aspect, 1.0);
    vec2 shift = dir * dot(dir, dir) * ca * 0.02 / vec2(aspect, 1.0);
    outputColor = vec4(
      texture2D(inputBuffer, st + shift).r,
      texture2D(inputBuffer, st).g,
      texture2D(inputBuffer, st - shift).b,
      inputColor.a);
  } else if (hazeOn > 0.5) {
    outputColor = texture2D(inputBuffer, st);
  } else {
    outputColor = inputColor;
  }
}
`;

/** Heat-haze distortion plus radial chromatic aberration in one convolution effect. */
export class LensEffect extends Effect {
  private spots: Vector4[];

  constructor() {
    const spots = Array.from({ length: MAX_HAZE }, () => new Vector4());
    super('LensEffect', lensFrag, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['ca', new Uniform(0)],
        ['seed', new Uniform(0)],
        ['hazeOn', new Uniform(0)],
        ['spots', new Uniform(spots)],
      ]),
    });
    this.spots = spots;
  }

  apply(fx: ChapterFx, time: number) {
    this.uniforms.get('ca')!.value = fx.ca;
    this.uniforms.get('seed')!.value = time;
    let on = 0;
    for (let i = 0; i < MAX_HAZE; i++) {
      const h = fx.haze[i];
      if (h && h.strength > 0) {
        this.spots[i].set(h.x, 1 - h.y, Math.max(0.001, h.radius), h.strength);
        on = 1;
      } else this.spots[i].set(0, 0, 1, 0);
    }
    this.uniforms.get('hazeOn')!.value = on;
  }
}

const focusFrag = /* glsl */ `
uniform sampler2D blurBuffer;
uniform float focusDistance;
uniform float focusRange;
uniform float strength;

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (strength <= 0.0) {
    outputColor = inputColor;
    return;
  }
  float dist = -getViewZ(depth);
  float coc = clamp((abs(dist - focusDistance) - 0.5 * focusRange) / max(focusRange, 1e-3), 0.0, 1.0);
  coc = coc * coc * (3.0 - 2.0 * coc) * strength;
  outputColor = vec4(mix(inputColor.rgb, texture2D(blurBuffer, uv).rgb, coc), inputColor.a);
}
`;

/**
 * Depth of field that fits the frame budget at retina sizes: one low-resolution Kawase blur of the
 * frame, mixed back in by a depth-based circle of confusion inside the merged main pass. The blur runs
 * only while a chapter has fx.dof enabled.
 */
export class FocusEffect extends Effect {
  private blurPass: KawaseBlurPass;
  private target: WebGLRenderTarget;
  private maxBokeh: number;
  active = false;

  constructor(resolutionScale: number, maxBokeh: number) {
    const target = new WebGLRenderTarget(1, 1, { depthBuffer: false });
    target.texture.name = 'Story.Focus';
    super('FocusEffect', focusFrag, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ['blurBuffer', new Uniform(target.texture)],
        ['focusDistance', new Uniform(6)],
        ['focusRange', new Uniform(3)],
        ['strength', new Uniform(0)],
      ]),
    });
    this.target = target;
    this.maxBokeh = maxBokeh;
    this.blurPass = new KawaseBlurPass({ kernelSize: KernelSize.LARGE, resolutionScale });
  }

  /** bokehScale ramps the blur in: 0 is sharp, full strength from 1.5 up (so a 0 -> 4 ramp never pops). */
  apply(dof: { enabled: boolean; focusDistance: number; focusRange: number; bokehScale: number } | null) {
    const bokeh = dof && dof.enabled ? Math.min(dof.bokehScale, this.maxBokeh) : 0;
    this.active = bokeh > 0.001;
    this.uniforms.get('strength')!.value = this.active ? Math.min(1, bokeh / 1.5) : 0;
    if (!dof || !this.active) return;
    this.uniforms.get('focusDistance')!.value = dof.focusDistance;
    this.uniforms.get('focusRange')!.value = dof.focusRange;
    this.blurPass.scale = Math.max(0.25, bokeh * 0.5);
  }

  initialize(renderer: WebGLRenderer, alpha: boolean, frameBufferType: number) {
    this.blurPass.initialize(renderer, alpha, frameBufferType);
    this.target.texture.type = frameBufferType as TextureDataType;
  }

  update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget) {
    if (this.active) this.blurPass.render(renderer, inputBuffer, this.target);
  }

  setSize(width: number, height: number) {
    this.blurPass.setSize(width, height);
    this.target.setSize(this.blurPass.resolution.width, this.blurPass.resolution.height);
  }

  dispose() {
    this.blurPass.dispose();
    this.target.dispose();
    super.dispose();
  }
}

const gradeFrag = /* glsl */ `
uniform float exposure;
uniform float vignette;
uniform float grain;
uniform float seed;

const mat3 SRGB_TO_REC2020 = mat3(
  vec3(0.6274, 0.0691, 0.0164),
  vec3(0.3293, 0.9195, 0.0880),
  vec3(0.0433, 0.0113, 0.8956));
const mat3 REC2020_TO_SRGB = mat3(
  vec3(1.6605, -0.1246, -0.0182),
  vec3(-0.5876, 1.1329, -0.1006),
  vec3(-0.0728, -0.0083, 1.1187));
const mat3 AGX_INSET = mat3(
  vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
  vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
  vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
const mat3 AGX_OUTSET = mat3(
  vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
  vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
  vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));

vec3 agxContrast(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}

// AgX (Blender / Filament) with a "punchy" look: hot emissives roll off to white-gold instead of clipping orange.
vec3 agx(vec3 c) {
  c = AGX_INSET * (SRGB_TO_REC2020 * c);
  c = clamp((log2(max(c, 1e-10)) + 12.47393) / 16.499999, 0.0, 1.0);
  c = agxContrast(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = l + 1.18 * (c - l);
  c = pow(max(c, 0.0), vec3(1.06));
  c = AGX_OUTSET * c;
  c = pow(max(c, 0.0), vec3(2.2));
  return clamp(REC2020_TO_SRGB * c, 0.0, 1.0);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = agx(inputColor.rgb * exposure);
  vec2 v = (uv - 0.5) * vec2(aspect, 1.0);
  c *= 1.0 - vignette * smoothstep(0.25, 1.1, length(v) * 1.15);
  // Grain in perceptual space so it reads evenly in the shadows.
  vec3 g = pow(c, vec3(1.0 / 2.2));
  float n = grainHash(uv * resolution + fract(seed * 7.31) * 517.0) + grainHash(uv * resolution * 0.5 + 91.7 + fract(seed * 3.17) * 211.0) - 1.0;
  float lum = dot(g, vec3(0.2126, 0.7152, 0.0722));
  g += n * grain * 0.3 * (1.0 - 0.6 * lum);
  outputColor = vec4(pow(max(g, 0.0), vec3(2.2)), inputColor.a);
}
`;

/** Exposure, AgX tone mapping, vignette and film grain. The renderer itself uses NoToneMapping. */
export class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', gradeFrag, {
      uniforms: new Map<string, Uniform>([
        ['exposure', new Uniform(1)],
        ['vignette', new Uniform(0.4)],
        ['grain', new Uniform(0.3)],
        ['seed', new Uniform(0)],
      ]),
    });
  }

  apply(fx: ChapterFx, time: number) {
    this.uniforms.get('exposure')!.value = fx.exposure;
    this.uniforms.get('vignette')!.value = fx.vignette;
    this.uniforms.get('grain')!.value = fx.grain;
    this.uniforms.get('seed')!.value = time;
  }
}

/** Mipmap bloom whose luminance and blur chain run at `scale` of the frame (0.5 on medium and low). */
export class StoryBloomEffect extends BloomEffect {
  private scale: number;

  constructor(scale: number, options: ConstructorParameters<typeof BloomEffect>[0]) {
    super(options);
    this.scale = scale;
  }

  setSize(width: number, height: number) {
    if (this.scale === 1) {
      super.setSize(width, height);
      return;
    }
    const w = Math.max(1, Math.round(width * this.scale));
    const h = Math.max(1, Math.round(height * this.scale));
    this.luminancePass.setSize(w, h);
    this.mipmapBlurPass.setSize(w, h);
  }
}
