"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "./cn";

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode };

export type AccordionProps = {
  items: readonly AccordionItem[];
  /** "single" closes the others when one opens. */
  type?: "single" | "multiple";
  defaultOpen?: readonly string[];
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/**
 * Disclosure list (FAQ). Each trigger is a real button inside a heading with aria-expanded and
 * aria-controls; panels animate height with a grid-rows transition and are inert while closed.
 */
export function Accordion({ items, type = "single", defaultOpen = [], headingLevel = 3, className }: AccordionProps) {
  const uid = useId();
  const [open, setOpen] = useState<readonly string[]>(defaultOpen);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const toggle = (id: string) =>
    setOpen((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      return type === "single" ? [id] : [...cur, id];
    });

  return (
    <div className={cn("border-y border-line", className)}>
      {items.map((item, i) => {
        const isOpen = open.includes(item.id);
        const triggerId = `${uid}-t-${item.id}`;
        const panelId = `${uid}-p-${item.id}`;
        return (
          <div key={item.id} className={cn(i > 0 && "border-t border-line")}>
            <Heading className="m-0 font-sans">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="group/acc flex w-full rounded-sm items-center justify-between gap-6 py-6 text-left text-title font-medium text-text-1 transition-colors hover:text-white focus-visible:outline-offset-[-2px] sm:py-7"
              >
                <span>{item.title}</span>
                <span
                  aria-hidden
                  className={cn(
                    "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-[border-color,background-color] duration-[var(--duration-base)]",
                    isOpen ? "border-molten/60 bg-molten/10" : "border-line-strong group-hover/acc:border-hud-line",
                  )}
                >
                  <span className={cn("absolute h-px w-3 transition-colors", isOpen ? "bg-molten" : "bg-text-2")} />
                  <span
                    className={cn(
                      "absolute h-3 w-px transition-transform duration-[var(--duration-slow)] ease-out-expo",
                      isOpen ? "rotate-90 scale-y-0 bg-molten" : "bg-text-2",
                    )}
                  />
                </span>
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-[var(--duration-slow)] ease-out-expo",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="max-w-prose pb-7 pr-12 text-body text-text-2">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
