import { Composition } from "remotion";

import { Film } from "./Film.tsx";
import { tl } from "./lib/timeline.ts";

/** One composition, 1920 × 1080 at 30 fps, as long as timeline.json says. Render at --scale=2 for 4K. */
export function Root() {
  return (
    <Composition
      id="Film"
      component={Film}
      durationInFrames={tl.durationInFrames}
      fps={tl.fps}
      width={tl.width}
      height={tl.height}
      defaultProps={{}}
    />
  );
}
