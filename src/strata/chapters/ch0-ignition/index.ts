import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'ignition',
  title: 'Ignition',
  length: { desktop: 3, mobile: 2.5 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'cut' },
  stills: [0.6, 0.98],
  background: 'bg-0',
  fx: {
    exposure: 1,
    bloom: { intensity: 1.1, threshold: 0.78, radius: 0.7 },
    grain: 0.05,
    vignette: 0.45,
    haze: [{ x: 0.5, y: 0.5, radius: 0.04, strength: 0 }],
  },
  camera: { fov: 32, near: 0.5, far: 4000 },
});
