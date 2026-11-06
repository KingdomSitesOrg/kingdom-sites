// What a scene shows until its builder replaces it: its name, picture note and line.
import { AbsoluteFill } from "remotion";

import { sceneT } from "../kit.tsx";
import { T } from "../ui.tsx";

export function Placeholder({ id }: { id: string }) {
  const s = sceneT(id);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: T.sans, color: T.ink3, fontSize: 30, textAlign: "center", padding: 200 }}>
      <div style={{ fontWeight: 700, color: T.ink2 }}>{s.id} {s.name}</div>
      <div style={{ marginTop: 12 }}>{s.picture}</div>
      <div style={{ marginTop: 24, fontFamily: T.serif, fontSize: 28 }}>&ldquo;{s.voice.text}&rdquo;</div>
    </AbsoluteFill>
  );
}
