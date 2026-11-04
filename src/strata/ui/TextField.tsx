"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "./cn";

export type TextFieldProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  label: string;
  /** Keep the label for screen readers but hide it visually. */
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Rendered inside the field on the right, e.g. a type="button" action. */
  trailing?: ReactNode;
  className?: string;
  inputClassName?: string;
};

/** Labelled input with a pill frame. It never submits anything on its own (no form). */
export function TextField({
  label,
  hideLabel,
  hint,
  trailing,
  className,
  inputClassName,
  id,
  type = "text",
  ...rest
}: TextFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className={cn("hud-label text-text-2", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="flex h-12 items-center gap-2 rounded-pill border border-line-strong bg-bg-1 pl-5 pr-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)] transition-[border-color,box-shadow] duration-[var(--duration-base)] focus-within:border-molten/70 focus-within:shadow-[0_0_0_4px_rgb(255_106_26/0.14)] hover:border-hud-line has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-resin has-[input:focus-visible]:[outline-style:solid]">
        <input
          id={inputId}
          type={type}
          aria-describedby={hintId}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-[15px] text-text-1 placeholder:text-text-3 focus-visible:outline-none",
            inputClassName,
          )}
          {...rest}
        />
        {trailing}
      </div>
      {hint ? (
        <p id={hintId} className="text-caption text-text-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
