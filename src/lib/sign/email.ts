import * as Sentry from '@sentry/nextjs'

const EMAIL_TIMEOUT_MS = 12_000

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

function fromAddress(): string {
  return (
    process.env.SIGN_FROM_EMAIL?.trim() ||
    process.env.LEAD_FROM_EMAIL?.trim() ||
    'Kingdom Sites Sign <onboarding@resend.dev>'
  )
}

function appBaseUrl(): string {
  const explicit = process.env.SIGN_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

export function signerLink(token: string): string {
  return `${appBaseUrl()}/sign/s/${token}`
}

async function sendResend(opts: {
  to: string | string[]
  subject: string
  text: string
  html?: string
  attachments?: { filename: string; content: Buffer }[]
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return false
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter(looksLikeEmail)
  if (to.length === 0) return false

  try {
    const body: Record<string, unknown> = {
      from: fromAddress(),
      to,
      subject: opts.subject,
      text: opts.text,
    }
    if (opts.html) body.html = opts.html
    if (opts.attachments?.length) {
      body.attachments = opts.attachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
      }))
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      Sentry.captureMessage(
        `Sign email rejected (${response.status}): ${detail.slice(0, 400)}`,
        'error',
      )
      return false
    }
    return true
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

export async function sendMagicLinkEmail(opts: {
  to: string
  signerName: string
  title: string
  token: string
}): Promise<boolean> {
  const link = signerLink(opts.token)
  const subject = `Please sign: ${opts.title}`
  const text = [
    `Hi ${opts.signerName || 'there'},`,
    '',
    `You have been asked to sign “${opts.title}” via Kingdom Sites Sign.`,
    '',
    `Open this link to review and sign:`,
    link,
    '',
    'This link is unique to you. Do not forward it.',
    '',
    '— Kingdom Sites',
  ].join('\n')
  const html = `
    <p>Hi ${escapeHtml(opts.signerName || 'there')},</p>
    <p>You have been asked to sign <strong>${escapeHtml(opts.title)}</strong> via Kingdom Sites Sign.</p>
    <p><a href="${link}">Review and sign the document</a></p>
    <p style="color:#666;font-size:13px">This link is unique to you. Do not forward it.</p>
    <p>— Kingdom Sites</p>
  `
  return sendResend({ to: opts.to, subject, text, html })
}

export async function sendCompletedPdfEmail(opts: {
  to: string[]
  title: string
  pdf: Buffer
  filename: string
}): Promise<boolean> {
  const subject = `Completed: ${opts.title}`
  const text = [
    `The document “${opts.title}” has been signed by all parties.`,
    '',
    'The completed PDF is attached.',
    '',
    '— Kingdom Sites Sign',
  ].join('\n')
  return sendResend({
    to: opts.to,
    subject,
    text,
    attachments: [{ filename: opts.filename, content: opts.pdf }],
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
