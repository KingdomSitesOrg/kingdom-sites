"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { WordmarkIntro } from "../_ui/wordmark";

/**
 * The opening of the front page: the Farzana logo writes itself while the
 * page rises in around it. Nothing covers the page and nothing waits on it —
 * the visitor can read and scroll from the first moment.
 *
 * On a wide screen it writes itself large — three times the bar's logo, or
 * twice if the screen is short — in the open space above the headline, then
 * pops up into its place at the start of the top bar. On a phone, or where
 * there is no room above the headline, it writes itself straight in the bar.
 * Scrolling while it writes sends it to the bar at once.
 *
 * It plays once per browser session, the same session the logo animation
 * itself counts (`WordmarkIntro`), and never under reduced motion. A returning
 * visitor in the same session sees the finished logo from the start.
 *
 * How: the bar's own logo (`#site-logo`) is hidden while `<html
 * data-intro="play">`; the animated logo is a fixed layer, sized from the two
 * words' own boxes so the swap at the end is invisible. When the second
 * diamond has landed (and, if it was drawn large, the layer has flown to the
 * bar), the state turns `landed`, the bar's logo shows again and this one
 * goes. `intro-script.ts` sets `play` before the first paint; the styles are
 * in farzana.css. The headline's column carries `data-hero-content`, which is
 * how the open space above it is measured.
 */

/** The size it is drawn at before it is scaled. */
const DRAW_WIDTH = 320;
/** How much larger than the bar's logo it is drawn first, largest that fits. */
const SIZES = [3, 2];
const WIDE = "(min-width: 1024px)";
/** A beat after the diamonds land, then the hop to the bar: past, then settled. */
const PAUSE_MS = 450;
const FLY_MS = 900;
const FLY_EASE = "cubic-bezier(0.34, 1.32, 0.64, 1)";

/** Follows `<html data-intro>`: true while the logo is being written. */
function subscribeIntro(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-intro"],
  });
  return () => observer.disconnect();
}

type Box = DOMRect;

/** Where the layer goes so the drawn word sits exactly on the bar's logo. */
function inTheBar(from: Box, to: Box) {
  const scale = to.width / from.width;
  const x = to.left - from.left * scale;
  const y = to.top + to.height / 2 - (from.top + from.height / 2) * scale;
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

/**
 * Where the layer goes to draw the word large in the space between the bar
 * and the headline, lined up with the headline's start — or null when that
 * space is too short even at the smaller size.
 */
function aboveTheHeadline(from: Box, to: Box) {
  const bar = document.querySelector("header")?.getBoundingClientRect();
  const content = document
    .querySelector("[data-hero-content]")
    ?.getBoundingClientRect();
  if (!bar || !content) return null;
  const top = bar.bottom;
  const bottom = content.top;
  for (const size of SIZES) {
    const scale = (to.width * size) / from.width;
    // The word's box, plus the diamonds above it and some air.
    if (bottom - top < from.height * scale * 1.35 + 32) continue;
    const x = content.left - from.left * scale;
    const y = (top + bottom) / 2 - (from.top + from.height / 2) * scale;
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }
  return null;
}

export function LogoIntro() {
  const playing = useSyncExternalStore(
    subscribeIntro,
    () => document.documentElement.dataset.intro === "play",
    () => false,
  );
  const [placed, setPlaced] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  /** Called when the second diamond lands; set up by the effect below. */
  const onDrawn = useRef<() => void>(() => {});

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let pause = 0;
    let big = false;
    let drawn = false;
    let flying = false;
    let flown = false;

    const measure = () => {
      const layer = layerRef.current;
      const word = layer?.querySelector("text");
      const target = document.querySelector("#site-logo [role='img']");
      if (!layer || !word || !target) return null;
      const current = layer.style.transform;
      layer.style.transform = "none";
      const from = word.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      layer.style.transform = current;
      if (!from.width || !to.width) return null;
      return { layer, from, to };
    };

    const land = () => {
      if (drawn && (flown || !big)) document.documentElement.dataset.intro = "landed";
    };

    const fly = () => {
      if (!big || flying || flown) return;
      flying = true;
      const measured = measure();
      if (!measured) {
        flown = true;
        land();
        return;
      }
      const { layer, from, to } = measured;
      const end = inTheBar(from, to);
      const animation = layer.animate(
        [{ transform: layer.style.transform }, { transform: end }],
        { duration: FLY_MS, easing: FLY_EASE, fill: "forwards" },
      );
      animation.onfinish = () => {
        layer.style.transform = end;
        animation.cancel();
        flown = true;
        land();
      };
    };

    onDrawn.current = () => {
      drawn = true;
      if (big && !flying && !flown) pause = window.setTimeout(fly, PAUSE_MS);
      else land();
    };

    // Measured once the display face has loaded, so both words are in the
    // same font.
    const place = () => {
      const measured = measure();
      if (!measured || flying) return;
      const { layer, from, to } = measured;
      const large = big && !flown ? aboveTheHeadline(from, to) : null;
      // A window made too short to keep it large: straight to the bar.
      if (big && !flown && !large) {
        big = false;
        land();
      }
      layer.style.transform = large ?? inTheBar(from, to);
    };

    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(() => {
      if (cancelled) return;
      const measured = measure();
      if (!measured) return;
      const { layer, from, to } = measured;
      const large = window.matchMedia(WIDE).matches
        ? aboveTheHeadline(from, to)
        : null;
      big = Boolean(large);
      layer.style.transform = large ?? inTheBar(from, to);
      setPlaced(true);
    });

    const onScroll = () => {
      if (window.scrollY > 40) fly();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      cancelled = true;
      window.clearTimeout(pause);
      window.removeEventListener("scroll", onScroll);
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
      <WordmarkIntro className="w-full" onFinish={() => onDrawn.current()} />
    </div>
  );
}
