import { defineChapter } from '@/strata/story';
import { MACHINES_FX } from './fx';
import Overlay from './Overlay';

// Lengths, enter style, stills and initial fx: STORYBOARD 6 (Chapter summary) and 3.4.
export default defineChapter({
  id: 'machines',
  title: 'Machines',
  length: { desktop: 5, mobile: 4.5 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'wipe' },
  stills: [0.14, 0.44, 0.57, 0.72, 0.88],
  background: 'bg-0',
  fx: {
    ...MACHINES_FX,
    bloom: { ...MACHINES_FX.bloom },
    haze: [{ x: 0.6, y: 0.5, radius: 0.05, strength: 0 }],
  },
  camera: { fov: 26, near: 0.5, far: 20000 },
});
