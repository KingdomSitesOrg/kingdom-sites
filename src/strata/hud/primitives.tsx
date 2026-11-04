import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import { cn } from "@/strata/ui/cn";
import { LeaderLabel, LeaderShape, leaderRoot } from "./LeaderShape";
import { LiveDot } from "./LiveDot";

export type HudTone = "molten" | "resin" | "uv" | "neutral" | "ok" | "warn";

const toneText: Record<HudTone, string> = {
  molten: "text-molten",
  resin: "text-resin",
  uv: "text-uv",
  neutral: "text-text-1",
  ok: "text-ok",
  warn: "text-warn",
};
const toneVar: Record<HudTone, string> = {
  molten: "var(--molten)",
  resin: "var(--resin)",
  uv: "var(--uv)",
  neutral: "var(--text-2)",
  ok: "var(--ok)",
  warn: "var(--warn)",
};

/* ---------- HudFrame ---------- */

/** Attributes every primitive forwards to its root (data-*, aria-*, id, style, handlers). */
type RootProps<T extends "div" | "dl"> = Omit<ComponentPropsWithoutRef<T>, "children" | "className">;

export type HudFrameProps = RootProps<"div"> & {
  children?: ReactNode;
  /** Small mono caption cut into the top-left edge. */
  label?: ReactNode;
  /** Bracket arm length in px. */
  size?: number;
  tone?: HudTone;
  /** Draws a faint full hairline between the brackets. */
  outline?: boolean;
  className?: string;
};

const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/;

/**
 * Corner-bracket frame. Brackets are decorative; children render normally inside. The root is `relative`
 * unless className positions it (absolute, fixed or sticky); other attributes are forwarded to the root.
 */
export function HudFrame({ children, label, size = 14, tone = "neutral", outline, className, ...rest }: HudFrameProps) {
  const color = tone === "neutral" ? "var(--hud-line)" : toneVar[tone];
  const arm = { width: size, height: size, borderColor: color } as CSSProperties;
  return (
    <div
      {...rest}
      className={cn(!positioned.test(className ?? "") && "relative", outline && "outline outline-1 -outline-offset-1 outline-line", className)}
    >
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 border-l border-t" style={arm} />
      <span aria-hidden className="pointer-events-none absolute right-0 top-0 border-r border-t" style={arm} />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 border-b border-l" style={arm} />
      <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 border-b border-r" style={arm} />
      {label ? (
        <span className="hud-label pointer-events-none absolute top-1.5 text-text-2" style={{ left: size + 8 }}>
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

/* ---------- HudReadout ---------- */

export type HudReadoutProps = RootProps<"dl"> & {
  label: ReactNode;
  /** Plain text or a live <HudValue>. */
  value: ReactNode;
  unit?: ReactNode;
  /** sm = the storyboard readout (Geist Mono 500, 13 px). md / lg / xl for showcase numbers off the canvas. */
  size?: "sm" | "md" | "lg" | "xl";
  tone?: HudTone;
  align?: "left" | "right";
  /** The 5 px molten live dot pulsing at 1.2 s. Hidden in static mode and under ?capture=1; leave off in Ch8. */
  live?: boolean;
  /** Hidden below 768 px: how a cluster keeps to 2 readouts on phones. */
  desktopOnly?: boolean;
  /** Minimum width of the value field in characters, so ticking digits never shift the layout. */
  chars?: number;
  className?: string;
};

const readoutSizes = {
  sm: "text-[13px]",
  md: "text-[22px]",
  lg: "text-[32px] tracking-[-0.02em]",
  xl: "text-[clamp(2.5rem,1.6rem+3vw,4rem)] tracking-[-0.03em]",
} as const;

/**
 * LABEL (Geist Mono 11 px uppercase, text-2) over value (Geist Mono 500, text-1) and unit (text-2), STORYBOARD 3.7.
 * Renders as its own <dl>, so it is valid anywhere. Counts toward the 4 desktop / 2 mobile readout cap.
 */
export function HudReadout({
  label,
  value,
  unit,
  size = "sm",
  tone = "neutral",
  align = "left",
  live,
  desktopOnly,
  chars,
  className,
  ...rest
}: HudReadoutProps) {
  return (
    <dl
      data-hud-readout=""
      {...rest}
      className={cn(
        "flex min-w-0 flex-col gap-1.5",
        align === "right" && "items-end text-right",
        desktopOnly && "max-md:hidden",
        className,
      )}
    >
      <dt className="hud-label flex items-center gap-2 text-text-2">
        {live ? <LiveDot /> : null}
        {label}
      </dt>
      <dd className="m-0 flex items-baseline gap-1.5 font-mono leading-none tabular">
        <span
          className={cn("font-medium", readoutSizes[size], toneText[tone], tone !== "neutral" && "[text-shadow:0_0_14px_currentColor]")}
          style={chars ? { minWidth: `${chars}ch`, display: "inline-block" } : undefined}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-[11px] tracking-[0.04em] text-text-2">{unit}</span> : null}
      </dd>
    </dl>
  );
}

/* ---------- HudStatus ---------- */

export type HudStatusProps = {
  children: ReactNode;
  tone?: HudTone;
  pulse?: boolean;
  className?: string;
};

/** Pulsing dot + state text ("PRINTING", "CURING", "IDLE"). */
export function HudStatus({ children, tone = "ok", pulse = true, className }: HudStatusProps) {
  const color = toneVar[tone];
  return (
    <span className={cn("hud-label inline-flex items-center gap-2.5", toneText[tone], className)}>
      <span aria-hidden className="relative inline-flex size-1.5">
        {pulse ? <span className="absolute inset-0 animate-hud-pulse rounded-full" style={{ background: color }} /> : null}
        <span className="relative size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </span>
      {children}
    </span>
  );
}

/* ---------- HudPanel ---------- */

export type HudPanelProps = RootProps<"div"> & {
  title: ReactNode;
  /** Right side of the header, e.g. "CH 05" or a <HudStatus>. */
  meta?: ReactNode;
  children: ReactNode;
  /** Grid columns for the readout stack. */
  columns?: 1 | 2 | 3;
  variant?: "glass" | "lite" | "bare";
  className?: string;
};

const cols = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as const;

/** Header + stack of readouts. Use variant="lite" when the panel is large or many are on screen. */
export function HudPanel({ title, meta, children, columns = 1, variant = "glass", className, ...rest }: HudPanelProps) {
  return (
    <div
      {...rest}
      className={cn(
        "relative overflow-hidden rounded-lg",
        variant === "glass" && "glass",
        variant === "lite" && "glass-lite",
        variant === "bare" && "border border-line",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <span className="hud-label text-text-2">{title}</span>
        {meta ? <span className="hud-label text-text-2">{meta}</span> : null}
      </div>
      <div className={cn("grid gap-x-6 gap-y-5 p-4", cols[columns])}>{children}</div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.14),transparent)]"
      />
    </div>
  );
}

/* ---------- HudGrid ---------- */

export type HudGridProps = {
  /** Minor cell size in px. */
  cell?: number;
  /** Major line every n cells. */
  majorEvery?: number;
  /** Crosshair position in % of the box. */
  crosshair?: { x: number; y: number } | false;
  /** Radial fade toward the edges. */
  fade?: boolean;
  tone?: HudTone;
  className?: string;
};

/** Measurement grid with optional crosshair. Absolutely fills its positioned parent; decorative. */
export function HudGrid({ cell = 24, majorEvery = 4, crosshair, fade = true, tone = "molten", className }: HudGridProps) {
  const major = cell * majorEvery;
  const color = toneVar[tone];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={
        fade
          ? {
              maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 78%)",
            }
          : undefined
      }
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(to right, var(--line) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
            "linear-gradient(to right, var(--line) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px, ${major}px ${major}px, ${major}px ${major}px`,
          backgroundPosition: "center center",
        }}
      />
      {crosshair ? (
        <>
          <span className="absolute inset-x-0 h-px" style={{ top: `${crosshair.y}%`, background: `linear-gradient(90deg, transparent, ${color} 50%, transparent)`, opacity: 0.45 }} />
          <span className="absolute inset-y-0 w-px" style={{ left: `${crosshair.x}%`, background: `linear-gradient(180deg, transparent, ${color} 50%, transparent)`, opacity: 0.45 }} />
          <span
            className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ left: `${crosshair.x}%`, top: `${crosshair.y}%`, borderColor: color, boxShadow: `0 0 12px ${color}` }}
          />
        </>
      ) : null}
    </div>
  );
}

/* ---------- HudTag ---------- */

export type HudTagProps = Omit<RootProps<"div">, "ref"> & {
  /** Anchor x: number = px, string = any CSS length ("42%"). Live-update via the --x CSS variable. */
  x: number | string;
  y: number | string;
  label: ReactNode;
  value?: ReactNode;
  /** Label offset from the anchor in px: a 45° run for |dy|, then horizontal to dx. */
  dx?: number;
  dy?: number;
  tone?: HudTone;
  /**
   * Controlled visibility: false hides the tag and retracts the leader (CSS transition). Leave it undefined to
   * drive `el.dataset.visible` imperatively instead; never use both, a re-render would overwrite the DOM value.
   */
  visible?: boolean;
  /** Element ref, for per-frame --x/--y updates from a client parent. */
  ref?: Ref<HTMLDivElement>;
  className?: string;
};

const len = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

/**
 * A Leader with a fixed anchor inside a positioned parent (same graphic: 3 px dot, 1 px line with a 45° elbow,
 * label on the copy-panel material). For a projected 3D point use <Leader anchors name> instead.
 */
export function HudTag({ x, y, label, value, dx = 72, dy = -44, tone = "molten", visible, ref, className, style, ...rest }: HudTagProps) {
  return (
    <div
      {...rest}
      ref={ref}
      data-visible={visible === undefined ? undefined : visible ? "true" : "false"}
      className={cn(leaderRoot, "absolute z-hud", className)}
      style={{ left: `var(--x, ${len(x)})`, top: `var(--y, ${len(y)})`, ...style } as CSSProperties}
    >
      <LeaderShape dx={dx} dy={dy} tone={tone}>
        <LeaderLabel label={label} value={value} tone={tone} />
      </LeaderShape>
    </div>
  );
}
