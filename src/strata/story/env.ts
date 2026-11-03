import type { Quality } from './types';
import type { StoryState } from './store';

export function readFlags(): StoryState['flags'] {
  const q = new URLSearchParams(window.location.search);
  const quality = q.get('quality');
  return {
    capture: q.get('capture') === '1',
    debug: q.get('debug') === '1',
    forceStatic: q.get('static') === '1',
    forcedQuality: quality === 'high' || quality === 'medium' || quality === 'low' ? (quality as Quality) : null,
  };
}

/** Creates and immediately releases a WebGL2 context. Returns the unmasked renderer, or null without WebGL2. */
export function probeWebGL(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' });
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return renderer || 'unknown';
  } catch {
    return null;
  }
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
