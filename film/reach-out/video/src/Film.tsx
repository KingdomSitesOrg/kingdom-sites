// The picture: one canvas of tiles, repainted only when the stop-motion step changes.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { H, W, drawStep, stepOf } from "./scene";
import { INK } from "./tiles";

export const Film: React.FC = () => {
  const step = stepOf(useCurrentFrame());
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d", { alpha: false });
    if (ctx) drawStep(ctx, step);
  }, [step]);
  return (
    <AbsoluteFill style={{ background: INK }}>
      <canvas ref={ref} width={W} height={H} style={{ width: W, height: H, imageRendering: "pixelated" }} />
    </AbsoluteFill>
  );
};
