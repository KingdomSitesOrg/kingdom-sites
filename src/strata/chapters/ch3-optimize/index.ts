import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'optimize',
  title: 'Optimize',
  length: { desktop: 3.5, mobile: 3 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'crossfade' },
  stills: [0.05, 0.4, 0.62, 0.82],
  background: 'bg-0',
  fx: { exposure: 1, bloom: { intensity: 0.8, threshold: 0.8, radius: 0.6 }, grain: 0.04, vignette: 0.35 },
});
