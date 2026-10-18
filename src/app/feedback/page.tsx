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
      <section className="hero-wash px-5 pb-10 pt-16 sm:px-8 sm:pb-12 sm:pt-24">
        <h1 className="text-balance text-center text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
          How well did I do?
        </h1>
      </section>

      <section aria-label="Feedback" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-xl">
          <FeedbackForm />
        </div>
      </section>
    </div>
  )
}
