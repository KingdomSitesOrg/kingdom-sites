"use client";

import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Small tag beside the label ("-20%"). */
  hint?: ReactNode;
  /** Second line under the label, e.g. the process under a material name ("LPBF"). */
  description?: ReactNode;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name (required unless labelledBy is given). */
  label?: string;
  labelledBy?: string;
  size?: "sm" | "md";
  tone?: "molten" | "resin" | "neutral";
  className?: string;
};

const thumbTones = {
  molten:
    "bg-[linear-gradient(180deg,rgb(255_126_51/0.22),rgb(255_106_26/0.12))] shadow-[inset_0_0_0_1px_rgb(255_126_51/0.55),0_0_22px_-6px_rgb(255_106_26/0.7)]",
  resin:
    "bg-[linear-gradient(180deg,rgb(61_224_255/0.2),rgb(61_224_255/0.08))] shadow-[inset_0_0_0_1px_rgb(61_224_255/0.5),0_0_22px_-6px_rgb(61_224_255/0.6)]",
  neutral: "bg-white/[0.09] shadow-[inset_0_0_0_1px_var(--line-strong)]",
} as const;

/**
 * Radio group styled as a segmented switch (monthly/annual, material picker).
 * Arrow keys move and select, Home/End jump; only the checked option is in the tab order.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  size = "md",
  tone = "molten",
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const select = (i: number) => {
    const n = options.length;
    const next = ((i % n) + n) % n;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in keys) {
      e.preventDefault();
      select(keys[e.key]);
    }
  };

  const style = { "--n": options.length, "--i": index } as CSSProperties;
  const tall = options.some((o) => o.description);
  const radius = tall ? "rounded-xl" : "rounded-pill";

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cn(
        "relative isolate grid w-fit max-w-full grid-cols-[repeat(var(--n),minmax(0,1fr))] border border-line bg-bg-1/80 p-1",
        tall ? "rounded-2xl" : "rounded-pill",
        className,
      )}
      style={style}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 -z-10 w-[calc((100%-0.5rem)/var(--n))] translate-x-[calc(var(--i)*100%)] transition-transform duration-[var(--duration-slow)] ease-out-expo",
          radius,
          thumbTones[tone],
        )}
      />
      {options.map((o, i) => {
        const checked = i === index;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={onKeyDown}
            className={cn(
              "relative inline-flex items-center justify-center gap-2 font-medium transition-colors duration-[var(--duration-base)] before:absolute before:inset-x-0 before:top-1/2 before:h-[max(100%,2.75rem)] before:-translate-y-1/2 before:content-['']",
              radius,
              o.description
                ? "min-h-14 flex-col gap-1 px-3 py-2 text-center text-[14px] leading-tight sm:px-5"
                : size === "sm"
                  ? "h-8 whitespace-nowrap px-3.5 text-[13px]"
                  : "h-11 whitespace-nowrap px-5 text-[14px]",
              checked ? "text-text-1" : "text-text-2 hover:text-text-1",
            )}
          >
            <span className="inline-flex items-center gap-2">
              {o.label}
              {o.hint ? <span className="hud-label text-[10px] text-molten-hot">{o.hint}</span> : null}
            </span>
            {o.description ? (
              <span className="hud-label text-text-2">{o.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
