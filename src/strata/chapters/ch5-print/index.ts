import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'print',
  title: 'Print',
  length: { desktop: 5, mobile: 4 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'crossfade' },
  stills: [0.16, 0.5, 0.78, 0.97],
  background: 'bg-0',
  fx: {
    exposure: 1.05,
    bloom: { intensity: 1.2, threshold: 0.75, radius: 0.7 },
    grain: 0.05,
    vignette: 0.4,
    haze: [{ x: 0.5, y: 0.5, radius: 0.08, strength: 0 }],
  },
  camera: { fov: 30, near: 1, far: 20000 },
});
