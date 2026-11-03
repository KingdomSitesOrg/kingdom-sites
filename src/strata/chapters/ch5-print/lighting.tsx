'use client';

import { Color, LinearSRGBColorSpace } from 'three';
import { Studio, type StudioFormer } from '@/strata/story/shared/studio';

// The storyboard's product rig (3.3: key softbox, two strip rims, molten accent at 0.15) plus what a dark machine on
// black needs to read: an overhead bank for the top rails, back strips for silhouettes and a low horizon strip that
// draws one clean highlight along every vertical extrusion.
const KEY = new Color().setRGB(0.905, 0.879, 0.838, LinearSRGBColorSpace);

// The horizon strip stays low: at the macro's grazing angle the bed mirrors it, and brighter it turns the PEI tan.
// A side rim behind the hotend gives the heat block, sock and fins an edge against the bed.
const PRINTER_RIG: readonly StudioFormer[] = [
  { color: KEY, intensity: 1.1, position: [0, 9, -2], scale: [9, 3] },
  { color: 'white', intensity: 2.0, position: [-5, 4, -8], scale: [1, 7] },
  { color: 'white', intensity: 2.0, position: [5, 4, -8], scale: [1, 7] },
  { color: 'white', intensity: 1.4, position: [-6, 3, -4], scale: [2, 6] },
  { color: KEY, intensity: 0.45, position: [0, 0.4, 8], scale: [14, 0.35] },
  { color: KEY, intensity: 0.35, position: [3, 3, 9], scale: [8, 4] },
];

export function PrinterStudio() {
  return <Studio accent="molten" extra={PRINTER_RIG} intensity={1.45} />;
}
