// The film: the ten Blender scenes in order at their timeline.json start
// frames (film frame 0 holds scene 1's first frame), the one pointer, the end
// (fade to white, then to black, from s10's beats) and the sound.
// Draw order, top last: scenes → cursor → fades. No subtitles and no words of
// our own: every label is in the Blender pictures.
//
// Which picture each scene shows comes from src/scenes.generated.json
// (tools/scan-scenes.mjs), never from the disk at render time:
//   source "frames" (the default, for the final render): lossless PNG frames,
//                    else the clip, else drafts, else a placeholder
//   source "clips"  (the review page): the clip, else frames, else drafts …
// Pick it with --props='{"source":"clips"}' or REMOTION_FILM_SOURCE=clips.
//
// Sound: one <Audio> at the root playing public/mix.wav (the sound agent's
// master; Remotion does not mix). Until it exists, the voice lines stand in at
// their timeline.json frames.

import { Audio } from "@remotion/media";
import { AbsoluteFill, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";

import { Cursor } from "./Cursor.tsx";
import { Probe } from "./Probe.tsx";
import { GROUND, SceneSource } from "./SceneSource.tsx";
import { waitForFonts } from "./fonts.ts";
import { inOut, progress } from "./lib/ease.ts";
import { FADE, bundledManifest, tl, type Manifest, type SourceKind } from "./lib/timeline.ts";

waitForFonts();

export type FilmProps = {
  source?: "frames" | "clips";
  review?: boolean;
  audio?: boolean;
  probe?: boolean;
  manifest?: Manifest;
};

declare const process: { env: Record<string, string | undefined> };

const envSource = (): "frames" | "clips" | undefined => {
  try {
    const v = process.env.REMOTION_FILM_SOURCE;
    return v === "clips" || v === "frames" ? v : undefined;
  } catch {
    return undefined;
  }
};

/** White from whiteFrom to whiteFull, then black over it to blackFull (the last frame is black). */
function Fades() {
  const f = useCurrentFrame();
  if (!FADE || f < FADE.whiteFrom) return null;
  const white = inOut(progress(f, FADE.whiteFrom, FADE.whiteFull));
  const black = inOut(progress(f, FADE.whiteFull, FADE.blackFull));
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: white }} />
      {black > 0 ? <AbsoluteFill style={{ backgroundColor: "#000000", opacity: black }} /> : null}
    </>
  );
}

function Sound({ manifest }: { manifest: Manifest }) {
  if (manifest.audio.mix) return <Audio src={staticFile("mix.wav")} />;
  return (
    <>
      {manifest.audio.voice
        .filter((v) => v.exists)
        .map((v) => (
          <Sequence key={v.line} from={v.start} name={`voice ${v.line}`} layout="none">
            <Audio src={staticFile(v.file)} />
          </Sequence>
        ))}
    </>
  );
}

export function Film({ source, review = false, audio = true, probe = false, manifest = bundledManifest }: FilmProps) {
  const mode = source ?? envSource() ?? "frames";
  const pick = (id: string): SourceKind => {
    const m = manifest.scenes.find((s) => s.id === id);
    return m ? (mode === "frames" ? m.render : m.review) : "placeholder";
  };
  return (
    <AbsoluteFill data-film-root="" style={{ background: GROUND, overflow: "hidden" }}>
      {tl.scenes.map((s) => {
        const entry = manifest.scenes.find((m) => m.id === s.id);
        if (!entry) return null;
        const kind = pick(s.id);
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.length} name={`${s.id} ${s.name} (${kind})`}>
            <SceneSource scene={entry} kind={kind} review={review} />
          </Sequence>
        );
      })}
      {/* film frame 0 holds scene 1's local frame 1 */}
      {manifest.scenes[0] ? (
        <Sequence from={0} durationInFrames={1} name="s01 frame 0">
          <Freeze frame={0}>
            <SceneSource scene={manifest.scenes[0]} kind={pick(manifest.scenes[0].id)} review={review} />
          </Freeze>
        </Sequence>
      ) : null}
      <Cursor />
      <Fades />
      {probe ? <Probe /> : null}
      {audio ? <Sound manifest={manifest} /> : null}
    </AbsoluteFill>
  );
}
