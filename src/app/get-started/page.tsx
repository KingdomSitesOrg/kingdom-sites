import type { Metadata } from 'next'
import InquiryForm from '@/components/InquiryForm'
import { INQUIRY, QUOTE_LINE } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Start a conversation',
  description:
    'Tell me what you have in mind — a mobile app, a tool, or a system for your business. You and I talk first; a quote comes once I understand the project. No pressure.',
  alternates: { canonical: '/get-started' },
}

export default function GetStarted() {
  return (
    <div className="w-full overflow-x-hidden">
      <div className="cn-wrap grid gap-12 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-20">
        <section className="lg:sticky lg:top-28 lg:self-start">
          <p className="cn-kicker cn-rise">Start a conversation</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
            Tell me what you have <span className="text-accent">in mind.</span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">{INQUIRY.sub}</p>
          <p className="cn-rise cn-rise-3 mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">{QUOTE_LINE}</p>
        </section>

        <section aria-label="Enquiry" className="cn-rise cn-rise-3">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">{INQUIRY.formTitle}</h2>
          <InquiryForm />
        </section>
      </div>
    </div>
  )
}
