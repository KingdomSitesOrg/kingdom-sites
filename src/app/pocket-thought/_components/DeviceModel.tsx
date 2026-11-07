"use client";

import { createElement, useEffect, useState } from "react";

// model-viewer's own prebuilt file (three.js inside), served with the page: the npm
// package wants an older three.js than the rest of the site uses.
const MODEL_VIEWER = "/pocket-thought/vendor/model-viewer-4.4.0.min.js";

const DRACO = "/pocket-thought/draco/";

function loadModelViewer(): Promise<unknown> {
  if (!document.querySelector(`script[src="${MODEL_VIEWER}"]`)) {
    // Read by the script as it starts: the Draco decoder comes from this site, not Google's servers.
    const w = window as unknown as { ModelViewerElement?: Record<string, string> };
    w.ModelViewerElement = { ...w.ModelViewerElement, dracoDecoderLocation: DRACO };
    const script = document.createElement("script");
    script.type = "module";
    script.src = MODEL_VIEWER;
    document.head.appendChild(script);
  }
  return customElements.whenDefined("model-viewer");
}

// Interactive 3D model (drag to rotate). The render is the poster until the model loads.
export default function DeviceModel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    loadModelViewer().then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-[#f4f4f5]">
      {ready ? (
        createElement("model-viewer", {
          src: "/pocket-thought/models/pocket-thought.glb",
          poster: "/pocket-thought/renders/01-hero-front-three-quarter-1200.webp",
          alt: "Interactive 3D model of Pocket Thought. Drag to rotate.",
          "camera-controls": "",
          "touch-action": "pan-y",
          "disable-zoom": "",
          "interaction-prompt": "none",
          "camera-orbit": "-25deg 80deg auto",
          "environment-image": "neutral",
          exposure: "1.4",
          "shadow-intensity": "0.6",
          "shadow-softness": "1",
          style: { width: "100%", height: "100%", backgroundColor: "transparent", "--poster-color": "transparent" },
        })
      ) : (
        <img
          src="/pocket-thought/renders/01-hero-front-three-quarter-1200.webp"
          alt=""
          className="h-full w-full object-cover"
        />
      )}
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-[var(--muted)]">
        Drag to rotate
      </p>
    </div>
  );
}
