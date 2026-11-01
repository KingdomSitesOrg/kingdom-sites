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

export function appBaseUrl(): string {
  const explicit = process.env.SIGN_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    const base = explicit.replace(/\/$/, '')
    // Deployed builds must never email localhost magic links (looks like a 404).
    if (process.env.VERCEL && /localhost|127\.0\.0\.1/i.test(base)) {
      return 'https://kingdom-sites.com'
    }
    return base
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

export function signerLink(token: string): string {
  return `${appBaseUrl()}/sign/s/${token}`
}

/**
 * A local mail catcher (Mailpit's web address, e.g. http://127.0.0.1:54324).
 * When set, every Sign email goes there and never to Resend, so a test run
 * cannot reach a real inbox even if a Resend key is also present.
 */
function mailCatcherUrl(): string {
  return process.env.SIGN_MAIL_CATCHER_URL?.trim().replace(/\/$/, '') || ''
}

/** True when Sign can deliver email (Resend, or the local catcher). */
export function emailConfigured(): boolean {
  return Boolean(mailCatcherUrl() || process.env.RESEND_API_KEY?.trim())
}

type OutgoingEmail = {
  to: string | string[]
  subject: string
  text: string
  html?: string
  attachments?: { filename: string; content: Buffer }[]
}

async function sendToCatcher(base: string, to: string[], opts: OutgoingEmail): Promise<boolean> {
  const from = fromAddress()
  const match = from.match(/^(.*)<([^>]+)>\s*$/)
  try {
    const response = await fetch(`${base}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      body: JSON.stringify({
        From: match ? { Name: match[1]!.trim(), Email: match[2]!.trim() } : { Email: from },
        To: to.map((Email) => ({ Email })),
        Subject: opts.subject,
        Text: opts.text,
        HTML: opts.html,
        Attachments: opts.attachments?.map((a) => ({
          Filename: a.filename,
          Content: a.content.toString('base64'),
          ContentType: 'application/pdf',
        })),
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

async function sendResend(opts: OutgoingEmail): Promise<boolean> {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter(looksLikeEmail)
  if (to.length === 0) return false
  const catcher = mailCatcherUrl()
  if (catcher) return sendToCatcher(catcher, to, opts)
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return false

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
    'Open this link to read the document and sign it. It takes about a minute, on a phone or a computer:',
    link,
    '',
    'This link is unique to you. Do not forward it.',
    '',
    '— Kingdom Sites',
  ].join('\n')
  const html = `
    <p>Hi ${escapeHtml(opts.signerName || 'there')},</p>
    <p>You have been asked to sign <strong>${escapeHtml(opts.title)}</strong> via Kingdom Sites Sign.</p>
    <p>It takes about a minute, on a phone or a computer.</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0a5fcc;color:#fff;text-decoration:none;font-weight:600">Read and sign</a></p>
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
  const subject = `Signed by everyone: ${opts.title}`
  const text = [
    `Everyone has signed “${opts.title}”.`,
    '',
    'The signed PDF is attached. Keep it for your records.',
    '',
    '— Kingdom Sites Sign',
  ].join('\n')
  const html = `
    <p>Everyone has signed <strong>${escapeHtml(opts.title)}</strong>.</p>
    <p>The signed PDF is attached. Keep it for your records.</p>
    <p>— Kingdom Sites Sign</p>
  `
  return sendResend({
    to: opts.to,
    subject,
    text,
    html,
    attachments: [{ filename: opts.filename, content: opts.pdf }],
  })
}

/** Confirm a new Sign account's email address. */
export async function sendVerifyEmail(opts: {
  to: string
  name: string
  token: string
}): Promise<boolean> {
  const link = `${appBaseUrl()}/api/sign/verify?token=${encodeURIComponent(opts.token)}`
  const text = [
    `Hi ${opts.name || 'there'},`,
    '',
    'Confirm your email to finish setting up Kingdom Sites Sign:',
    link,
    '',
    'If you did not sign up, ignore this email.',
    '',
    '— Kingdom Sites Sign',
  ].join('\n')
  const html = `
    <p>Hi ${escapeHtml(opts.name || 'there')},</p>
    <p>Confirm your email to finish setting up Kingdom Sites Sign.</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0a5fcc;color:#fff;text-decoration:none;font-weight:600">Confirm my email</a></p>
    <p style="color:#666;font-size:13px">If you did not sign up, ignore this email.</p>
  `
  return sendResend({ to: opts.to, subject: 'Confirm your email for Kingdom Sites Sign', text, html })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
