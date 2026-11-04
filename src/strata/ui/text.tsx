import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

export type Tone = "neutral" | "molten" | "resin" | "uv" | "ok";

const eyebrowTones: Record<Tone, string> = {
  neutral: "text-text-2",
  molten: "text-molten",
  resin: "text-resin",
  uv: "text-uv",
  ok: "text-ok",
};

export type EyebrowProps = ComponentPropsWithoutRef<"p"> & {
  tone?: Tone;
  /** Chapter or step number, rendered as "02 — The model". */
  index?: string;
  as?: "p" | "span" | "div";
};

/** Geist Mono 12 px uppercase kicker above a heading (STORYBOARD 3.5). Molten by default. */
export function Eyebrow({ tone = "molten", index, as: Tag = "p", className, children, ...rest }: EyebrowProps) {
  return (
    <Tag className={cn("strata-eyebrow", eyebrowTones[tone], className)} {...rest}>
      {index ? <span className="tabular">{index} — </span> : null}
      {children}
    </Tag>
  );
}

export type SectionHeadingProps = {
  /** Heading id; match the Section's aria-labelledby (`${sectionId}-title`). */
  id: string;
  eyebrow?: ReactNode;
  eyebrowTone?: Tone;
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  size?: "xl" | "lg" | "md";
  as?: "h1" | "h2" | "h3";
  className?: string;
};

const headingSizes = {
  xl: "text-display-xl",
  lg: "text-h2",
  md: "text-display-md",
} as const;

export function SectionHeading({
  id,
  eyebrow,
  eyebrowTone = "molten",
  index,
  title,
  lead,
  align = "left",
  size = "lg",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  const center = align === "center";
  return (
    <div className={cn("flex flex-col gap-5", center && "items-center text-center", className)}>
      {eyebrow ? (
        <Eyebrow tone={eyebrowTone} index={index}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Tag id={id} className={cn("max-w-[18ch] text-text-1", headingSizes[size])}>
        {title}
      </Tag>
      {lead ? (
        <p className={cn("max-w-prose text-lead text-text-2", center && "mx-auto")}>{lead}</p>
      ) : null}
    </div>
  );
}

const badgeTones: Record<Tone, string> = {
  neutral: "border-line-strong bg-white/[0.03] text-text-2",
  molten: "border-molten/40 bg-molten/10 text-molten-hot",
  resin: "border-resin/35 bg-resin/10 text-resin",
  uv: "border-uv/45 bg-uv/12 text-uv",
  ok: "border-ok/35 bg-ok/10 text-ok",
};
const dotTones: Record<Tone, string> = {
  neutral: "bg-text-2",
  molten: "bg-molten shadow-[0_0_8px_var(--molten)]",
  resin: "bg-resin shadow-[0_0_8px_var(--resin)]",
  uv: "bg-uv shadow-[0_0_8px_var(--uv)]",
  ok: "bg-ok shadow-[0_0_8px_var(--ok)]",
};

export type BadgeProps = ComponentPropsWithoutRef<"span"> & { tone?: Tone; dot?: boolean };

export function Badge({ tone = "neutral", dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "hud-label inline-flex h-6 items-center gap-2 whitespace-nowrap rounded-pill border px-2.5 text-[10.5px]",
        badgeTones[tone],
        className,
      )}
      {...rest}
    >
      {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", dotTones[tone])} /> : null}
      {children}
    </span>
  );
}

export function Kbd({ className, ...rest }: ComponentPropsWithoutRef<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-line-strong bg-bg-3 px-1.5 font-mono text-[11px] font-medium text-text-2 shadow-[inset_0_-1px_0_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.05)]",
        className,
      )}
      {...rest}
    />
  );
}

export type DividerProps = {
  label?: ReactNode;
  /** Adds millimetre ticks along the rule. */
  ticks?: boolean;
  className?: string;
};

/** Hairline rule. With a label it becomes a labelled separator; plain ones are decorative. */
export function Divider({ label, ticks, className }: DividerProps) {
  const rule = (
    <span
      aria-hidden
      className={cn(
        "relative h-px flex-1 bg-line",
        ticks &&
          "after:absolute after:inset-x-0 after:top-0 after:h-1.5 after:bg-[repeating-linear-gradient(90deg,var(--line-strong)_0_1px,transparent_1px_12px)]",
      )}
    />
  );
  if (!label) return <div role="presentation" className={cn("flex w-full", className)}>{rule}</div>;
  return (
    <div role="separator" className={cn("flex w-full items-center gap-4", className)}>
      {rule}
      <span className="hud-label text-text-3">{label}</span>
      {rule}
    </div>
  );
}

type PanelVariant = "glass" | "lite";
export type GlassPanelProps = ComponentPropsWithoutRef<"div"> & {
  /** glass (default): the copy panel, blurred on high/medium and solid on low/static. lite: always solid. */
  variant?: PanelVariant;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "aside" | "article" | "section";
};
const paddings = { none: "", sm: "p-4", md: "p-6 sm:p-7", lg: "p-7 sm:p-10" } as const;

/**
 * The copy panel (STORYBOARD 3.1): rgba(3,5,10,0.80) + 16 px backdrop blur on high and medium,
 * rgba(3,5,10,0.90) without blur on low and in static mode, 1 px --line border, 16 px radius.
 * The tier switch is pure CSS, keyed on data-quality / data-mode on <html>.
 */
export function GlassPanel({ variant = "glass", padding = "md", as: Tag = "div", className, ...rest }: GlassPanelProps) {
  return (
    <Tag
      className={cn(variant === "glass" ? "copy-panel" : "glass-lite rounded-panel", paddings[padding], className)}
      {...rest}
    />
  );
}

export { GlassPanel as CopyPanel };
