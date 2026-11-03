import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "./cn";

type ContainerSize = "prose" | "page" | "wide" | "full";
const containerSizes: Record<ContainerSize, string> = {
  prose: "max-w-prose",
  page: "max-w-page",
  wide: "max-w-wide",
  full: "max-w-none",
};

export type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  size?: ContainerSize;
  as?: ElementType;
};

/** Centered column with the fluid side gutter (16 px at 375 px wide, 40 px on desktop). */
export function Container({ size = "page", as: Tag = "div", className, ...rest }: ContainerProps) {
  return <Tag className={cn("mx-auto w-full px-gutter", containerSizes[size], className)} {...rest} />;
}

type SectionSpacing = "default" | "sm" | "none";
const sectionSpacing: Record<SectionSpacing, string> = {
  default: "py-section",
  sm: "py-section-sm",
  none: "",
};

export type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "id"> & {
  /** Anchor id, e.g. "pricing". The heading inside should use id `${id}-title`. */
  id: string;
  /** Defaults to `${id}-title`. */
  labelledBy?: string;
  spacing?: SectionSpacing;
  /** Opaque background so the WebGL canvas never shows through SaaS sections. */
  surface?: "bg-0" | "bg-2" | "bg-3" | "transparent";
  children?: ReactNode;
};

const surfaces = {
  "bg-0": "bg-bg-0",
  "bg-2": "bg-bg-2",
  "bg-3": "bg-bg-3",
  transparent: "",
} as const;

export function Section({
  id,
  labelledBy,
  spacing = "default",
  surface = "bg-0",
  className,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy ?? `${id}-title`}
      className={cn("relative scroll-mt-16", surfaces[surface], sectionSpacing[spacing], className)}
      {...rest}
    />
  );
}
