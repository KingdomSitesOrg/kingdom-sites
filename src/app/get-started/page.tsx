import type { Metadata } from 'next'
import CalendlyEmbed from '@/components/CalendlyEmbed'
import InquiryForm from '@/components/InquiryForm'
import { CALENDLY_FIT_URL } from '@/lib/contact'
import { INQUIRY, RETAINER } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Start a conversation',
  description:
    'Tell me what you have in mind, or book a free talk. Mobile apps and related software on a monthly retainer, quoted after we talk. No pressure.',
  alternates: { canonical: '/get-started' },
}

export default function GetStarted() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Tell me what you have <span className="text-accent">in mind.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            {INQUIRY.sub}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            {RETAINER.line}
          </p>
        </div>
      </section>

      <section aria-label="Enquiry" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="self-start">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">{INQUIRY.formTitle}</h2>
            <InquiryForm />
          </div>

          <div className="self-start">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-ink">
              {INQUIRY.calendarTitle}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-muted">{INQUIRY.calendarHint}</p>
            <CalendlyEmbed url={CALENDLY_FIT_URL} title="Book a free talk" />
          </div>
        </div>
      </section>
    </div>
  )
}
