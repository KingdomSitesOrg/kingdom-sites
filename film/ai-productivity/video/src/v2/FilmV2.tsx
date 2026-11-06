// The version 2 film: ten flat, real-interface scenes on one warm ground, each
// in its own <Sequence> (so inside a scene useCurrentFrame() is the local,
// 0-based frame), timed by timeline-v2.json. Sound: public/mix-v2.wav when it
// exists (the sound pass writes it), otherwise the ten voice lines on their
// frames. The film ends with a fade to white, then black, over s10's last second.

import { Audio } from "@remotion/media";
import type { ComponentType } from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";

import { TL, clamp } from "./kit.tsx";
import { SCENES } from "./scenes/index.ts";
import { T, useV2Fonts } from "./ui.tsx";

function EndFade() {
  const f = useCurrentFrame();
  const end = TL.durationInFrames;
  const white = interpolate(f, [end - 60, end - 30], [0, 1], clamp);
  const black = interpolate(f, [end - 30, end - 1], [0, 1], clamp);
  return (
    <>
      <AbsoluteFill style={{ background: "#fff", opacity: white }} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </>
  );
}

export function FilmV2({ audio = true, mix = true }: { audio?: boolean; mix?: boolean }) {
  useV2Fonts();
  return (
    <AbsoluteFill style={{ background: T.ground }}>
      {TL.scenes.map((s) => {
        const Scene: ComponentType = SCENES[s.id];
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.length} name={`${s.id} ${s.name}`}>
            <Scene />
          </Sequence>
        );
      })}
      <EndFade />
      {audio && mix ? <Audio src={staticFile("mix-v2.wav")} /> : null}
      {audio && !mix
        ? TL.scenes.map((s) => (
            <Sequence key={`v-${s.id}`} from={s.voice.start} durationInFrames={s.voice.frames + 2}>
              <Audio src={staticFile(s.voice.file)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
}
