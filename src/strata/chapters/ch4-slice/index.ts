import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'slice',
  title: 'Slice',
  length: { desktop: 3, mobile: 2.5 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'wipe' },
  stills: [0.05, 0.3, 0.9],
  background: 'bg-0',
  fx: { exposure: 1, bloom: { intensity: 1, threshold: 0.75, radius: 0.65 }, grain: 0.04, vignette: 0.4 },
});
