import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'idea',
  title: 'Idea',
  length: { desktop: 3, mobile: 2.5 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'crossfade' },
  stills: [0.3, 0.7, 0.97],
  background: 'bg-0',
  fx: { exposure: 1, bloom: { intensity: 0.9, threshold: 0.72, radius: 0.75 }, grain: 0.05, vignette: 0.4 },
});
