"use client";

import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  displayFontReady,
  TIMELINE,
  WordmarkIntro,
} from "../_ui/wordmark-intro";

import { INTRO_SESSION_KEY } from "./intro-script";

/**
 * The opening of the front page: the Farzana logo writes itself while the
 * page rises in around it. Nothing covers the page and nothing waits on it —
 * the visitor can read and scroll from the first moment.
 *
 * On a wide screen it writes itself large — up to three times the bar's logo,
 * as large as the open space above the hero allows — centred in that space.
 * As the diamonds land, the motto writes itself under it, and the two hop
 * together into their place at the start of the top bar. On a phone, or
 * where there is no room above the hero, the logo writes itself straight in
 * the bar and the motto under it there. Scrolling while it writes sends it to
 * the bar at once.
 *
 * The whole thing, on a wide screen (the drawing's own steps are in
 * `TIMELINE`, wordmark-intro.tsx):
 *   0 – 2.05 s     the word writes itself, the light passes, the diamonds land
 *   1.88 – 2.44 s  the motto writes itself under it
 *   2.56 – 3.28 s  the hop into the bar
 * About 3.3 seconds. In the bar on a phone: the drawing, then the bar's motto,
 * done by about 2.5 seconds.
 *
 * It plays once per browser session and never under reduced motion; a
 * returning visitor in the same session sees the finished logo from the start.
 *
 * How: the bar's own logo (`#site-logo`) is hidden while `<html
 * data-intro="play">`; the animated logo is a fixed layer, sized from the two
 * words' own boxes so the swap at the end is invisible, and the motto in it is
 * sized and placed from the bar's own motto the same way. When it is done the
 * state turns `settled` (the motto was written in the layer) or `landed` (the
 * bar's motto writes itself now), the bar's logo shows again underneath, and
 * this layer fades off it and goes. `intro-script.ts` sets `play` before the
 * first paint; the styles are in farzana.css. The headline's column carries
 * `data-hero-content` and the picture beside it `data-hero-picture`, which is
 * how the open space above them is measured.
 */

/** The size it is drawn at before it is scaled. */
const DRAW_WIDTH = 320;
/** How much larger than the bar's logo it is drawn first: up to the most, at least the least. */
const MOST = 3;
const LEAST = 1.8;
const WIDE = "(min-width: 1024px)";
/** The motto starts as the second diamond lands; its 0.56 s is in farzana.css. */
const MOTTO_AT = TIMELINE.diamond2.at + 250;
/** A breath after the motto, then the hop. */
const PAUSE_MS = 120;
/**
 * The hop. Across, up and smaller each on their own curve, so it travels on a
 * slight arc — it lifts first, then glides in — and settles into the bar
 * rather than stopping dead.
 */
const FLY_MS = 720;
const FLY_ACROSS = "cubic-bezier(0.65, 0, 0.25, 1)";
const FLY_UP = "cubic-bezier(0.25, 0, 0.1, 1)";
const FLY_SCALE = "cubic-bezier(0.45, 0, 0.2, 1.04)";
/** The bar's own logo is already showing underneath; the layer fades off it. */
const LEAVE_MS = 180;
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

function rememberPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // Storage blocked (a private window, say): it plays again next visit.
  }
}

type Box = DOMRect;
type Placing = { x: number; y: number; scale: number };
type Mode = "large" | "bar";

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
  /** Large above the hero, or in the bar; null until it has been placed. */
  const [mode, setMode] = useState<Mode | null>(null);
  /** True while the layer fades off the bar's logo, after it has landed. */
  const [leaving, setLeaving] = useState(false);
  // The layer moves on two boxes: the outer one across, the inner one up and
  // smaller, so the hop can take each on its own curve.
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const mottoRef = useRef<HTMLSpanElement>(null);
  /** Set up by the effect below: the diamonds have landed; the motto is written. */
  const onDrawn = useRef<() => void>(() => {});
  const onWritten = useRef<() => void>(() => {});

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let pause = 0;
    let big = false;
    let drawn = false;
    let written = false;
    let flying = false;
    let flown = false;
    let landed = false;
    let now: Placing = { x: 0, y: 0, scale: 1 };

    const put = (placing: Placing) => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      now = placing;
      outer.style.translate = `${placing.x}px 0`;
      inner.style.translate = `0 ${placing.y}px`;
      inner.style.scale = `${placing.scale}`;
    };

    const measure = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      const word = inner?.querySelector("[data-word]");
      const target = document.querySelector("#site-logo [role='img']");
      if (!outer || !inner || !word || !target) return null;
      outer.style.translate = "none";
      inner.style.translate = "none";
      inner.style.scale = "none";
      const from = word.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      put(now);
      if (!from.width || !to.width) return null;
      const barMotto = document.querySelector<HTMLElement>("#site-logo .fz-motto");
      return { from, to, barMotto };
    };

    /** Sizes and places the layer's motto so that, in the bar, it covers the bar's own. */
    const fitMotto = (from: Box, to: Box, barMotto: HTMLElement | null) => {
      const motto = mottoRef.current;
      if (!motto || !barMotto) return;
      const box = barMotto.getBoundingClientRect();
      const bar = inTheBar(from, to);
      const style = getComputedStyle(barMotto);
      motto.style.left = `${(box.left - bar.x) / bar.scale}px`;
      motto.style.top = `${(box.top - bar.y) / bar.scale}px`;
      motto.style.fontSize = `${parseFloat(style.fontSize) / bar.scale}px`;
      motto.style.lineHeight =
        style.lineHeight === "normal"
          ? "normal"
          : `${parseFloat(style.lineHeight) / bar.scale}px`;
    };

    /** The bar's logo shows again underneath, and the layer fades off it. */
    const land = () => {
      if (landed || !drawn || (big && !flown)) return;
      landed = true;
      const outer = outerRef.current;
      setLeaving(true);
      delete document.documentElement.dataset.introLive;
      document.documentElement.dataset.intro = written ? "settled" : "landed";
      if (!outer) return setLeaving(false);
      outer
        .animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: LEAVE_MS,
          easing: "ease-out",
          fill: "forwards",
        })
        .finished.then(() => setLeaving(false))
        .catch(() => setLeaving(false));
    };

    const fly = () => {
      if (!big || flying || flown) return;
      flying = true;
      window.clearTimeout(pause);
      const measured = measure();
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!measured || !outer || !inner) {
        flown = true;
        land();
        return;
      }
      // Sent early by a scroll: a half-written motto would not match the
      // bar's, which writes itself once this lands. It goes.
      if (!written) {
        mottoRef.current?.getAnimations().forEach((animation) => animation.cancel());
      }
      const from = now;
      const end = inTheBar(measured.from, measured.to);
      const timing = (easing: string) => ({
        duration: FLY_MS,
        easing,
        fill: "forwards" as const,
      });
      const hops = [
        outer.animate(
          [{ translate: `${from.x}px 0` }, { translate: `${end.x}px 0` }],
          timing(FLY_ACROSS),
        ),
        inner.animate(
          [{ translate: `0 ${from.y}px` }, { translate: `0 ${end.y}px` }],
          timing(FLY_UP),
        ),
        inner.animate(
          [{ scale: `${from.scale}` }, { scale: `${end.scale}` }],
          timing(FLY_SCALE),
        ),
      ];
      Promise.all(hops.map((hop) => hop.finished))
        .then(() => {
          put(end);
          hops.forEach((hop) => hop.cancel());
          flown = true;
          land();
        })
        .catch(() => {});
    };

    onDrawn.current = () => {
      drawn = true;
      // Large, the motto is already on its way (timed in CSS) and the hop
      // follows it; in the bar, this is the end.
      land();
    };

    onWritten.current = () => {
      written = true;
      if (!flying && !flown) pause = window.setTimeout(fly, PAUSE_MS);
    };

    // On a resize while it writes: placed again, and a window made too short
    // to keep it large sends it to the bar.
    const replace = () => {
      const measured = measure();
      if (!measured || flying) return;
      const { from, to, barMotto } = measured;
      const large =
        big && !flown
          ? aboveTheHero(from, to, barMotto?.getBoundingClientRect() ?? null)
          : null;
      fitMotto(from, to, barMotto);
      put(large ?? inTheBar(from, to));
      if (big && !flown && !large) {
        big = false;
        setMode("bar");
        land();
      }
    };

    // Measured once the display face has loaded, so both words are in the
    // same font.
    displayFontReady().then(() => {
      if (cancelled) return;
      const measured = measure();
      if (!measured) return;
      const { from, to, barMotto } = measured;
      const large = window.matchMedia(WIDE).matches
        ? aboveTheHero(from, to, barMotto?.getBoundingClientRect() ?? null)
        : null;
      big = Boolean(large);
      fitMotto(from, to, barMotto);
      put(large ?? inTheBar(from, to));
      rememberPlayed();
      // From here this layer owns the bar's logo; the pre-paint script's
      // safety timer stands down (intro-script.ts).
      document.documentElement.dataset.introLive = "";
      setMode(big ? "large" : "bar");
    });

    const onScroll = () => {
      if (window.scrollY > 40) fly();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", replace);
    const layer = outerRef.current;
    return () => {
      cancelled = true;
      window.clearTimeout(pause);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", replace);
      // Left mid-drawing for another page: the bar gets its logo back.
      // Checked a moment later, because a development double-run of this
      // effect comes straight back with the layer still in place.
      window.setTimeout(() => {
        const html = document.documentElement;
        if (layer?.isConnected || html.dataset.intro !== "play") return;
        delete html.dataset.introLive;
        html.dataset.intro = "settled";
      }, 0);
    };
  }, [playing]);

  if (!playing && !leaving) return null;

  return (
    // Physical left and a top-left origin on purpose: the sums above are in
    // the screen's own left-to-right coordinates, and the logo never mirrors.
    <div
      ref={outerRef}
      aria-hidden
      dir="ltr"
      data-mode={mode ?? undefined}
      className="pointer-events-none fixed left-0 top-0 z-50"
      style={
        {
          opacity: mode ? 1 : 0,
          "--fz-motto-at": `${MOTTO_AT}ms`,
        } as CSSProperties
      }
    >
      <div ref={innerRef} className="relative origin-top-left" style={{ width: DRAW_WIDTH }}>
        <WordmarkIntro
          className="w-full"
          play={mode !== null}
          onDrawn={() => onDrawn.current()}
        />
        <span
          ref={mottoRef}
          onAnimationEnd={(event) => {
            if (event.animationName === "fz-motto-write") onWritten.current();
          }}
          className="fz-intro-motto absolute font-display font-medium whitespace-nowrap text-heading"
        >
          {MOTTO}
        </span>
      </div>
    </div>
  );
}
