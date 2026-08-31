import type { Metadata } from 'next'
import InquiryForm from '@/components/InquiryForm'
import { INQUIRY, RETAINER } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Start a conversation',
  description:
    'Tell me what you have in mind. Mobile apps and related software on a monthly retainer, quoted after we talk. No pressure.',
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
        <div className="mx-auto max-w-xl">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">{INQUIRY.formTitle}</h2>
          <InquiryForm />
        </div>
      </section>
    </div>
  )
}
