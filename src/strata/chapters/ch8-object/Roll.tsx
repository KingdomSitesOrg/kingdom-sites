'use client';

import { forwardRef } from 'react';

// The strip is drawn by a pseudo-element, so the nine hidden digits are not text nodes (screen readers and
// the contrast check only see the real value, which lives in an sr-only twin).
const STRIP = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9';

const digitsOf = (value: number, int: number, dec: number) =>
  Math.max(0, value).toFixed(dec).replace('.', '').padStart(int + dec, '0').slice(-(int + dec));

const leadOf = (s: string, int: number) => {
  let n = 0;
  while (n < int - 1 && s[n] === '0') n++;
  return n;
};

/**
 * A fixed-width odometer: each digit is a rolling strip, leading zeros fold away. Rendered from `value`
 * on the server; later values are written with writeRoll() straight to the DOM (no React state).
 */
export const Roll = forwardRef<HTMLSpanElement, { value: number; int: number; dec?: number; prefix?: string }>(function Roll(
  { value, int, dec = 0, prefix },
  ref,
) {
  const s = digitsOf(value, int, dec);
  const lead = leadOf(s, int);
  return (
    <span ref={ref} aria-hidden className="inline-flex h-[1.15em] items-start leading-[1.15em] tabular">
      {prefix ? <span className="block">{prefix}</span> : null}
      {s.split('').map((d, i) => (
        <span key={i} className="contents">
          {dec > 0 && i === int ? <span className="block">.</span> : null}
          <span
            data-slot
            data-lead={i < lead ? '1' : '0'}
            className="relative block h-[1.15em] w-[1ch] overflow-hidden transition-[width,opacity] duration-[600ms] ease-out-expo data-[lead=1]:w-0 data-[lead=1]:opacity-0"
          >
            <span
              data-strip
              data-digits={STRIP}
              className="absolute inset-x-0 top-0 block whitespace-pre text-center leading-[1.15em] transition-transform duration-[700ms] ease-out-expo before:content-[attr(data-digits)]"
              style={{ transform: `translate3d(0, ${-Number(d) * 10}%, 0)` }}
            />
          </span>
        </span>
      ))}
    </span>
  );
});

/** Rolls an odometer rendered by <Roll> to a new value. */
export function writeRoll(el: HTMLElement | null, value: number, int: number, dec = 0) {
  if (!el) return;
  const s = digitsOf(value, int, dec);
  const lead = leadOf(s, int);
  const slots = el.querySelectorAll<HTMLElement>('[data-slot]');
  for (let i = 0; i < slots.length; i++) {
    slots[i].dataset.lead = i < lead ? '1' : '0';
    const strip = slots[i].firstElementChild as HTMLElement | null;
    if (strip) strip.style.transform = `translate3d(0, ${-Number(s[i]) * 10}%, 0)`;
  }
}
