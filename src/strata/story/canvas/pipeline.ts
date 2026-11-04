import { EffectComposer, EffectPass, SMAAEffect, SMAAPreset } from 'postprocessing';
import { HalfFloatType, PerspectiveCamera, Scene, type WebGLRenderer } from 'three';
import { director } from '../director';
import { blendFx, copyFx, createFxPool, SEAM_CA } from '../fx';
import { storyStore } from '../store';
import type { Quality, SlotState } from '../types';
import { ChapterPass, type CompositeMode } from './ChapterPass';
import { FocusEffect, GradeEffect, LensEffect, StoryBloomEffect } from './effects';

const STYLE_MODE = { wipe: 1, crossfade: 2, cut: 3 } as const;

/**
 * The single post chain: ChapterPass (scene render + transition composite) -> one merged pass with
 * lens (haze + CA; not on low), focus (DoF, single chapter or crossfade; high quarter-res blur, medium half
 * that with bokeh <= 3, none on low), bloom (full res on high, half res on medium and low), grade
 * (exposure, AgX, vignette, grain) -> SMAA on medium/low.
 */
export function createPipeline(gl: WebGLRenderer, quality: Quality) {
  const composer = new EffectComposer(gl, {
    frameBufferType: HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
    multisampling: 0,
  });
  // MSAA on high only; at retina ratios the extra pixels already smooth edges, so 2 samples suffice.
  const msaa = quality === 'high' ? (gl.getPixelRatio() >= 1.75 ? 2 : 4) : 0;
  const chapterPass = new ChapterPass(msaa);
  composer.addPass(chapterPass);
  const placeholderCamera = new PerspectiveCamera();

  const low = quality === 'low';
  const lens = low ? null : new LensEffect();
  const bloom = new StoryBloomEffect(quality === 'high' ? 1 : 0.5, {
    mipmapBlur: true,
    intensity: 0.9,
    luminanceThreshold: 0.8,
    luminanceSmoothing: 0.3,
    radius: 0.65,
    levels: quality === 'high' ? 7 : quality === 'medium' ? 6 : 4,
  });
  const grade = new GradeEffect();
  const focus = low ? null : quality === 'high' ? new FocusEffect(0.25, 8) : new FocusEffect(0.125, 3);
  const mainPass = lens && focus
    ? new EffectPass(placeholderCamera, lens, focus, bloom, grade)
    : new EffectPass(placeholderCamera, bloom, grade);
  mainPass.setDepthTexture(chapterPass.depthTexture!);
  composer.addPass(mainPass);

  let smaaPass: EffectPass | null = null;
  if (quality !== 'high') {
    smaaPass = new EffectPass(placeholderCamera, new SMAAEffect({ preset: SMAAPreset.MEDIUM }));
    smaaPass.setDepthTexture(chapterPass.depthTexture!);
    composer.addPass(smaaPass);
  }
  (smaaPass ?? mainPass).dithering = true;

  const fx = createFxPool();
  let firstFrame = true;
  const warmScene = new Scene();

  /** Renders every pass once (focus blur and both targets included) so nothing compiles mid-scroll. */
  function warm(camera: PerspectiveCamera) {
    chapterPass.a = { scene: warmScene, camera };
    chapterPass.b = chapterPass.a;
    chapterPass.mode = 1;
    mainPass.mainCamera = camera;
    focus?.apply({ enabled: true, focusDistance: 6, focusRange: 3, bokehScale: 2 });
    composer.render(0);
  }

  const ready = (i: number): SlotState | null => {
    const s = i >= 0 ? director.slots[i] : undefined;
    return s && s.compiled ? s : null;
  };

  function render(time: number, delta: number) {
    const h = director.handoff;
    let a: SlotState | null;
    let b: SlotState | null = null;
    let mode: CompositeMode = 0;
    const solo = director.solo;
    if (solo !== null) {
      a = ready(solo);
    } else if (h.active) {
      a = ready(h.outgoing);
      b = ready(h.incoming);
      if (a && b) mode = h.style === 'cut' && h.via === 'flash' ? 4 : STYLE_MODE[h.style];
      else if (!a) [a, b] = [b, null];
      else b = null;
    } else {
      a = ready(director.single);
    }
    if (!a) return;
    if (firstFrame) warm(a.camera);

    if (mode) blendFx(director.fx(a.index), director.fx(b!.index), h.t, fx);
    else copyFx(director.fx(a.index), fx);
    if (mode === 1) {
      const s = Math.sin(Math.PI * h.t);
      fx.ca += SEAM_CA * s * s;
    }

    chapterPass.a = a;
    chapterPass.b = b;
    chapterPass.mode = mode;
    chapterPass.setTransition(h.t, h.seam, time);

    if (focus) {
      // DoF runs on single frames and crossfades (both sides share the camera, so the outgoing depth holds);
      // wipes and cuts drop it. A solo render during a handoff stands in for one side and has none.
      const useDof = (mode === 0 || mode === 2) && fx.dof.enabled && !(solo !== null && h.active);
      focus.apply(useDof ? fx.dof : null);
      // Re-assigned every frame on purpose: the setter copies near/far, which chapters may animate.
      if (useDof) mainPass.mainCamera = a.camera;
    }

    bloom.intensity = fx.bloom.intensity;
    bloom.luminanceMaterial.threshold = fx.bloom.threshold;
    bloom.mipmapBlurPass.radius = fx.bloom.radius;
    lens?.apply(fx, time);
    grade.apply(fx, time);

    gl.info.reset();
    composer.render(delta);
    a.drawn++;
    if (b && mode) b.drawn++;

    const st = director.stats;
    st.drawCalls = chapterPass.calls;
    st.triangles = chapterPass.triangles;
    st.geometries = gl.info.memory.geometries;
    st.textures = gl.info.memory.textures;
    st.dpr = gl.getPixelRatio();

    if (firstFrame) {
      firstFrame = false;
      if (storyStore.getState().canvas !== 'ready') storyStore.setState({ canvas: 'ready' });
    }
  }

  return {
    composer,
    chapterPass,
    render,
    setSize(width: number, height: number) {
      composer.setSize(width, height, false);
      chapterPass.setPixelRatio(gl.getPixelRatio());
    },
    dispose() {
      composer.dispose();
    },
  };
}

export type Pipeline = ReturnType<typeof createPipeline>;
