import { cn } from './cn'

/**
 * Farzana's buttons, as class names so they go straight onto a link or a
 * button. The brand's spec: Turquoise Deep with white words for the one
 * primary action, a hairline for the secondary, 10px corners, at least 44px
 * tall, and the gold focus ring on a primary button.
 */

type Variant = 'default' | 'outline' | 'ghost'
type Size = 'default' | 'sm' | 'lg' | 'icon'

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm text-base font-medium whitespace-nowrap no-underline transition-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5"

const VARIANTS: Record<Variant, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-gold',
  outline: 'border border-border bg-transparent text-heading hover:bg-wash',
  ghost: 'text-heading hover:bg-wash',
}

const SIZES: Record<Size, string> = {
  default: 'h-11 px-5 py-3 has-[>svg]:px-4',
  sm: 'h-11 gap-2 px-4 text-sm has-[>svg]:px-3.5',
  lg: 'h-[54px] px-8 has-[>svg]:px-6',
  icon: 'size-11',
}

export function buttonClass({
  variant = 'default',
  size = 'default',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className)
}
