import type { Metadata } from 'next'
import BusinessFeedbackForm from './BusinessFeedbackForm'

export const metadata: Metadata = {
  title: 'Business feedback',
  description: 'Three questions about your business from Kingdom Sites.',
  robots: { index: false, follow: false },
}

export default function BusinessFeedbackPage() {
  return (
    <section className="cn-wrap pb-24 pt-12 sm:pb-32 sm:pt-20">
      <div className="mx-auto max-w-xl">
        <h1 className="cn-display cn-h2 text-balance">Business feedback</h1>
        <div className="mt-6 sm:mt-8">
          <BusinessFeedbackForm />
        </div>
      </div>
    </section>
  )
}
