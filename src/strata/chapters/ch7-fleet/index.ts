import { defineChapter } from '@/strata/story';
import { FLEET_FX } from './fx';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'fleet',
  title: 'Fleet',
  length: { desktop: 3.5, mobile: 3 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'crossfade' },
  stills: [0.06, 0.4, 0.84],
  background: 'bg-0',
  fx: { ...FLEET_FX, bloom: { ...FLEET_FX.bloom } },
});
