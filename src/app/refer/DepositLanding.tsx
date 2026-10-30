import type { CSSProperties } from 'react'
import { JOIN_GIFT } from '@/lib/referrals'

/* The first thing the referral page shows: the gift landing in a bank account.
   A deposit from Kingdom Sites slides in at the top of a checking account's
   activity, its check mark pops and draws itself, and the amount rolls up to
   the join gift, marked "up to" since a smaller project earns $100 (T-303). It plays once as the page opens, in CSS only (globals.css,
   the "deposit-" classes), and anyone who asks for less motion sees the last
   frame. Drawn entirely in CSS and SVG, like the home page's drawings. */

const DIGITS = '01234567890123456789'
/** When the amount starts rolling, in seconds: just after the deposit lands. */
const ROLL_START = 1.2
/** The little burst around the check mark: an angle and a colour per spark. */
const SPARKS = [
  { angle: 0, color: 'var(--money)' },
  { angle: 45, color: 'var(--color-accent)' },
  { angle: 90, color: 'var(--gold)' },
  { angle: 135, color: 'var(--money)' },
  { angle: 180, color: 'var(--color-accent)' },
  { angle: 225, color: 'var(--gold)' },
  { angle: 270, color: 'var(--money)' },
  { angle: 315, color: 'var(--gold)' },
]

/** One digit of the amount: a strip of 0 to 9, twice, that rolls to its digit. */
function RollingDigit({ digit, index }: { digit: number; index: number }) {
  return (
    <span
      className="deposit-digit"
      style={{ '--digit': digit, '--roll-delay': `${ROLL_START + index * 0.09}s` } as CSSProperties}
    >
      <span className="deposit-strip">
        {DIGITS.split('').map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
    </span>
  )
}

/** A grey, older line in the account's activity, pushed down by the deposit. */
function OlderRow() {
  return (
    <div className="deposit-row">
      <span className="size-10 flex-none rounded-full bg-surface-2" />
      <div className="min-w-0 flex-1">
        <span className="block h-2.5 w-24 rounded-full bg-ink/12" />
        <span className="mt-2 block h-2 w-16 rounded-full bg-ink/[0.07]" />
      </div>
      <span className="h-2.5 w-12 rounded-full bg-ink/10" />
    </div>
  )
}

export default function DepositLanding({ className = '' }: { className?: string }) {
  const amount = JOIN_GIFT.toLocaleString('en-US').split('')
  const isDigit = (char: string) => /\d/.test(char)

  return (
    <div className={`deposit-card w-full max-w-sm text-left ${className}`} aria-hidden="true">
      {/* The account */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-[12.5px] font-medium text-body">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-muted">
            <path
              d="M2 6.2 8 2.5l6 3.7M3.5 7v5M6.5 7v5M9.5 7v5M12.5 7v5M2 13.5h12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Checking
          <span className="text-muted">•• 4821</span>
        </span>
        <span className="text-[12px] text-muted">Today</span>
      </div>

      {/* Its activity: the deposit lands on top, the older rows move down */}
      <div className="deposit-window">
        <div className="deposit-list">
          <div className="deposit-row deposit-new">
            <span className="relative flex-none">
              {SPARKS.map((spark) => (
                <span
                  key={spark.angle}
                  className="deposit-spark"
                  style={{ '--angle': `${spark.angle}deg`, background: spark.color } as CSSProperties}
                />
              ))}
              <span className="deposit-check">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    className="deposit-tick"
                    d="M6.5 12.5 10.2 16 17.5 8.5"
                    pathLength={1}
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">Kingdom Sites</p>
              <p className="truncate text-[12.5px] text-muted">Referral gift · Just now</p>
            </div>
            <p className="deposit-amount">
              <span className="mr-1.5 text-[12.5px] font-medium text-muted">up to</span>
              +$
              {amount.map((char, i) =>
                isDigit(char) ? (
                  <RollingDigit
                    key={i}
                    digit={Number(char)}
                    index={amount.slice(0, i).filter(isDigit).length}
                  />
                ) : (
                  <span key={i}>{char}</span>
                ),
              )}
              .00
            </p>
          </div>
          <OlderRow />
          <OlderRow />
        </div>
      </div>
    </div>
  )
}
