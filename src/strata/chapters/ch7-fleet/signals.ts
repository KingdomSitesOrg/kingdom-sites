import { facts } from '@/strata/story';

/**
 * Scene -> Overlay channel: written inside useChapterFrame, read by HUD getters. Plain numbers only.
 * The initial values are what static mode starts from.
 */
export const signals = {
  /** PARTS PRINTED TODAY: [S] story value plus the [T] wall-clock ticks. */
  partsToday: facts.partsTodayBase as number,
  /** ACTIVE MACHINES: jitter around facts.fleet.active, then the lights-out count. */
  active: facts.fleet.active as number,
  /** Completion flashes seen so far (story schedule). */
  flashCount: 0,
  /** The hero window on screen (CSS px) and whether the last-light leader shows (0..1). */
  heroX: 0,
  heroY: 0,
  heroLead: 0,
};
