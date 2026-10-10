"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { WordmarkIntro } from "../_ui/wordmark";

/**
 * The opening of the front page: the Farzana logo writes itself in its own
 * place, at the start of the top bar, while the page rises in beside and below
 * it. Nothing covers the page and nothing waits on it — the visitor can read
 * and scroll from the first moment; the logo is simply still being written.
 *
 * It plays once per browser session, the same session the logo animation
 * itself counts (`WordmarkIntro`), and never under reduced motion. A returning
 * visitor in the same session sees the finished logo from the start.
 *
 * How: the bar's own logo (`#site-logo`) is hidden while `<html
 * data-intro="play">`; the animated logo is laid exactly over it, sized from
 * the two words' own boxes so the swap at the end is invisible; when the second
 * diamond lands, the state turns `landed`, the bar's logo shows again and this
 * one goes. `intro-script.ts` sets `play` before the first paint; the styles
 * are in `home.css`.
 */

/** The size it is drawn at before it is scaled onto the bar's logo. */
const DRAW_WIDTH = 320;

/** Follows `<html data-intro>`: true while the logo is being written. */
function subscribeIntro(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-intro"],
  });
  return () => observer.disconnect();
}

export function LogoIntro() {
  const playing = useSyncExternalStore(
    subscribeIntro,
    () => document.documentElement.dataset.intro === "play",
    () => false,
  );
  const [placed, setPlaced] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  // Lay the drawing over the bar's logo once the display face has loaded, so
  // both words are measured in the same font. The bar is pinned to the top,
  // so a fixed layer stays over it while the page scrolls.
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const place = () => {
      const layer = layerRef.current;
      const word = layer?.querySelector("text");
      const target = document.querySelector("#site-logo [role='img']");
      if (!layer || !word || !target) return;
      layer.style.transform = "none";
      const from = word.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      if (!from.width || !to.width) return;
      const scale = to.width / from.width;
      const x = to.left - from.left * scale;
      const y = to.top + to.height / 2 - (from.top + from.height / 2) * scale;
      layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      setPlaced(true);
    };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(() => {
      if (!cancelled) place();
    });
    window.addEventListener("resize", place);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", place);
    };
  }, [playing]);

  if (!playing) return null;

  return (
    // Physical left and a top-left origin on purpose: the sums above are in
    // the screen's own left-to-right coordinates, and the logo never mirrors.
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 origin-top-left"
      style={{ width: DRAW_WIDTH, opacity: placed ? 1 : 0 }}
    >
      <WordmarkIntro
        className="w-full"
        onFinish={() => {
          // The bar's logo shows again, and this layer goes with it.
          document.documentElement.dataset.intro = "landed";
        }}
      />
    </div>
  );
}
