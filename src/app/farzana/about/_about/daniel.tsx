"use client";

import { type RefObject, useEffect, useRef } from "react";

import { useReducedMotion } from "../../_home/motion";
import { Reveal, SectionIntro, vars } from "../../_home/shared";
import { Diamond } from "../../_ui/diamond";

/**
 * The story of Daniel, told in four beats from the King James text: carried
 * to Babylon, three years of study in a new language, knowledge given by God,
 * and Daniel's praise of the One who gives wisdom — the verse at the foot of
 * every Farzana page. As the page scrolls, a line fills down the beats and
 * each one lights as the line reaches it.
 */

const BEATS = [
  {
    reference: "Daniel 1:3–4",
    title: "Taken to Babylon",
    quote: "…whom they might teach the learning and the tongue of the Chaldeans.",
  },
  {
    reference: "Daniel 1:5",
    title: "Three years of study",
    quote:
      "…so nourishing them three years, that at the end thereof they might stand before the king.",
  },
  {
    reference: "Daniel 1:17",
    title: "God gave the understanding",
    quote:
      "As for these four children, God gave them knowledge and skill in all learning and wisdom.",
  },
  {
    reference: "Daniel 2:20–21",
    title: "The giver of wisdom",
    quote:
      "Blessed be the name of God for ever and ever: for wisdom and might are his… he giveth wisdom unto the wise, and knowledge to them that know understanding.",
  },
];

export function Daniel() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  useReadingProgress(listRef, !reduced);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <SectionIntro
            align="start"
            eyebrow="The story of Daniel"
            title="Learning is hard work. Wisdom is a gift."
          >
            As a young man, Daniel was carried off to Babylon and made to learn
            a new language and a whole new literature. He studied for three
            years, and he knew where his understanding came from.
          </SectionIntro>
          <Reveal delay={100}>
            <p className="max-w-md text-pretty text-muted">
              Farzana means learned. It takes the busywork off the teacher, so
              more of the week goes to the learning itself.
            </p>
          </Reveal>
        </div>

        <ol
          ref={listRef}
          className="relative flex flex-col gap-12 ps-10"
          style={reduced ? vars({ "--p": 1 }) : undefined}
        >
          {/* The track, and the line that fills down it. */}
          <span aria-hidden className="absolute start-[11px] top-2 bottom-2 w-0.5 rounded-full bg-border">
            <span className="fz-timeline-fill absolute inset-0 rounded-full bg-accent" />
          </span>
          {BEATS.map((beat, index) => (
            <li
              key={beat.reference}
              className="fz-beat relative flex flex-col gap-2"
              style={vars({ "--at": index / BEATS.length })}
            >
              <span aria-hidden className="fz-beat-mark absolute -start-10 top-0.5 flex size-6 items-center justify-center rounded-full bg-background">
                <Diamond size={14} />
              </span>
              <p className="text-caption font-medium text-primary">{beat.reference}</p>
              <h3 className="text-balance">{beat.title}</h3>
              <blockquote className="max-w-lg text-pretty text-lg leading-8 text-ink">
                “{beat.quote}”
              </blockquote>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * Writes how far the reading line — two thirds of the way down the screen —
 * has travelled through the element, 0 to 1, onto it as `--p`. CSS reads the
 * number, so scrolling lights the beats without React drawing anything.
 */
function useReadingProgress(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const line = window.innerHeight * 0.66;
      const progress = rect.height > 0 ? (line - rect.top) / rect.height : 0;
      element.style.setProperty("--p", Math.min(1, Math.max(0, progress)).toFixed(4));
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
  }, [ref, enabled]);
}
