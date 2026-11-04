"use client";

import { useRef, type ComponentPropsWithoutRef, type CSSProperties, type PointerEvent } from "react";
import { cn } from "./cn";

const accents = {
  molten: "255 106 26",
  resin: "61 224 255",
  uv: "122 104 255",
} as const;

export type GlowCardProps = ComponentPropsWithoutRef<"div"> & {
  accent?: keyof typeof accents;
  /** Spotlight radius in px. */
  radius?: number;
  as?: "div" | "article" | "li";
};

/**
 * Card with a cursor-tracking glow on its surface and border. Pointer position is written
 * to CSS variables (--mx/--my) on the element, so moving the cursor never re-renders React.
 */
export function GlowCard({
  accent = "molten",
  radius = 380,
  as = "div",
  className,
  style,
  children,
  onPointerEnter,
  onPointerMove,
  ...rest
}: GlowCardProps) {
  const rect = useRef<DOMRect | null>(null);
  const Tag = as as "div";

  const enter = (e: PointerEvent<HTMLDivElement>) => {
    rect.current = e.currentTarget.getBoundingClientRect();
    onPointerEnter?.(e);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = rect.current ?? e.currentTarget.getBoundingClientRect();
    const el = e.currentTarget;
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    onPointerMove?.(e);
  };

  const vars = { "--glow-rgb": accents[accent], "--glow-r": `${radius}px`, ...style } as CSSProperties;

  return (
    <Tag
      className={cn(
        "group/glow relative isolate overflow-hidden rounded-xl border border-line bg-[linear-gradient(180deg,var(--bg-2),var(--bg-1))] shadow-lift transition-[border-color,transform] duration-[var(--duration-base)] ease-out-expo hover:border-line-strong",
        className,
      )}
      style={vars}
      onPointerEnter={enter}
      onPointerMove={move}
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-[var(--duration-slow)] ease-out-expo group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(var(--glow-r) circle at var(--mx, 50%) var(--my, 0%), rgb(var(--glow-rgb) / 0.13), transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="border-mask pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-[var(--duration-slow)] ease-out-expo group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(calc(var(--glow-r) * 0.7) circle at var(--mx, 50%) var(--my, 0%), rgb(var(--glow-rgb) / 0.75), transparent 55%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.12),transparent)]"
      />
      {children}
    </Tag>
  );
}
