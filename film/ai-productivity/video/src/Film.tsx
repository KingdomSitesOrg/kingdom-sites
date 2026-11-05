// Skeleton of the film (phase 0). Each scene's slot shows a placeholder: the
// ground colour, the scene id, and the scene's latest draft still if one
// exists (public/drafts → renders/drafts, file sNN/latest.png). The edit agent
// replaces this with the scene clips, the cursor, the cuts and the fades.

import { AbsoluteFill, getStaticFiles, Img, Sequence, staticFile } from "remotion";

import { ARCHIVO, waitForFonts } from "./fonts.ts";
import { tl, type Scene } from "./lib/timeline.ts";

waitForFonts();

const GROUND = "#F7F1EE";
const INK = "#2B2440";

const hasFile = (name: string): boolean => getStaticFiles().some((f) => f.name === name);

function Placeholder({ scene }: { scene: Scene }) {
  const draft = scene.draft;
  return (
    <AbsoluteFill style={{ background: GROUND }}>
      {hasFile(draft) ? <Img src={staticFile(draft)} style={{ width: "100%", height: "100%" }} /> : null}
      <div
        style={{
          position: "absolute", left: 48, top: 36, fontFamily: ARCHIVO, fontWeight: 600, fontSize: 40,
          color: INK, opacity: 0.55, letterSpacing: 1,
        }}
      >
        {scene.id} · {scene.name}
      </div>
    </AbsoluteFill>
  );
}

export function Film() {
  return (
    <AbsoluteFill style={{ background: GROUND }}>
      {tl.scenes.map((s, i) => {
        // Scene 1 also covers film frame 0 (it holds scene 1's first frame).
        const from = i === 0 ? 0 : s.start;
        const duration = s.end - from + 1;
        return (
          <Sequence key={s.id} from={from} durationInFrames={duration} name={`${s.id} ${s.name}`}>
            <Placeholder scene={s} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
