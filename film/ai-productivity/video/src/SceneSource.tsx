// One scene's picture, from what the manifest (scenes.generated.json) says
// exists: the final frames (lossless PNGs, for the render), the clip (H.264,
// lighter, for the review page), the newest draft stills each held from its
// local frame until the next, latest.png held, or a ground-coloured
// placeholder. Inside its <Sequence>, frame 0 is the scene's local frame 1.

import type { ReactNode } from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

import { ARCHIVO } from "./fonts.ts";
import type { SceneEntry, SourceKind } from "./lib/timeline.ts";

export const GROUND = "#F7F1EE";
const INK = "#2B2440";

const pad = (n: number) => String(n).padStart(4, "0");
const fill = { width: "100%", height: "100%", display: "block" } as const;

/** The draft still to show on local frame L: the last one at or before L (the first one before any). */
export function draftFor(stills: { localFrame: number; file: string }[], L: number): string {
  let pick = stills[0].file;
  for (const d of stills) {
    if (d.localFrame <= L) pick = d.file;
    else break;
  }
  return pick;
}

function Note({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute", left: 40, top: 30, padding: "6px 14px", borderRadius: 999, background: "rgba(43,36,64,0.08)",
        fontFamily: ARCHIVO, fontWeight: 600, fontSize: 26, color: INK, opacity: 0.6,
      }}
    >
      {text}
    </div>
  );
}

export function SceneSource({ scene, kind, review }: { scene: SceneEntry; kind: SourceKind; review: boolean }) {
  const L = useCurrentFrame() + 1;
  let body: ReactNode = null;
  if (kind === "frames") {
    body = <Img src={staticFile(`${scene.frames.dir}${pad(L)}.png`)} style={fill} />;
  } else if (kind === "clip" && scene.clip) {
    body = <OffthreadVideo src={staticFile(scene.clip.file)} muted style={fill} />;
  } else if (kind === "drafts" && scene.drafts) {
    body = <Img src={staticFile(draftFor(scene.drafts.stills, L))} style={fill} />;
  } else if (kind === "latest" && scene.latest) {
    body = <Img src={staticFile(scene.latest)} style={fill} />;
  }
  // the review page says what a slot is still waiting for; the render never writes on the picture
  const note = !review ? null : kind === "placeholder" ? `${scene.id} · ${scene.name} · waiting for pictures` : kind === "drafts" || kind === "latest" ? `${scene.id} · draft` : null;
  return (
    <AbsoluteFill style={{ background: GROUND }}>
      {body}
      {note ? <Note text={note} /> : null}
    </AbsoluteFill>
  );
}
