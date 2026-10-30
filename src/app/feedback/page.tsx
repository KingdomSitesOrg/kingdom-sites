import type { Metadata } from 'next'
import FeedbackForm from '@/components/FeedbackForm'

export const metadata: Metadata = {
  title: 'How well did I do?',
  description: 'Client feedback.',
  robots: { index: false, follow: false },
}

export default function FeedbackPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="cn-wrap pb-10 pt-16 sm:pb-14 sm:pt-24">
        <div className="mx-auto max-w-xl">
          <p className="cn-kicker cn-rise">Client feedback</p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">How well did I do?</h1>
        </div>
      </section>

      <section aria-label="Feedback" className="cn-wrap pb-24 sm:pb-32">
        <div className="cn-rise cn-rise-3 mx-auto max-w-xl">
          <FeedbackForm />
        </div>
      </section>
    </div>
  )
}
