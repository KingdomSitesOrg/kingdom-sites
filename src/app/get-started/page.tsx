import type { Metadata } from 'next'
import InquiryForm from '@/components/InquiryForm'
import { IntelligenceInline } from '@/components/intelligence/Intelligence'
import { INQUIRY, QUOTE_LINE } from '@/lib/partnership'
import { shareCard } from '@/lib/seo'

const DESCRIPTION =
  'Tell me what you have in mind — a website, a mobile app, a system for your business, or help putting AI to work. You and I talk first; a quote comes once I understand the project. No pressure.'

export const metadata: Metadata = {
  title: 'Start a conversation',
  description: DESCRIPTION,
  alternates: { canonical: '/get-started' },
  ...shareCard('Start a conversation — Kingdom Sites', DESCRIPTION, '/get-started'),
}

export default function GetStarted() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Side by side from 760px (an iPad, a fold phone opened out; T-383): the intro and
          Intelligence on the left, the note on the right. A desktop's wider columns from lg. */}
      <div className="cn-wrap grid gap-12 pb-20 pt-16 sm:pb-28 sm:pt-24 min-[760px]:grid-cols-2 min-[760px]:gap-8 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-20">
        <section className="min-w-0 min-[760px]:max-lg:flex min-[760px]:max-lg:flex-col lg:sticky lg:top-28 lg:self-start">
          <p className="cn-kicker cn-rise">Start a conversation</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
            Tell me what you have <span className="text-accent">in mind.</span>
          </h1>
          <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">{INQUIRY.sub}</p>
          <p className="cn-rise cn-rise-3 mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">{QUOTE_LINE}</p>
          <div className="ki-fill cn-rise cn-rise-3 mt-8">
            <IntelligenceInline />
          </div>
        </section>

        <section aria-label="Enquiry" className="cn-rise cn-rise-3">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">{INQUIRY.formTitle}</h2>
          <InquiryForm />
        </section>
      </div>
    </div>
  )
}
