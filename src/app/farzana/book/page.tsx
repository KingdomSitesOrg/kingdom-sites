import type { Metadata } from 'next'

import { Diamond } from '../_ui/diamond'

import { BookCallForm } from './book-call-form'

export const metadata: Metadata = {
  title: 'Book a call · Farzana',
  description:
    'A quick call about your classes and your families, then Farzana set up to look like you.',
}

/**
 * Where every "Book a call" on the Farzana page leads. For now it is a
 * request: the visitor says when suits them and Thomas replies with a time.
 * His own calendar takes this page's place later (THO-200).
 */

const WHAT_HAPPENS = [
  'We talk about your classes, your families and what is eating your week',
  'You see Farzana with classes like yours',
  'We set it up to look like you, and bring your students over',
]

export default function BookPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
      <div className="flex flex-col gap-6">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Diamond size={8} />
          Book a call
        </span>
        <h1 className="text-display text-balance">Book a 15-minute call</h1>
        <p className="max-w-md text-pretty text-lg text-muted">
          A quick call with me about how you teach. Then we set Farzana up to look like you.
        </p>
        <ul className="flex flex-col gap-3">
          {WHAT_HAPPENS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-ink">
              <Diamond size={10} className="mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="surface-card relative rounded-lg p-6 sm:p-8">
        <BookCallForm />
      </div>
    </main>
  )
}
