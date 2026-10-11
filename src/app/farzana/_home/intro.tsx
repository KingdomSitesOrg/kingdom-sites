"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { WordmarkIntro } from "../_ui/wordmark";

/**
 * The opening of the front page: the Farzana logo writes itself while the
 * page rises in around it. Nothing covers the page and nothing waits on it —
 * the visitor can read and scroll from the first moment.
 *
 * On a wide screen it writes itself large — up to three times the bar's logo,
 * as large as the open space above the hero allows — centred in that space.
 * Once the diamonds land, the motto writes itself quickly underneath, and the
 * two pop over together into their place at the start of the top bar. On a
 * phone, or where there is no room above the hero, the logo writes itself
 * straight in the bar and the motto under it there. Scrolling while it writes
 * sends it to the bar at once.
 *
 * It plays once per browser session, the same session the logo animation
 * itself counts (`WordmarkIntro`), and never under reduced motion. A returning
 * visitor in the same session sees the finished logo from the start.
 *
 * How: the bar's own logo (`#site-logo`) is hidden while `<html
 * data-intro="play">`; the animated logo is a fixed layer, sized from the two
 * words' own boxes so the swap at the end is invisible, and the motto in it is
 * sized and placed from the bar's own motto the same way. When it is done the
 * state turns `settled` (the motto was written in the layer) or `landed` (the
 * bar's motto writes itself now), the bar's logo shows again and this layer
 * goes. `intro-script.ts` sets `play` before the first paint; the styles are
 * in farzana.css. The headline's column carries `data-hero-content` and the
 * picture beside it `data-hero-picture`, which is how the open space above
 * them is measured.
 */

/** The size it is drawn at before it is scaled. */
const DRAW_WIDTH = 320;
/** How much larger than the bar's logo it is drawn first: up to the most, at least the least. */
const MOST = 3;
const LEAST = 1.8;
const WIDE = "(min-width: 1024px)";
/** A beat after the motto is written, then the hop to the bar: past, then settled. */
const PAUSE_MS = 350;
const FLY_MS = 900;
const FLY_EASE = "cubic-bezier(0.34, 1.32, 0.64, 1)";
const MOTTO = "Intelligent software, learned students.";

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
type Placing = { x: number; y: number; scale: number };

const css = ({ x, y, scale }: Placing) =>
  `translate(${x}px, ${y}px) scale(${scale})`;

/** Where the layer goes so the drawn word sits exactly on the bar's logo. */
function inTheBar(from: Box, to: Box): Placing {
  const scale = to.width / from.width;
  return {
    x: to.left - from.left * scale,
    y: to.top + to.height / 2 - (from.top + from.height / 2) * scale,
    scale,
  };
}

/**
 * Where the layer goes to draw the word and motto large, centred in the open
 * space between the bar and the hero — above both the headline and the
 * picture beside it, and the card resting on the picture's top edge — as
 * large as fits up to MOST, or null when even LEAST does not fit.
 */
function aboveTheHero(from: Box, to: Box, motto: Box | null): Placing | null {
  const bar = document.querySelector("header")?.getBoundingClientRect();
  const content = document
    .querySelector("[data-hero-content]")
    ?.getBoundingClientRect();
  const picture = document
    .querySelector("[data-hero-picture]")
    ?.getBoundingClientRect();
  if (!bar || !content) return null;
  const top = bar.bottom + 16;
  const bottom = Math.min(content.top, picture ? picture.top - 28 : Infinity) - 16;
  // The block in the bar's own size: the word, and the motto under it.
  const blockTop = to.top - to.height * 0.25;
  const blockBottom = motto ? motto.bottom : to.bottom;
  const blockHeight = blockBottom - blockTop;
  const size = Math.min(MOST, (bottom - top) / blockHeight);
  if (size < LEAST) return null;
  const scale = (to.width * size) / from.width;
  const middle = (top + bottom) / 2;
  // Centre the whole block, word and motto, in the space: down, by the word's
  // place in the block; across, by the wider of the two (the motto starts
  // where the word does, as it does in the bar).
  const wordCentreInBlock = (to.top + to.height / 2 - blockTop) / blockHeight;
  const wordCentre = middle + (wordCentreInBlock - 0.5) * blockHeight * size;
  const inBar = inTheBar(from, to);
  const blockRight = Math.max(
    from.right,
    motto ? (motto.right - inBar.x) / inBar.scale : from.right,
  );
  return {
    x: window.innerWidth / 2 - ((from.left + blockRight) / 2) * scale,
    y: wordCentre - (from.top + from.height / 2) * scale,
    scale,
  };
}

export function LogoIntro() {
  const playing = useSyncExternalStore(
    subscribeIntro,
    () => document.documentElement.dataset.intro === "play",
    () => false,
  );
  const [placed, setPlaced] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const mottoRef = useRef<HTMLSpanElement>(null);
  /** Set up by the effect below: the diamonds have landed; the motto is written. */
  const onDrawn = useRef<() => void>(() => {});
  const onMotto = useRef<() => void>(() => {});

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let pause = 0;
    let big = false;
    let drawn = false;
    let written = false;
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
      const barMotto = document.querySelector<HTMLElement>("#site-logo .fz-motto");
      return { layer, from, to, barMotto };
    };

    /** Sizes and places the layer's motto so that, in the bar, it covers the bar's own. */
    const fitMotto = (from: Box, to: Box, barMotto: HTMLElement | null) => {
      const motto = mottoRef.current;
      if (!motto || !barMotto) return;
      const box = barMotto.getBoundingClientRect();
      const bar = inTheBar(from, to);
      const fontSize = parseFloat(getComputedStyle(barMotto).fontSize);
      motto.style.left = `${(box.left - bar.x) / bar.scale}px`;
      motto.style.top = `${(box.top - bar.y) / bar.scale}px`;
      motto.style.fontSize = `${fontSize / bar.scale}px`;
      motto.style.lineHeight = getComputedStyle(barMotto).lineHeight === "normal"
        ? "normal"
        : `${parseFloat(getComputedStyle(barMotto).lineHeight) / bar.scale}px`;
    };

    const land = () => {
      if (!drawn || (big && !flown)) return;
      document.documentElement.dataset.intro = written ? "settled" : "landed";
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
      const end = css(inTheBar(from, to));
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
      const layer = layerRef.current;
      if (big && !flying && !flown && layer && mottoRef.current) {
        // The motto writes itself under the word; the hop follows it.
        layer.dataset.motto = "write";
      } else if (big && !flying && !flown) {
        pause = window.setTimeout(fly, PAUSE_MS);
      } else {
        land();
      }
    };

    onMotto.current = () => {
      written = true;
      if (!flying && !flown) pause = window.setTimeout(fly, PAUSE_MS);
      else land();
    };

    // Measured once the display face has loaded, so both words are in the
    // same font.
    const place = () => {
      const measured = measure();
      if (!measured || flying) return;
      const { layer, from, to, barMotto } = measured;
      const large =
        big && !flown
          ? aboveTheHero(from, to, barMotto?.getBoundingClientRect() ?? null)
          : null;
      // A window made too short to keep it large: straight to the bar.
      if (big && !flown && !large) {
        big = false;
        land();
      }
      fitMotto(from, to, barMotto);
      layer.style.transform = css(large ?? inTheBar(from, to));
    };

    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(() => {
      if (cancelled) return;
      const measured = measure();
      if (!measured) return;
      const { layer, from, to, barMotto } = measured;
      const large = window.matchMedia(WIDE).matches
        ? aboveTheHero(from, to, barMotto?.getBoundingClientRect() ?? null)
        : null;
      big = Boolean(large);
      if (big) fitMotto(from, to, barMotto);
      layer.style.transform = css(large ?? inTheBar(from, to));
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
      dir="ltr"
      className="pointer-events-none fixed left-0 top-0 z-50 origin-top-left"
      style={{ width: DRAW_WIDTH, opacity: placed ? 1 : 0 }}
    >
      <WordmarkIntro className="w-full" onFinish={() => onDrawn.current()} />
      <span
        ref={mottoRef}
        onAnimationEnd={(event) => {
          if (event.animationName === "fz-motto-ink") onMotto.current();
        }}
        className="fz-intro-motto absolute font-display font-medium whitespace-nowrap text-heading"
      >
        {MOTTO}
      </span>
    </div>
  );
}
