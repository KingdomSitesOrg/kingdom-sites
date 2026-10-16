/**
 * "How well did Thomas do?" — the private client feedback form at /feedback.
 *
 * The page is unlisted (no nav link, no sitemap entry, noindex). Share it as
 * /feedback?name=Alexis&project=Jam%20with%20Latin to fill in who it is for.
 */

export const FEEDBACK_PATH = '/feedback'
export const FEEDBACK_API = '/api/feedback'

export const RATING_QUESTIONS = [
  {
    id: 'communication',
    label: 'Communication',
    hint: 'Kept you informed and was easy to reach.',
  },
  {
    id: 'quality',
    label: 'Quality of the work',
    hint: 'What he built works and holds up.',
  },
  {
    id: 'reliability',
    label: 'Delivered when promised',
    hint: 'Did what he said, when he said he would.',
  },
  {
    id: 'understanding',
    label: 'Understood what you needed',
    hint: 'Got the problem behind the request.',
  },
  {
    id: 'overall',
    label: 'Overall',
    hint: 'How the whole project felt to you.',
  },
] as const

export type RatingId = (typeof RATING_QUESTIONS)[number]['id']

export const RATING_SCALE = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Very good' },
  { value: 5, label: 'Excellent' },
] as const

export type Feedback = {
  name: string
  project: string
  ratings: Record<RatingId, number>
  didWell: string
  doBetter: string
  reference: string
  referenceName: string
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
  const ratings = {} as Record<RatingId, number>
  for (const q of RATING_QUESTIONS) {
    const value = Number(rawRatings[q.id])
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return { ok: false, error: 'Please give a rating for every question.' }
    }
    ratings[q.id] = value
  }

  const feedback: Feedback = {
    name: clean(raw.name),
    project: clean(raw.project),
    ratings,
    didWell: cleanMultiline(raw.didWell),
    doBetter: cleanMultiline(raw.doBetter),
    reference: cleanMultiline(raw.reference),
    referenceName: clean(raw.referenceName),
    shareable: raw.shareable === true,
  }

  if (feedback.reference && !feedback.referenceName && !feedback.name) {
    return { ok: false, error: 'Add the name your reference should appear under.' }
  }

  return { ok: true, feedback }
}

export function averageRating(ratings: Record<RatingId, number>): number {
  const values = RATING_QUESTIONS.map((q) => ratings[q.id])
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

export function feedbackEmail(feedback: Feedback, receivedAt: string): { subject: string; text: string } {
  const who = feedback.name || 'an anonymous client'
  const on = feedback.project ? ` on ${feedback.project}` : ''
  const average = averageRating(feedback.ratings)
  const sharing = feedback.shareable ? 'OK to share' : 'private'

  const subject = `Feedback from ${who}${on}: ${average}/5, ${sharing}`

  const ratingLines = RATING_QUESTIONS.map(
    (q) => `  ${q.label}: ${feedback.ratings[q.id]}/5`,
  )

  const referenceBlock = feedback.reference
    ? [
        'Reference for future clients:',
        feedback.reference,
        `— ${feedback.referenceName || feedback.name}`,
      ]
    : ['Reference for future clients: (none)']

  const text = [
    'How well did Thomas do? A new response.',
    '',
    `From: ${feedback.name || '(anonymous)'}`,
    `Project: ${feedback.project || '(not given)'}`,
    feedback.shareable
      ? 'Sharing: YES. They are happy for this feedback to be shared with others.'
      : 'Sharing: NO. Keep this private.',
    '',
    'Ratings:',
    ...ratingLines,
    `  Average: ${average}/5`,
    '',
    'What he did well:',
    feedback.didWell || '(nothing written)',
    '',
    'What he could do better:',
    feedback.doBetter || '(nothing written)',
    '',
    ...referenceBlock,
    '',
    `Received: ${receivedAt}`,
  ].join('\n')

  return { subject, text }
}
