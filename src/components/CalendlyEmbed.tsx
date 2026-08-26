'use client'

import Script from 'next/script'

/**
 * Official Calendly inline embed. Pass the event URL (one account, two events).
 */
export default function CalendlyEmbed({
  url,
  title,
}: {
  url: string
  title: string
}) {
  if (!url) {
    return (
      <div className="rounded-[22px] border border-line bg-surface-2 px-6 py-10 text-center">
        <p className="text-sm leading-relaxed text-body">
          The calendar is not connected yet. Use the note on this page, or email me, and we will find a time.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
      <div
        className="calendly-inline-widget"
        data-url={url}
        data-resize="true"
        title={title}
        style={{ minWidth: '320px', height: '700px' }}
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
    </div>
  )
}
