"use client";

import { useCallback, useId, useState, type MouseEvent, type ReactNode } from "react";
import { Button, type ButtonAsButton } from "./Button";
import { cn } from "./cn";

/** STORYBOARD 5.3: what plan, tour and subscribe buttons say on this demo site. */
export const DEMO_NOTE = "Demo site: sign-ups are disabled.";

/**
 * State for a type="button" action that only shows the demo note. Spread `buttonProps` on the button and render
 * <DemoNote {...noteProps} /> next to it: the note is the button's description and a polite live region, so the
 * message is announced when it appears.
 */
export function useDemoNote() {
  const id = useId();
  const [shown, setShown] = useState(false);
  const show = useCallback(() => setShown(true), []);
  return {
    shown,
    show,
    buttonProps: { type: "button" as const, "aria-describedby": id, onClick: show },
    noteProps: { id, shown },
  };
}

export type DemoNoteProps = {
  id: string;
  shown: boolean;
  children?: ReactNode;
  /** Keep the line's height while hidden so revealing it does not shift the layout. Default true. */
  reserve?: boolean;
  className?: string;
};

/** The inline note (empty until shown). Caption size, text-2, a molten dot. */
export function DemoNote({ id, shown, children = DEMO_NOTE, reserve = true, className }: DemoNoteProps) {
  return (
    <p
      id={id}
      role="status"
      className={cn(
        "flex items-center gap-2 text-caption text-text-2 transition-opacity duration-[var(--duration-base)]",
        reserve && "min-h-[1.4em]",
        shown ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {shown ? (
        <>
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-molten" />
          {children}
        </>
      ) : null}
    </p>
  );
}

export type DemoButtonProps = Omit<ButtonAsButton, "type"> & {
  /** The note text; defaults to DEMO_NOTE. */
  note?: ReactNode;
  /** Classes for the wrapper (button + note stacked). */
  wrapperClassName?: string;
  noteClassName?: string;
};

/**
 * A type="button" Button that reveals the demo note under itself when pressed (plan buttons, "Book a fleet
 * tour", "Subscribe"). It never navigates or submits. All Button props pass through.
 */
export function DemoButton({ note, wrapperClassName, noteClassName, onClick, ...props }: DemoButtonProps) {
  const { buttonProps, noteProps, show } = useDemoNote();
  return (
    <div className={cn("flex flex-col items-start gap-2", wrapperClassName)}>
      <Button
        {...props}
        type="button"
        aria-describedby={buttonProps["aria-describedby"]}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          show();
          onClick?.(e);
        }}
      />
      <DemoNote {...noteProps} className={noteClassName}>
        {note}
      </DemoNote>
    </div>
  );
}
