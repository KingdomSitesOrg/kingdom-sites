import { cn } from '@/strata/ui';

const DIGITS = '0123456789';

/**
 * Rolls each digit of `value` vertically to its new place (600 ms, expo out). Keys run from the right,
 * so cents stay put while the integer part grows. Purely visual: pair it with real text for readers.
 */
export function Odometer({ value, className }: { value: string; className?: string }) {
  const chars = value.split('');
  return (
    <span aria-hidden className={cn('inline-flex tabular leading-none', className)}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        const d = DIGITS.indexOf(c);
        if (d < 0) {
          return (
            <span key={`s${key}`} className="inline-block h-[1.1em] leading-[1.1em]">
              {c}
            </span>
          );
        }
        return (
          <span key={`d${key}`} className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
            <span className="invisible">0</span>
            <span
              className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-600 ease-out-expo"
              style={{ transform: `translateY(${-d * 1.1}em)` }}
            >
              {DIGITS.split('').map((n) => (
                <span key={n} className="block h-[1.1em] text-center">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
