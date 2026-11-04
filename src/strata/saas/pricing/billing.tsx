'use client';

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { LazyMotion, MotionConfig, domMax, m } from 'framer-motion';
import { cn } from '@/strata/ui';
import { ANNUAL_SAVING_PCT, PLANS, billedYearly, perMonth, usd, type Billing, type PlanId } from './plans';

type BillingState = { billing: Billing; setBilling: (b: Billing) => void };
const BillingContext = createContext<BillingState>({ billing: 'monthly', setBilling: () => {} });

export function BillingProvider({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<Billing>('monthly');
  const value = useMemo(() => ({ billing, setBilling }), [billing]);
  return <BillingContext value={value}>{children}</BillingContext>;
}

const OPTIONS: readonly { value: Billing; label: string; hint?: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual', hint: `Save ${ANNUAL_SAVING_PCT}%` },
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** Monthly / Annual radiogroup. The pill moves with a Framer layout animation (skipped under reduced motion). */
export function BillingToggle({ className }: { className?: string }) {
  const { billing, setBilling } = useContext(BillingContext);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = OPTIONS.findIndex((o) => o.value === billing);

  const select = (i: number) => {
    const next = (i + OPTIONS.length) % OPTIONS.length;
    setBilling(OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: OPTIONS.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key]);
  };

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className={cn('relative inline-flex rounded-pill border border-line bg-bg-1 p-1', className)}
        >
          {OPTIONS.map((o, i) => {
            const checked = o.value === billing;
            return (
              <button
                key={o.value}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={o.hint ? `${o.label}, ${o.hint}` : undefined}
                tabIndex={checked ? 0 : -1}
                onClick={() => setBilling(o.value)}
                onKeyDown={onKeyDown}
                className={cn(
                  'relative isolate inline-flex h-11 items-center gap-2.5 rounded-pill px-5 text-[14px] font-medium transition-colors duration-[var(--duration-base)]',
                  checked ? 'text-text-1' : 'text-text-2 hover:text-text-1',
                )}
              >
                {checked ? (
                  <m.span
                    layoutId="billing-pill"
                    aria-hidden
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 -z-10 rounded-pill bg-[linear-gradient(180deg,color-mix(in_oklab,var(--molten)_22%,transparent),color-mix(in_oklab,var(--molten)_10%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--molten)_55%,transparent),0_0_22px_-6px_color-mix(in_oklab,var(--molten)_70%,transparent)]"
                  />
                ) : null}
                {o.label}
                {o.hint ? (
                  <span className="hud-label rounded-pill border border-molten/35 bg-molten/10 px-2 py-0.5 text-[10px] leading-none text-molten-hot">
                    {o.hint}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Odometer digits: each digit is a 0-9 strip translated to its value (400 ms; instant under reduced motion). */
function Rolling({ value }: { value: string }) {
  const chars = value.split('');
  return (
    <span aria-hidden className="inline-flex leading-none">
      {chars.map((ch, i) => {
        const key = chars.length - i;
        if (!/\d/.test(ch)) {
          return (
            <span key={key} className="inline-block">
              {ch}
            </span>
          );
        }
        return (
          <span key={key} className="relative inline-block h-[1em] overflow-hidden">
            <span
              className="flex flex-col transition-transform duration-[400ms] ease-out-expo"
              style={{ transform: `translateY(${-Number(ch)}em)`, transitionDelay: `${(chars.length - i) * 24}ms` } as CSSProperties}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Price block for one plan; rolls when the billing period changes. */
export function PlanPrice({ id, className }: { id: PlanId; className?: string }) {
  const { billing } = useContext(BillingContext);
  const plan = PLANS.find((p) => p.id === id) ?? PLANS[0];
  const price = perMonth(plan, billing);
  const yearly = billedYearly(plan);
  const annual = billing === 'annual';

  return (
    <div className={className}>
      <p className="sr-only">
        {plan.from ? 'From ' : ''}
        {usd(price)} per month, {annual ? `billed ${usd(yearly)} yearly` : 'billed monthly'}
      </p>
      <div aria-hidden className="flex items-baseline gap-2 leading-none">
        {plan.from ? <span className="text-[15px] font-medium text-text-2">From</span> : null}
        <span className="font-display text-[56px] font-medium tracking-[-0.035em] text-text-1 tabular">
          <Rolling value={usd(price)} />
        </span>
        <span className="text-[15px] text-text-3">/ month</span>
      </div>
      <div aria-hidden className="mt-3 grid text-[13px] leading-5 text-text-3">
        <span
          className={cn(
            '[grid-area:1/1] transition-[opacity,translate] duration-[400ms] ease-out-expo',
            annual ? '-translate-y-1.5 opacity-0' : 'opacity-100',
          )}
        >
          Billed monthly
        </span>
        <span
          className={cn(
            '[grid-area:1/1] transition-[opacity,translate] duration-[400ms] ease-out-expo',
            annual ? 'opacity-100' : 'translate-y-1.5 opacity-0',
          )}
        >
          Billed {usd(yearly)} yearly
        </span>
      </div>
    </div>
  );
}
