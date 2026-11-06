// The scene registry for the version 2 film. Each scene file (sNN.tsx) exports
// one component, drawn inside its <Sequence>, so useCurrentFrame() is local and
// 0-based. Its sounds go in video/timeline/cues-v2/sNN.json as
// [{ "frame": <local frame>, "sound": "<name in audio/foley>", "gain": <dB, optional>, "pan": <-1..1, optional>, "note": "..." }].

import type { ComponentType } from "react";

import { S01 } from "./s01.tsx";
import { S02 } from "./s02.tsx";
import { S03 } from "./s03.tsx";
import { S04 } from "./s04.tsx";
import { S05 } from "./s05.tsx";
import { S06 } from "./s06.tsx";
import { S07 } from "./s07.tsx";
import { S08 } from "./s08.tsx";
import { S09 } from "./s09.tsx";
import { S10 } from "./s10.tsx";

export const SCENES: Record<string, ComponentType> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07, s08: S08, s09: S09, s10: S10,
};
