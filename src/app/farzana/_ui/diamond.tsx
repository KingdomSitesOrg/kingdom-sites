import type { CSSProperties } from "react";

import { cn } from "./cn";

/**
 * The brand's one ornament: a square turned 45°, saffron by default. It is the
 * pair of marks over the z in the wordmark, and on its own it marks an
 * achievement or a streak, stands in for a bullet in marketing copy, and pulses
 * as a loading indicator. Nothing else decorates the product.
 *
 * Drawn as a clipped square rather than a rotated one, so the box it takes in a
 * row is exactly the shape you see — no corner sticks out past its neighbours.
 *
 * Decorative unless it is given a `label`, in which case screen readers read the
 * label as an image ("Seven-day streak").
 */
export function Diamond({
  size = 12,
  label,
  className,
  style,
}: {
  /** Width and height, tip to tip. A number is pixels; a string is any CSS length. */
  size?: number | string;
  /** What the mark means, when it means something on its own. */
  label?: string;
  /** Colour (`bg-…`) and spacing. The default colour is `bg-gold`. */
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      className={cn(
        "inline-block shrink-0 bg-gold [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]",
        className,
      )}
      style={{ width: size, height: size, ...style }}
    />
  );
}
