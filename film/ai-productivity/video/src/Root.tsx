import { Composition } from "remotion";

import { Film } from "./Film.tsx";
import { tl } from "./lib/timeline.ts";
import { CHAT_SEND_DURATION, ChatSendFrame } from "./v2/ChatSendFrame.tsx";
import { SlackFrame } from "./v2/SlackFrame.tsx";

/** One composition, 1920 × 1080 at 30 fps, as long as timeline.json says. Render at --scale=2 for 4K. */
export function Root() {
  return (
    <>
      <Composition
        id="Film"
        component={Film}
        durationInFrames={tl.durationInFrames}
        fps={tl.fps}
        width={tl.width}
        height={tl.height}
        defaultProps={{ audio: true, review: false, probe: false }}
      />
      {/* Version 2 look (2026-11-06): style frames for Thomas's OK before the rebuild */}
      <Composition id="V2Slack" component={SlackFrame} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="V2Send" component={ChatSendFrame} durationInFrames={CHAT_SEND_DURATION} fps={30} width={1920} height={1080} />
    </>
  );
}
