import { cleanMultiline } from './feedback'

export const BUSINESS_FEEDBACK_QUESTIONS = {
  limitingFactor: 'What is the most limiting factor in your business today?',
  aiUse: 'Do you already use AI in your business? Why or why not?',
  supportNeeds: 'Is there anything Kingdom Sites could help with, such as building an app or website, or helping with marketing?',
}

export const BUSINESS_FEEDBACK_MAX_LENGTH = 4000

export function readBusinessFeedback(raw: Record<string, unknown>) {
  return {
    kind: 'business' as const,
    limitingFactor: cleanMultiline(raw.limitingFactor, BUSINESS_FEEDBACK_MAX_LENGTH),
    aiUse: cleanMultiline(raw.aiUse, BUSINESS_FEEDBACK_MAX_LENGTH),
    supportNeeds: cleanMultiline(raw.supportNeeds, BUSINESS_FEEDBACK_MAX_LENGTH),
  }
}

export type BusinessFeedback = ReturnType<typeof readBusinessFeedback>

export function businessFeedbackEmail(feedback: BusinessFeedback, receivedAt: string) {
  const answers = [
    [BUSINESS_FEEDBACK_QUESTIONS.limitingFactor, feedback.limitingFactor],
    [BUSINESS_FEEDBACK_QUESTIONS.aiUse, feedback.aiUse],
    [BUSINESS_FEEDBACK_QUESTIONS.supportNeeds, feedback.supportNeeds],
  ]

  return {
    subject: 'New business feedback',
    text: [
      ...answers.map(([question, answer]) => `${question}\n${answer || '(skipped)'}`),
      `Received: ${receivedAt}`,
    ].join('\n\n'),
  }
}
