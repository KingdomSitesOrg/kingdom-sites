import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";

export type MarqueeProps = {
  items: ReactNode[];
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  /** Gap between items, any CSS length. */
  gap?: string;
  /** Accessible name for the list, e.g. "Customers". */
  label?: string;
  className?: string;
  itemClassName?: string;
};

/**
 * Pure-CSS infinite marquee. Pauses on hover and keyboard focus. The duplicate track is
 * aria-hidden and inert. With reduced motion it stops and wraps into a centered row.
 */
export function Marquee({
  items,
  duration = 48,
  reverse,
  gap = "clamp(2.5rem, 1.5rem + 4vw, 5rem)",
  label,
  className,
  itemClassName,
}: MarqueeProps) {
  const style = { "--marquee-duration": `${duration}s`, "--marquee-gap": gap } as CSSProperties;
  const track = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      aria-label={hidden ? undefined : label}
      className={cn(
        "flex shrink-0 items-center gap-[var(--marquee-gap)] pr-[var(--marquee-gap)]",
        hidden && "motion-reduce:hidden",
        "motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:pr-0",
      )}
    >
      {items.map((item, i) => (
        <li key={i} className={cn("flex shrink-0 items-center", itemClassName)}>
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("group/marquee relative overflow-hidden mask-fade-x motion-reduce:[mask-image:none]", className)} style={style}>
      <div
        className={cn(
          "flex w-max animate-marquee group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
          "motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center",
        )}
      >
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
