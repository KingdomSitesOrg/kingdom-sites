import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'model',
  title: 'Model',
  length: { desktop: 4, mobile: 3.5 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'crossfade' },
  stills: [0.07, 0.24, 0.44, 0.64, 0.9],
  background: 'bg-0',
  fx: { exposure: 1, bloom: { intensity: 0.7, threshold: 0.82, radius: 0.6 }, grain: 0.04, vignette: 0.35 },
});
