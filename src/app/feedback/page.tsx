import type { Metadata } from 'next'
import FeedbackForm from '@/components/FeedbackForm'

export const metadata: Metadata = {
  title: 'How well did Thomas do?',
  description: 'Private feedback for Thomas Klein from the clients he has worked with.',
  robots: { index: false, follow: false },
}

export default function FeedbackPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-10 pt-16 sm:px-8 sm:pb-14 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            How well did <span className="text-accent">Thomas</span> do?
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Thank you for working with me. A few honest minutes from you helps me do better work
            for the next person. The criticism is the useful part, so do not hold it back.
          </p>
        </div>
      </section>

      <section aria-label="Feedback" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-xl">
          <FeedbackForm />
        </div>
      </section>
    </div>
  )
}
