import { Pass } from 'postprocessing';
import {
  Color,
  DepthTexture,
  HalfFloatType,
  NoBlending,
  ShaderMaterial,
  Uniform,
  Vector2,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { linearRGB } from '@/strata/shaders/palette';

/** 0 single chapter, 1 wipe, 2 crossfade, 3 cut through darkness, 4 cut through a flash. */
export type CompositeMode = 0 | 1 | 2 | 3 | 4;

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

const frag = /* glsl */ `
#include <common>
uniform sampler2D tA;
uniform sampler2D tB;
uniform int mode;
uniform float t;
uniform float seam;
uniform float time;
uniform float pixelRatio;
uniform vec2 resolution;
uniform vec3 molten;
uniform vec3 moltenCore;
varying vec2 vUv;

// The seam (STORYBOARD 3.4): a 2 px molten-core line with a 24 px molten glow at 0.6, sitting exactly on
// the incoming section's top edge. The old layer is shaded just above it so the new one reads as on top.
vec3 wipe(vec3 a, vec3 b) {
  float px = 1.0 / resolution.y;
  float css = px * pixelRatio;
  float y = 1.0 - vUv.y;
  float env = smoothstep(0.0, 0.03, t) * smoothstep(1.0, 0.97, t);
  float d = y - seam;
  float ad = abs(d);

  vec3 col = mix(a, b, smoothstep(-px, px, d));
  col *= 1.0 - step(d, 0.0) * 0.3 * exp(-ad / (css * 10.0)) * env;

  float core = 1.0 - smoothstep(css, css + px, ad);
  float g = ad / (css * 8.0);
  float glow = 0.6 * exp(-0.5 * g * g);
  col += (moltenCore * core * 2.4 + molten * glow) * env;
  return col;
}

void main() {
  vec4 a = texture2D(tA, vUv);
  if (mode == 0) {
    gl_FragColor = a;
  } else {
    vec4 b = texture2D(tB, vUv);
    vec3 c;
    if (mode == 1) {
      c = wipe(a.rgb, b.rgb);
    } else if (mode == 2) {
      c = mix(a.rgb, b.rgb, smoothstep(0.0, 1.0, t));
    } else {
      // Cut at the midpoint, hidden in darkness (mode 3) or inside a short molten flash (mode 4).
      float fadeOut = 1.0 - smoothstep(0.3, 0.5, t);
      float fadeIn = smoothstep(0.5, 0.7, t);
      c = t < 0.5 ? a.rgb * fadeOut * fadeOut : b.rgb * fadeIn * fadeIn;
      if (mode == 4) {
        vec2 v = (vUv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
        float falloff = exp(-dot(v, v) * 5.0);
        c += mix(molten, moltenCore, 0.5) * 2.2 * falloff * exp(-abs(t - 0.5) * 34.0);
      }
    }
    gl_FragColor = vec4(c, 1.0);
  }
  #include <colorspace_fragment>
}
`;

export interface ChapterView {
  scene: Scene;
  camera: PerspectiveCamera;
}

/**
 * Renders the visible chapter(s) into HDR targets and composites them into the post chain.
 * Owns its own (optionally multisampled) scene targets so the composer's ping-pong buffers stay
 * single-sampled and depth-free.
 */
export class ChapterPass extends Pass {
  readonly targetA: WebGLRenderTarget;
  readonly targetB: WebGLRenderTarget;
  a: ChapterView | null = null;
  b: ChapterView | null = null;
  mode: CompositeMode = 0;
  /** Scene-only stats from the last frame. */
  calls = 0;
  triangles = 0;
  private material: ShaderMaterial;

  constructor(samples: number) {
    super('ChapterPass');
    const opts = { type: HalfFloatType, samples, depthBuffer: true, stencilBuffer: false };
    this.targetA = new WebGLRenderTarget(1, 1, { ...opts, depthTexture: new DepthTexture(1, 1) });
    this.targetB = new WebGLRenderTarget(1, 1, opts);
    this.targetA.texture.name = 'Story.ChapterA';
    this.targetB.texture.name = 'Story.ChapterB';
    this.material = new ShaderMaterial({
      name: 'StoryComposite',
      vertexShader: vert,
      fragmentShader: frag,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tA: new Uniform(this.targetA.texture),
        tB: new Uniform(this.targetB.texture),
        mode: new Uniform(0),
        t: new Uniform(0),
        seam: new Uniform(1),
        time: new Uniform(0),
        resolution: new Uniform(new Vector2(1, 1)),
        pixelRatio: new Uniform(1),
        molten: new Uniform(new Color(...linearRGB('molten'))),
        moltenCore: new Uniform(new Color(...linearRGB('molten-core'))),
      },
    });
    this.fullscreenMaterial = this.material;
    this.needsSwap = true;
  }

  get depthTexture() {
    return this.targetA.depthTexture;
  }

  setTransition(t: number, seam: number, time: number) {
    const u = this.material.uniforms;
    u.t.value = t;
    u.seam.value = seam;
    u.time.value = time;
  }

  setPixelRatio(ratio: number) {
    this.material.uniforms.pixelRatio.value = ratio;
  }

  setSize(width: number, height: number) {
    this.targetA.setSize(width, height);
    this.targetB.setSize(width, height);
    this.material.uniforms.resolution.value.set(width, height);
  }

  render(renderer: WebGLRenderer, _input: WebGLRenderTarget, output: WebGLRenderTarget) {
    const { a, b } = this;
    if (!a) return;
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    renderer.setRenderTarget(this.targetA);
    renderer.render(a.scene, a.camera);
    const mode = b ? this.mode : 0;
    if (b && mode !== 0) {
      renderer.setRenderTarget(this.targetB);
      renderer.render(b.scene, b.camera);
    }
    renderer.autoClear = autoClear;
    this.calls = renderer.info.render.calls;
    this.triangles = renderer.info.render.triangles;

    this.material.uniforms.mode.value = mode;
    renderer.setRenderTarget(this.renderToScreen ? null : output);
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.targetA.depthTexture?.dispose();
    super.dispose();
  }
}
