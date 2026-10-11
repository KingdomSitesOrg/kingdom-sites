import { cn } from './cn'

/**
 * The motto under the logo in the bar: "Intelligent software, learned
 * students." It writes itself just after the logo does — the outline sweeps
 * in left to right, then the letters ink in, the way the logo draws — and
 * only on the visit the logo plays (`html[data-intro="landed"]`, styles in
 * farzana.css). Every other time it is simply there.
 *
 * Two short lines on a phone, so it stays the logo's width; one line from the
 * `sm` width up. Decorative: the link it sits in is named by the logo.
 */
export function Motto({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      dir="ltr"
      className={cn(
        'fz-motto block font-display text-[10.5px] leading-[13px] font-normal whitespace-nowrap text-muted sm:text-xs sm:leading-4',
        className,
      )}
    >
      <span className="fz-motto-line block sm:inline-block">Intelligent software,</span>{' '}
      <span className="fz-motto-line fz-motto-line-2 block sm:inline-block">learned students.</span>
    </span>
  )
}
