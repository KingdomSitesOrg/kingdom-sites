// The picture: the scenes on the stop-motion clock, a paper grain that changes every two poses,
// and the one mixed soundtrack.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { C, FONT, SPEED, STEP, q } from "./lib";
import { Picture } from "./scenes";

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.16, pointerEvents: "none" }}>
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(f / (STEP * 4))} />
      <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 1.4 -0.35" />
    </filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>
);

export const Film: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = q(useCurrentFrame() * SPEED);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("font"));
  useEffect(() => {
    loadFont({ family: FONT, url: staticFile("fonts/Archivo-latin-variable.woff2"), weight: "100 900" })
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {ready && <Picture f={f} />}
      <Grain f={f} />
      {audio && <Audio src={staticFile("mix.wav")} />}
    </AbsoluteFill>
  );
};
