import { defineChapter } from '@/strata/story';
import Overlay from './Overlay';

// STORYBOARD Ch8 and 3.4: a cut through darkness, the turntable studio on #0B0F18.
export default defineChapter({
  id: 'object',
  title: 'Object',
  length: { desktop: 3, mobile: 2.5 },
  scene: () => import('./Scene'),
  Overlay,
  enter: { style: 'cut', via: 'dark' },
  stills: [0.25, 0.58, 0.88],
  background: '#0B0F18',
  fx: {
    exposure: 1,
    bloom: { intensity: 0.35, threshold: 0.9, radius: 0.5 },
    grain: 0.03,
    vignette: 0.3,
    dof: { enabled: true, focusDistance: 300, focusRange: 1000, bokehScale: 1.5 },
  },
  camera: { fov: 22, near: 10, far: 40000 },
});
