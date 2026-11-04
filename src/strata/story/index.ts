/**
 * Public story API for chapter Scenes, chapter Overlays and SaaS sections. Safe to import from DOM
 * code: nothing here pulls three.js into the initial bundle. The Story root itself is imported from
 * '@/strata/story/Story' (it imports the chapter registry, which imports this file).
 */
export { defineChapter } from './defineChapter';
export {
  useChapter,
  useChapterProgress,
  useChapterFx,
  useChapterFrame,
  useChapterCamera,
  useChapterTimeline,
  useQuality,
  usePartQuality,
  useLayout,
  useStoryMode,
  useReducedMotion,
  useViewport,
  useIsPortrait,
  useStoryTick,
} from './hooks';
export { useCameraPath, createCameraPath } from './cameraPath';
export type { CameraApplyOptions, CameraKeyframe, CameraPath, Vec3 } from './cameraPath';
export { facts } from './facts';
export type { Facts } from './facts';
export {
  objects as quoteObjects,
  materials as quoteMaterials,
  OBJECT_KEYS,
  MATERIAL_KEYS,
  QUANTITY,
  clampQuantity,
  discount,
  unitPrice,
  total,
  leadDays,
  shipDate,
  addBusinessDays,
  parseISODate,
  toUTCDay,
  quote,
  formatShipDate,
  formatUSD,
  round2,
} from './quote';
export type { Quote, QuoteMaterial, QuoteObject } from './quote';
export { partStore, usePartStore } from './store';
export type { PartChoiceState, QuotePreset } from './store';
export { handoffPose, boundaryAfter, HANDOFFS } from './boundaries';
export type { Boundary } from './boundaries';
export { applyFraming, poseCamera, clearFraming, createPose, nearFarFor, layoutFor, FRAMING } from './framing';
export type { CameraPose, FramingOptions, Layout, Vec3Like } from './framing';
export { ambientTime, isCapture, damp, storyToday } from './ambient';
export { createAnchors, createBBox, writeAnchor, writeBBox, hideAnchor, hideBBox } from './screen';
export type { Anchors, ScreenSize } from './screen';
export {
  useStoryNav,
  scrollYFor,
  jumpBehindCover,
  focusTarget,
  getStoryChapters,
  useStoryChapters,
  useActiveChapter,
  useStoryOnScreen,
  readStoryPosition,
} from './nav';
export type { StoryNav, StoryChapterInfo, StoryPosition } from './nav';
export { MiniCanvas } from './MiniCanvas';
export type { MiniCanvasContent, MiniCanvasProps } from './MiniCanvas';
export { seededRandom, projectToScreen, clamp, lerp, range } from './math';
export { BUDGETS } from './quality';
export { director as storyDirector } from './director';
export type {
  ChapterDefinition,
  ChapterProgress,
  ChapterFx,
  ChapterFxInit,
  ChapterEnter,
  ChapterFrameCallback,
  EnterStyle,
  HandoffInfo,
  HazeSpot,
  Quality,
  StoryMode,
} from './types';
