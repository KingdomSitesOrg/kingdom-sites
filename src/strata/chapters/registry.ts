import type { ChapterDefinition } from '@/strata/story';
import ignition from './ch0-ignition';
import idea from './ch1-idea';
import model from './ch2-model';
import optimize from './ch3-optimize';
import slice from './ch4-slice';
import print from './ch5-print';
import machines from './ch6-machines';
import fleet from './ch7-fleet';
import object from './ch8-object';

/** Story order. Index in this array = data-chapter = the index every story API uses. */
export const chapters: ChapterDefinition[] = [ignition, idea, model, optimize, slice, print, machines, fleet, object];
