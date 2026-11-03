"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/strata/ui/cn";

export type PhaseRailChapter = { id: string; label: string };

/** The nine story chapters in order (STORYBOARD 8.1); codes are their index, "00" .. "08". */
export const STORY_CHAPTERS: readonly PhaseRailChapter[] = [
  { id: "ignition", label: "Ignition" },
  { id: "idea", label: "Idea" },
  { id: "model", label: "Model" },
  { id: "optimize", label: "Optimize" },
  { id: "slice", label: "Slice" },
  { id: "print", label: "Print" },
  { id: "machines", label: "Machines" },
  { id: "fleet", label: "Fleet" },
  { id: "object", label: "Object" },
];

export type PhaseRailProps = {
  chapters?: readonly PhaseRailChapter[];
  /** The rail hides once this section's top is within the top 15 % of the viewport (anchor jumps land 64 px down). */
  endId?: string;
  className?: string;
};

const code = (i: number) => String(i).padStart(2, "0");

type Section = { top: number; pinned: number };

/**
 * The global phase rail (STORYBOARD 3.7): a <nav aria-label="Story chapters"> of real in-page links.
 * Desktop: ticks on the left edge, labels ("05 Print") on hover and focus, the active tick filling molten with p.
 * Below 768 px: a 2 px progress line along the top with the chapter code on the right; the links stay in the DOM
 * as a visually hidden list that shows the focused link. Faded out (still focusable) once `#customers` reaches the top.
 * Progress comes from cached section offsets and window.scrollY on the gsap ticker (no layout reads per frame).
 */
export function PhaseRail({ chapters = STORY_CHAPTERS, endId = "customers", className }: PhaseRailProps) {
  const nav = useRef<HTMLElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);
  const codeEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = nav.current;
    if (!root) return;
    const n = chapters.length;
    const sections: Section[] = chapters.map(() => ({ top: 0, pinned: 1 }));
    let end = Infinity;
    let vh = window.innerHeight;
    let active = -1;
    let lastP = -1;
    let hidden = false;
    let lastBar = -1;

    const measure = () => {
      const y = window.scrollY;
      vh = window.innerHeight;
      for (let i = 0; i < n; i++) {
        const el = document.getElementById(chapters[i].id);
        if (!el) continue;
        sections[i].top = el.getBoundingClientRect().top + y;
        sections[i].pinned = Math.max(1, el.offsetHeight - vh);
      }
      const endEl = document.getElementById(endId);
      end = endEl ? endEl.getBoundingClientRect().top + y : Infinity;
    };

    const setActive = (next: number) => {
      for (let i = 0; i < n; i++) {
        const fill = fills.current[i];
        if (i !== next && fill) fill.style.transform = i < next ? "scaleX(1)" : "scaleX(0)";
        const a = links.current[i];
        if (!a) continue;
        if (i === next) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
        a.dataset.state = i < next ? "past" : i === next ? "active" : "next";
      }
      if (codeEl.current) codeEl.current.textContent = `${code(next)} ${chapters[next].label}`;
      active = next;
      lastP = -1;
    };

    const tick = () => {
      const y = window.scrollY;
      const off = y >= end - vh * 0.15;
      if (off !== hidden) {
        hidden = off;
        root.dataset.hidden = off ? "true" : "false";
      }
      if (off) return;
      let next = 0;
      for (let i = 0; i < n; i++) if (y >= sections[i].top - vh * 0.5) next = i;
      if (next !== active) setActive(next);
      const s = sections[next];
      const raw = (y - s.top) / s.pinned;
      const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      if (Math.abs(p - lastP) > 0.002) {
        lastP = p;
        const fill = fills.current[next];
        if (fill) fill.style.transform = `scaleX(${p.toFixed(3)})`;
      }
      const total = (next + p) / n;
      if (Math.abs(total - lastBar) > 0.0005 && bar.current) {
        lastBar = total;
        bar.current.style.transform = `scaleX(${total.toFixed(4)})`;
      }
    };

    measure();
    tick();
    const ro = new ResizeObserver(() => {
      measure();
      tick();
    });
    ro.observe(document.body);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
    };
  }, [chapters, endId]);

  return (
    <nav
      ref={nav}
      aria-label="Story chapters"
      data-phase-rail
      data-hidden="false"
      className={cn(
        "group/rail z-nav transition-opacity duration-[240ms] data-[hidden=true]:pointer-events-none data-[hidden=true]:opacity-0 data-[hidden=true]:focus-within:pointer-events-auto data-[hidden=true]:focus-within:opacity-100",
        className,
      )}
    >
      <div aria-hidden className="fixed inset-x-0 top-0 z-nav h-0.5 bg-hud-line md:hidden">
        <span ref={bar} className="absolute inset-0 origin-left bg-molten" style={{ transform: "scaleX(0)" }} />
      </div>
      <span
        aria-hidden
        ref={codeEl}
        className="glass-lite hud-label fixed right-4 top-2 z-nav rounded-xs px-1.5 py-0.5 text-text-1 md:hidden"
      >
        {`${code(0)} ${chapters[0].label}`}
      </span>
      <ol className="md:fixed md:left-0 md:top-1/2 md:z-nav md:flex md:-translate-y-1/2 md:flex-col">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a
              ref={(el) => {
                links.current[i] = el;
              }}
              href={`#${c.id}`}
              data-state={i === 0 ? "active" : "next"}
              aria-current={i === 0 ? "location" : undefined}
              className="group/link relative flex size-11 items-center pl-3 md:focus-visible:-outline-offset-2 max-md:not-focus-visible:sr-only max-md:focus-visible:fixed max-md:focus-visible:left-4 max-md:focus-visible:top-4 max-md:focus-visible:z-nav max-md:focus-visible:w-auto max-md:focus-visible:pl-0"
            >
              <span
                aria-hidden
                className="relative h-0.5 w-5 overflow-hidden bg-hud-line transition-[width,background-color] duration-[var(--duration-base)] ease-out-expo group-hover/link:w-7 group-data-[state=active]/link:w-8 group-data-[state=active]/link:bg-molten/25 max-md:hidden"
              >
                <span
                  ref={(el) => {
                    fills.current[i] = el;
                  }}
                  className="absolute inset-0 origin-left bg-text-2 group-data-[state=active]/link:bg-molten"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
              <span className="glass-lite hud-label pointer-events-none whitespace-nowrap rounded-xs px-2 py-1 text-text-2 transition-opacity duration-[var(--duration-fast)] group-hover/link:text-text-1 group-focus-visible/link:text-text-1 group-data-[state=active]/link:text-text-1 md:absolute md:left-full md:top-1/2 md:-translate-y-1/2 md:opacity-0 md:group-hover/link:opacity-100 md:group-focus-visible/link:opacity-100">
                <span className="tabular">{code(i)}</span> {c.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
