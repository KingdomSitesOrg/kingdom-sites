'use client'

import { useState } from 'react'

/** A value in a box with a Copy button beside it: a link, a payout handle. */
export default function CopyRow({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface py-1 pl-4 pr-1">
      <span className="min-w-0 flex-1 py-2 text-[15px] font-medium text-ink [overflow-wrap:anywhere]">
        {value}
      </span>
      <button
        type="button"
        className="btn-ghost min-h-11 shrink-0 px-4"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch {
            setCopied(false)
          }
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
