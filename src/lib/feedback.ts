/**
 * "How well did I do?" — the private client feedback form at /feedback.
 *
 * The page is unlisted: no nav link, no sitemap entry, noindex.
 */

export const FEEDBACK_PATH = '/feedback'
export const FEEDBACK_API = '/api/feedback'

export const RATING_QUESTIONS = [
  { id: 'communication', label: 'Communication' },
  { id: 'quality', label: 'Quality of work' },
  { id: 'reliability', label: 'On time' },
  { id: 'understanding', label: 'Understood your needs' },
  { id: 'overall', label: 'Overall' },
] as const

export type RatingId = (typeof RATING_QUESTIONS)[number]['id']

/** Ratings slide smoothly from 1 to 10 and are kept to one decimal place. */
export const RATING_MIN = 1
export const RATING_MAX = 10

export type Ratings = Record<RatingId, number | null>

export function roundRating(value: number): number {
  return Math.round(value * 10) / 10
}

export type Feedback = {
  name: string
  project: string
  /** null means the client left that slider untouched. */
  ratings: Ratings
  didWell: string
  doBetter: string
  reference: string
  shareable: boolean
}

export function clean(value: unknown, max = 200): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

export function cleanMultiline(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n/g, '\n').trim().slice(0, max)
}

export type ParseResult = { ok: true; feedback: Feedback } | { ok: false; error: string }

export function parseFeedback(raw: Record<string, unknown>): ParseResult {
  const rawRatings = (raw.ratings ?? {}) as Record<string, unknown>
  const ratings = {} as Ratings
  for (const q of RATING_QUESTIONS) {
    const given = rawRatings[q.id]
    if (given === null || given === undefined) {
      ratings[q.id] = null
      continue
    }
    const value = Number(given)
    if (!Number.isFinite(value) || value < RATING_MIN || value > RATING_MAX) {
      return { ok: false, error: 'One of the ratings did not come through. Please try again.' }
    }
    ratings[q.id] = roundRating(value)
  }

  const feedback: Feedback = {
    name: clean(raw.name),
    project: clean(raw.project),
    ratings,
    didWell: cleanMultiline(raw.didWell),
    doBetter: cleanMultiline(raw.doBetter),
    reference: cleanMultiline(raw.reference),
    shareable: raw.shareable === true,
  }

  const saidSomething =
    averageRating(ratings) !== null || feedback.didWell || feedback.doBetter || feedback.reference
  if (!saidSomething) {
    return { ok: false, error: 'Rate or write something first.' }
  }

  if (feedback.reference && !feedback.name) {
    return { ok: false, error: 'Add your name to recommend me.' }
  }

  return { ok: true, feedback }
}

/** Average of the sliders the client moved; null if they moved none. */
export function averageRating(ratings: Ratings): number | null {
  const values = RATING_QUESTIONS.map((q) => ratings[q.id]).filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return roundRating(values.reduce((a, b) => a + b, 0) / values.length)
}

export function feedbackEmail(feedback: Feedback, receivedAt: string): { subject: string; text: string } {
  const who = feedback.name || 'an anonymous client'
  const on = feedback.project ? ` on ${feedback.project}` : ''
  const average = averageRating(feedback.ratings)
  const sharing = feedback.shareable ? 'OK to share' : 'private'

  const score = average === null ? 'no ratings' : `${average}/10`

  const subject = `Feedback from ${who}${on}: ${score}, ${sharing}`

  const ratingLines = RATING_QUESTIONS.map((q) => {
    const value = feedback.ratings[q.id]
    return `  ${q.label}: ${value === null ? 'not rated' : `${value}/10`}`
  })

  const recommendation = feedback.reference
    ? ['Would you recommend me? Why?', feedback.reference, `— ${feedback.name}`]
    : ['Would you recommend me? Why?', '(nothing written)']

  const text = [
    'How well did I do? A new response.',
    '',
    `From: ${feedback.name || '(anonymous)'}`,
    `Project: ${feedback.project || '(not given)'}`,
    feedback.shareable
      ? 'Sharing: YES. They are happy for this feedback to be shared with others.'
      : 'Sharing: NO. Keep this private.',
    '',
    'Ratings:',
    ...ratingLines,
    `  Average: ${average === null ? 'not rated' : `${average}/10`}`,
    '',
    'What did I do well?',
    feedback.didWell || '(nothing written)',
    '',
    'What could I do better?',
    feedback.doBetter || '(nothing written)',
    '',
    ...recommendation,
    '',
    `Received: ${receivedAt}`,
  ].join('\n')

  return { subject, text }
}
