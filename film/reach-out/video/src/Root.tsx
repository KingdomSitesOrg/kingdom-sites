// The one composition: Reach out (picture only), 1080x1920 at 30 fps, length worked out from the scenes in src/scene.ts.
import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { DURATION_FRAMES, H, T, W } from "./scene";

export const Root: React.FC = () => <Composition id="Mural" component={Film} durationInFrames={DURATION_FRAMES} fps={T.fps} width={W} height={H} />;
