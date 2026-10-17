import { describe, expect, it } from 'vitest'
import { averageRating, feedbackEmail, parseFeedback } from './feedback'

const ratings = { communication: 9.4, quality: 8, reliability: 7.25, understanding: 10, overall: 9 }

describe('parseFeedback', () => {
  it('keeps slider values between 1 and 10, to one decimal place', () => {
    const parsed = parseFeedback({ ratings })
    expect(parsed.ok && parsed.feedback.ratings.reliability).toBe(7.3)
    expect(parseFeedback({ ratings: { ...ratings, quality: 11 } }).ok).toBe(false)
    expect(parseFeedback({ ratings: { ...ratings, quality: 0.5 } }).ok).toBe(false)
    expect(parseFeedback({ ratings: { ...ratings, quality: 'lots' } }).ok).toBe(false)
  })

  it('treats an untouched slider as not rated', () => {
    const parsed = parseFeedback({ ratings: { overall: 6.5 } })
    expect(parsed.ok && parsed.feedback.ratings).toEqual({
      communication: null,
      quality: null,
      reliability: null,
      understanding: null,
      overall: 6.5,
    })
  })

  it('needs at least one rating or some writing', () => {
    expect(parseFeedback({ ratings: {} })).toEqual({
      ok: false,
      error: 'Slide at least one rating or write a few words first.',
    })
    expect(parseFeedback({ ratings: {}, doBetter: 'Reply faster' }).ok).toBe(true)
  })

  it('is private unless sharing is explicitly ticked', () => {
    const unticked = parseFeedback({ ratings })
    const stringy = parseFeedback({ ratings, shareable: 'true' })
    const ticked = parseFeedback({ ratings, shareable: true })
    expect(unticked.ok && unticked.feedback.shareable).toBe(false)
    expect(stringy.ok && stringy.feedback.shareable).toBe(false)
    expect(ticked.ok && ticked.feedback.shareable).toBe(true)
  })

  it('allows anonymous feedback, but a reference needs a name', () => {
    expect(parseFeedback({ ratings, reference: 'Hire him' })).toEqual({
      ok: false,
      error: 'Add the name your reference should appear under.',
    })
    expect(parseFeedback({ ratings, reference: 'Hire him', name: 'Alex' }).ok).toBe(true)
  })
})

describe('feedbackEmail', () => {
  it('puts the average out of 10 and the sharing choice in the subject', () => {
    const parsed = parseFeedback({ ratings, name: 'Alex', project: 'Rivera Coffee app' })
    if (!parsed.ok) throw new Error(parsed.error)
    expect(averageRating(parsed.feedback.ratings)).toBe(8.7)
    const { subject, text } = feedbackEmail(parsed.feedback, '2026-10-17T00:00:00.000Z')
    expect(subject).toBe('Feedback from Alex on Rivera Coffee app: 8.7/10, private')
    expect(text).toContain('Sharing: NO. Keep this private.')
    expect(text).toContain('Delivered when promised: 7.3/10')
  })

  it('averages only the sliders that were moved, and says which were not', () => {
    const parsed = parseFeedback({ ratings: { quality: 6, overall: 8 }, shareable: true })
    if (!parsed.ok) throw new Error(parsed.error)
    const { subject, text } = feedbackEmail(parsed.feedback, '2026-10-17T00:00:00.000Z')
    expect(subject).toBe('Feedback from an anonymous client: 7/10, OK to share')
    expect(text).toContain('Communication: not rated')
  })

  it('says so when no slider was moved, and signs a reference', () => {
    const parsed = parseFeedback({
      ratings: {},
      reference: 'Thomas shipped on time.',
      referenceName: 'Alex R., founder',
    })
    if (!parsed.ok) throw new Error(parsed.error)
    const { subject, text } = feedbackEmail(parsed.feedback, '2026-10-17T00:00:00.000Z')
    expect(subject).toBe('Feedback from an anonymous client: no ratings, private')
    expect(text).toContain('Thomas shipped on time.\n— Alex R., founder')
  })
})
