import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { DURATION, FPS, H, W } from "./lib";

export const Root: React.FC = () => <Composition id="PropertyApp" component={Film} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{ audio: true }} />;
