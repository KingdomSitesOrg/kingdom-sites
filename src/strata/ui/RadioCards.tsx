"use client";

import { useId, type ReactNode } from "react";
import { cn } from "./cn";

export type RadioCardOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Second line, e.g. a process or a spec. */
  description?: ReactNode;
  /** Picture above the label (an inline SVG silhouette, an icon). Decorative. */
  media?: ReactNode;
  disabled?: boolean;
};

export type RadioCardsProps<T extends string> = {
  options: readonly RadioCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name (required unless labelledBy is given). */
  label?: string;
  labelledBy?: string;
  /** Radio group name; defaults to a unique id. */
  name?: string;
  tone?: "molten" | "resin";
  /** Grid classes for the cards; default 2 columns, 4 from 768 px. */
  gridClassName?: string;
  cardClassName?: string;
  className?: string;
};

const checkedTone = {
  molten:
    "has-[:checked]:border-molten/70 has-[:checked]:bg-[linear-gradient(180deg,rgb(255_106_26/0.12),rgb(255_106_26/0.03))] has-[:checked]:shadow-[0_0_28px_-10px_rgb(255_106_26/0.7)]",
  resin:
    "has-[:checked]:border-resin/60 has-[:checked]:bg-[linear-gradient(180deg,rgb(56_225_255/0.1),rgb(56_225_255/0.02))] has-[:checked]:shadow-[0_0_28px_-10px_rgb(56_225_255/0.6)]",
} as const;

const mediaTone = { molten: "group-has-[:checked]/card:text-molten-hot", resin: "group-has-[:checked]/card:text-resin" } as const;
const dotTone = { molten: "bg-molten", resin: "bg-resin" } as const;

/**
 * Radio group of cards (the quote's object and material pickers). Native radio inputs inside labels, so arrow
 * keys, Space and form semantics work without script; the focus ring (2 px resin, 3 px offset) is drawn on the
 * card. Each card is at least 44 px tall.
 */
export function RadioCards<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  name,
  tone = "molten",
  gridClassName = "grid-cols-2 md:grid-cols-4",
  cardClassName,
  className,
}: RadioCardsProps<T>) {
  const auto = useId();
  const group = name ?? auto;
  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cn("grid gap-3", gridClassName, className)}
    >
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "group/card relative flex min-h-11 cursor-pointer flex-col gap-3 rounded-lg border border-line bg-bg-3 p-4 transition-[border-color,background-color,box-shadow] duration-[var(--duration-base)] ease-out-expo hover:border-line-strong",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-resin has-[:focus-visible]:[outline-style:solid]",
            "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45",
            checkedTone[tone],
            cardClassName,
          )}
        >
          <input
            type="radio"
            name={group}
            value={o.value}
            checked={o.value === value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border border-line-strong transition-colors group-has-[:checked]/card:border-transparent"
          >
            <span
              className={cn("size-2 scale-0 rounded-full transition-transform duration-[var(--duration-base)] ease-out-expo group-has-[:checked]/card:scale-100", dotTone[tone])}
            />
          </span>
          {o.media ? (
            <span aria-hidden className={cn("flex items-center text-text-3 transition-colors", mediaTone[tone])}>
              {o.media}
            </span>
          ) : null}
          <span className="flex flex-col gap-1 pr-6">
            <span className="text-ui text-text-1">{o.label}</span>
            {o.description ? <span className="font-mono text-[12px] tracking-[0.02em] text-text-2 tabular">{o.description}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}
