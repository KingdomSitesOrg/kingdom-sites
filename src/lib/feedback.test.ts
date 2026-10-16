import { describe, expect, it } from 'vitest'
import { averageRating, feedbackEmail, parseFeedback } from './feedback'

const allFives = { communication: 5, quality: 5, reliability: 4, understanding: 5, overall: 5 }

describe('parseFeedback', () => {
  it('needs a rating from 1 to 5 for every question', () => {
    expect(parseFeedback({ ratings: { ...allFives, overall: undefined } })).toEqual({
      ok: false,
      error: 'Please give a rating for every question.',
    })
    expect(parseFeedback({ ratings: { ...allFives, quality: 6 } }).ok).toBe(false)
    expect(parseFeedback({ ratings: { ...allFives, quality: 2.5 } }).ok).toBe(false)
  })

  it('is private unless sharing is explicitly ticked', () => {
    const unticked = parseFeedback({ ratings: allFives })
    const stringy = parseFeedback({ ratings: allFives, shareable: 'true' })
    const ticked = parseFeedback({ ratings: allFives, shareable: true })
    expect(unticked.ok && unticked.feedback.shareable).toBe(false)
    expect(stringy.ok && stringy.feedback.shareable).toBe(false)
    expect(ticked.ok && ticked.feedback.shareable).toBe(true)
  })

  it('allows anonymous feedback, but a reference needs a name', () => {
    expect(parseFeedback({ ratings: allFives, doBetter: 'Reply faster' }).ok).toBe(true)
    expect(parseFeedback({ ratings: allFives, reference: 'Hire him' })).toEqual({
      ok: false,
      error: 'Add the name your reference should appear under.',
    })
    expect(parseFeedback({ ratings: allFives, reference: 'Hire him', name: 'Alexis' }).ok).toBe(true)
  })
})

describe('feedbackEmail', () => {
  it('puts the average and the sharing choice in the subject', () => {
    const parsed = parseFeedback({ ratings: allFives, name: 'Alexis', project: 'Jam with Latin' })
    if (!parsed.ok) throw new Error(parsed.error)
    expect(averageRating(parsed.feedback.ratings)).toBe(4.8)
    const { subject, text } = feedbackEmail(parsed.feedback, '2026-10-16T00:00:00.000Z')
    expect(subject).toBe('Feedback from Alexis on Jam with Latin: 4.8/5, private')
    expect(text).toContain('Sharing: NO. Keep this private.')
    expect(text).toContain('Delivered when promised: 4/5')
  })

  it('signs a reference with the name it should appear under', () => {
    const parsed = parseFeedback({
      ratings: allFives,
      shareable: true,
      reference: 'Thomas shipped on time.',
      referenceName: 'Alexis C., founder',
    })
    if (!parsed.ok) throw new Error(parsed.error)
    const { subject, text } = feedbackEmail(parsed.feedback, '2026-10-16T00:00:00.000Z')
    expect(subject).toBe('Feedback from an anonymous client: 4.8/5, OK to share')
    expect(text).toContain('Thomas shipped on time.\n— Alexis C., founder')
  })
})
