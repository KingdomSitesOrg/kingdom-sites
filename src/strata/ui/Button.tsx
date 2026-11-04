"use client";

import type { ComponentPropsWithRef, PointerEvent, ReactNode } from "react";
import { LazyMotion, domAnimation, m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "./cn";
import { useCoarsePointer, usePrefersReducedMotion } from "./hooks";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Pointer-follow effect. Off automatically for reduced motion and coarse pointers. */
  magnetic?: boolean;
  className?: string;
  children?: ReactNode;
};

type DragHandlers = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart";
export type ButtonAsButton = OwnProps &
  Omit<ComponentPropsWithRef<"button">, keyof OwnProps | DragHandlers> & { href?: undefined };
export type ButtonAsLink = OwnProps &
  Omit<ComponentPropsWithRef<"a">, keyof OwnProps | DragHandlers> & { href: string };
export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** The ::before hit area keeps every size at least 44 x 44 px (STORYBOARD 8.2) without changing the visual size. */
const base =
  "group/btn relative isolate inline-flex before:absolute before:left-1/2 before:top-1/2 before:h-[max(100%,2.75rem)] before:w-[max(100%,2.75rem)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] shrink-0 select-none items-center justify-center whitespace-nowrap rounded-pill font-text font-medium tracking-[0.01em] transition-[box-shadow,background-color,border-color,color,opacity] duration-[var(--duration-base)] ease-out-expo disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 min-w-11 gap-1.5 px-4 text-[13px]",
  md: "h-12 gap-2 px-6 text-[15px]",
  lg: "h-14 gap-2.5 px-7 text-base",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-molten text-text-on-molten shadow-glow-molten hover:bg-[color-mix(in_oklab,var(--molten)_86%,var(--molten-hot))] hover:shadow-glow-molten-lg active:bg-molten-deep",
  secondary: "glass border-line-strong text-text-1 hover:border-text-3 hover:bg-white/[0.06]",
  ghost: "text-text-2 hover:bg-white/[0.06] hover:text-text-1",
};

const spring = { stiffness: 260, damping: 18, mass: 0.6 };

/** STRATA button. Renders an anchor when given href, otherwise a button (type="button" by default). */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    magnetic = true,
    className,
    children,
    ...rest
  } = props;

  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const active = magnetic && !reduced && !coarse;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);
  const ix = useTransform(x, (v) => v * 0.45);
  const iy = useTransform(y, (v) => v * 0.45);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!active || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    mx.set(Math.max(-10, Math.min(10, dx * 0.22)));
    my.set(Math.max(-7, Math.min(7, dy * 0.32)));
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const classes = cn(base, sizes[size], variants[variant], className);
  const content = (
    <>
      <m.span className="inline-flex items-center gap-[inherit]" style={active ? { x: ix, y: iy } : undefined}>
        {leadingIcon && (
          <span aria-hidden className="-ml-0.5 inline-flex size-[1.15em] items-center justify-center">
            {leadingIcon}
          </span>
        )}
        {children}
        {trailingIcon && (
          <span
            aria-hidden
            className="-mr-1 inline-flex size-[1.15em] items-center justify-center transition-transform duration-[var(--duration-base)] ease-out-expo group-hover/btn:translate-x-0.5"
          >
            {trailingIcon}
          </span>
        )}
      </m.span>
    </>
  );

  const motionStyle = active ? { x, y } : undefined;

  if (rest.href !== undefined) {
    const { onPointerMove, onPointerLeave, ...anchorProps } = rest as ButtonAsLink;
    return (
      <LazyMotion features={domAnimation} strict>
        <m.a
          {...anchorProps}
          className={classes}
          style={{ ...anchorProps.style, ...motionStyle }}
          onPointerMove={(e) => {
            onMove(e);
            onPointerMove?.(e);
          }}
          onPointerLeave={(e) => {
            onLeave();
            onPointerLeave?.(e);
          }}
        >
          {content}
        </m.a>
      </LazyMotion>
    );
  }

  const { onPointerMove, onPointerLeave, type = "button", ...buttonProps } = rest as ButtonAsButton;
  return (
    <LazyMotion features={domAnimation} strict>
      <m.button
        {...buttonProps}
        type={type}
        className={classes}
        style={{ ...buttonProps.style, ...motionStyle }}
        onPointerMove={(e) => {
          onMove(e);
          onPointerMove?.(e);
        }}
        onPointerLeave={(e) => {
          onLeave();
          onPointerLeave?.(e);
        }}
      >
        {content}
      </m.button>
    </LazyMotion>
  );
}
