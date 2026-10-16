import type { Metadata } from 'next'
import FeedbackForm from '@/components/FeedbackForm'
import { clean } from '@/lib/feedback'

export const metadata: Metadata = {
  title: 'How well did Thomas do?',
  description: 'Private feedback for Thomas Klein from the clients he has worked with.',
  robots: { index: false, follow: false },
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const name = clean(params.name)
  const project = clean(params.project)

  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-10 pt-16 sm:px-8 sm:pb-14 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          {project ? <p className="eyebrow text-accent">Feedback on {project}</p> : null}
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            How well did <span className="text-accent">Thomas</span> do?
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            {name ? `Thank you for working with me, ${name.split(' ')[0]}. ` : 'Thank you for working with me. '}
            A few honest minutes from you helps me do better work for the next person. The
            criticism is the useful part, so do not hold it back.
          </p>
        </div>
      </section>

      <section aria-label="Feedback" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-xl">
          <FeedbackForm defaultName={name} defaultProject={project} />
        </div>
      </section>
    </div>
  )
}
