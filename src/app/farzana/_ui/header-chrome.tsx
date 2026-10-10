"use client";

import { useEffect, useState } from "react";

/**
 * The top bar's backing and its reading line. At the very top of a page the
 * bar sits straight on the Mist ground with no edge; once the page moves under
 * it, a frosted surface and a hairline fade in, and a thin turquoise line along
 * the bottom shows how far down the page the reader is.
 *
 * The frosted surface is its own layer, behind the bar rather than the bar
 * itself. A backdrop-filter re-blurs whenever its own subtree repaints, and a
 * ghost button filling in under the pointer repaints exactly that — which is
 * what made the bar flicker on hover. Off the subtree, the only thing that
 * touches it is the page scrolling under.
 */
export function HeaderChrome() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 8);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden
        data-scrolled={scrolled}
        className="pointer-events-none absolute inset-0 border-b border-transparent bg-transparent transition-colors duration-300 data-[scrolled=true]:border-border data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur-md"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-accent ltr:origin-left rtl:origin-right"
        style={{ transform: `scaleX(${progress})` }}
      />
    </>
  );
}
