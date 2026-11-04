import { director } from './director';
import { facts } from './facts';
import { parseISODate, toUTCDay } from './quote';
import { storyStore } from './store';

/**
 * Ambient life versus story state (STORYBOARD rules). Story state is a pure function of progress;
 * only ambient life (fans, shimmer, sparks, drips, twinkle, idle turntable) may use time.
 */

/** True under ?capture=1 (deterministic captures). Safe during SSR (false). */
export function isCapture(): boolean {
  const s = storyStore.getState();
  if (s.booted) return s.flags.capture;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('capture') === '1';
}

/**
 * Seconds for ambient motion: the story's wall clock normally, `raw x 8` under capture so the same
 * scroll position always renders the same frame. Pass the chapter's `progress.raw`.
 */
export function ambientTime(raw: number): number {
  return isCapture() ? raw * 8 : director.time;
}

/**
 * Frame-rate independent exponential follow (`lambda` per second). Under capture it snaps to the
 * target: every spring or damped follow is bypassed so stills are deterministic.
 */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  if (isCapture()) return target;
  return target + (current - target) * Math.exp(-lambda * delta);
}

/** The "today" for ship dates: facts.captureToday under capture, else the visitor's calendar day (UTC midnight). */
export function storyToday(): Date {
  return isCapture() ? parseISODate(facts.captureToday) : toUTCDay(new Date());
}
