'use client';

import 'lenis/dist/lenis.css';
import { Component, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { chapters } from '@/strata/chapters/registry';
import { ChapterSection } from './ChapterSection';
import { DebugPanel } from './DebugPanel';
import { director } from './director';
import { prefersReducedMotion, probeWebGL, readFlags } from './env';
import { JumpCover } from './JumpCover';
import { installAnchorNavigation } from './nav';
import { detectQuality, dprCap } from './quality';
import { storyStore, useStoryStore, type StillsManifest, type StoryState } from './store';
import { installTestHooks } from './testHooks';

gsap.registerPlugin(ScrollTrigger);
director.setChapters(chapters);

const StoryCanvas = dynamic(() => import('./canvas/StoryCanvas'), { ssr: false });

const EMPTY_MANIFEST: StillsManifest = { version: 1, chapters: {} };

/**
 * The story root: every chapter section in order, the lazily loaded shared canvas behind them, and
 * the director (Lenis + progress) that drives both. Import it from '@/strata/story/Story'.
 */
export function Story() {
  const mode = useStoryStore((s) => s.mode);
  const canvas = useStoryStore((s) => s.canvas);
  const booted = useStoryStore((s) => s.booted);
  const debug = useStoryStore((s) => s.flags.debug);
  const capture = useStoryStore((s) => s.flags.capture);

  useEffect(() => exposeTierOnRoot(), []);
  useEffect(() => installAnchorNavigation(), []);

  useEffect(() => {
    const flags = readFlags();
    const reduced = prefersReducedMotion();
    const renderer = flags.forceStatic || reduced ? null : probeWebGL();
    const nav = navigator as Navigator & { deviceMemory?: number };
    const detected = detectQuality({
      renderer: renderer ?? '',
      memory: nav.deviceMemory,
      cores: nav.hardwareConcurrency || 4,
      coarse: window.matchMedia('(pointer: coarse)').matches,
      width: window.innerWidth,
    });
    const quality = flags.forcedQuality ?? detected;
    storyStore.setState({
      flags,
      reducedMotion: reduced,
      mode: renderer ? 'webgl' : 'static',
      quality,
      qualityCeiling: quality,
      dpr: dprCap(quality, window.devicePixelRatio || 1),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      booted: true,
    });
    ScrollTrigger.config({ ignoreMobileResize: true });
    director.start();

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => {
      if (mq.matches) storyStore.setState({ reducedMotion: true, mode: 'static' });
    };
    mq.addEventListener('change', onMotion);
    const removeHooks = flags.capture || flags.debug ? installTestHooks() : undefined;
    return () => {
      mq.removeEventListener('change', onMotion);
      removeHooks?.();
      director.stop();
    };
  }, []);

  useEffect(() => {
    if (!booted || mode !== 'webgl' || capture) return;
    // Same-page anchors are handled by installAnchorNavigation (focus moves to the target heading).
    const lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    director.lenis = lenis;
    return () => {
      director.lenis = null;
      lenis.destroy();
    };
  }, [booted, mode, capture]);

  useEffect(() => {
    if (!booted || mode !== 'webgl' || canvas !== 'idle') return;
    const request = () => {
      if (storyStore.getState().canvas === 'idle') storyStore.setState({ canvas: 'requested' });
    };
    if (capture) {
      request();
      return;
    }
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    for (const e of events) window.addEventListener(e, request, { passive: true, once: true });
    let timer = 0;
    let idle = 0;
    const arm = () => {
      timer = window.setTimeout(() => {
        idle = window.requestIdleCallback ? window.requestIdleCallback(request, { timeout: 800 }) : 0;
        if (!window.requestIdleCallback) request();
      }, 2500);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      for (const e of events) window.removeEventListener(e, request);
      window.removeEventListener('load', arm);
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, [booted, mode, canvas, capture]);

  useEffect(() => {
    if (!booted || mode !== 'static' || storyStore.getState().stills) return;
    let alive = true;
    fetch('/strata/stills/manifest.json')
      .then((r) => (r.ok ? (r.json() as Promise<StillsManifest>) : EMPTY_MANIFEST))
      .catch(() => EMPTY_MANIFEST)
      .then((m) => {
        if (alive) storyStore.setState({ stills: m?.chapters ? m : EMPTY_MANIFEST });
      });
    return () => {
      alive = false;
    };
  }, [booted, mode]);

  return (
    <>
      <div
        data-story
        data-mode={mode}
        data-canvas={canvas}
        className="group/story relative isolate w-full"
        style={{ backgroundColor: chapters[0].background }}
      >
        {booted && mode === 'webgl' && canvas !== 'idle' && (
          <CanvasBoundary>
            <StoryCanvas chapters={chapters} />
          </CanvasBoundary>
        )}
        {chapters.map((def, i) => (
          <ChapterSection key={def.id} def={def} index={i} />
        ))}
      </div>
      {/* Outside the isolated story layer so they cover everything, SaaS included. */}
      <JumpCover />
      {debug && <DebugPanel />}
    </>
  );
}

/**
 * A canvas that fails (its chunk does not load, a scene throws) must never take the page down: drop to static
 * mode, which shows the stills or plates behind the same DOM copy.
 */
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[strata] canvas failed, switching to static mode', error);
    storyStore.setState({ mode: 'static', canvas: 'idle' });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Mirrors the live tier and mode onto <html data-quality data-mode> so CSS can switch (the copy panel
 * drops its blur on low and in static mode). Attributes appear after boot and follow adaptive changes.
 */
function exposeTierOnRoot() {
  const root = document.documentElement;
  const apply = (s: StoryState) => {
    if (!s.booted) return;
    if (root.dataset.quality !== s.quality) root.dataset.quality = s.quality;
    if (root.dataset.mode !== s.mode) root.dataset.mode = s.mode;
  };
  apply(storyStore.getState());
  const unsubscribe = storyStore.subscribe(apply);
  return () => {
    unsubscribe();
    delete root.dataset.quality;
    delete root.dataset.mode;
  };
}
