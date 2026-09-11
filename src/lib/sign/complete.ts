import * as Sentry from '@sentry/nextjs'
import { appendAudit } from '@/lib/sign/audit'
import { sendCompletedPdfEmail } from '@/lib/sign/email'
import { allSignersSigned, mergeSigner } from '@/lib/sign/placement'
import { stampEnvelopePdf } from '@/lib/sign/pdf'
import { getEnvelope, readPdf, saveEnvelope, savePdf } from '@/lib/sign/store'
import type { Envelope } from '@/lib/sign/types'

export { allSignersSigned, needsCompletedPdf } from '@/lib/sign/placement'

/** Keep first successful signatures when a concurrent re-read races a draft autosave. */
export function protectSignedSigners(
  current: Envelope,
  previous: Envelope | null,
): Envelope {
  if (!previous) return current
  const prevById = new Map(previous.signers.map((s) => [s.id, s]))
  const signers = current.signers.map((s) => mergeSigner(s, prevById.get(s.id)))
  for (const prev of previous.signers) {
    if (!signers.some((s) => s.id === prev.id)) signers.push(prev)
  }
  return { ...current, signers }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Re-read up to 3 times so Blob eventual consistency / draft races do not
 * falsely report a missing signature and skip stamp+email.
 */
export async function loadEnvelopeReadyToComplete(
  envelopeId: string,
  opts?: { get?: typeof getEnvelope; delaysMs?: number[] },
): Promise<Envelope | null> {
  const load = opts?.get ?? getEnvelope
  const delays = opts?.delaysMs ?? [200, 400]
  let best: Envelope | null = null

  for (let attempt = 0; attempt < 1 + delays.length; attempt++) {
    const loaded = await load(envelopeId)
    if (loaded) {
      best = protectSignedSigners(loaded, best)
      if (best.status === 'completed' && best.completedPdfKey) return best
      if (allSignersSigned(best)) return best
    }
    if (attempt < delays.length) await sleep(delays[attempt]!)
  }
  return best
}

/**
 * Stamp PDF and persist status=completed (no email).
 * Await this on the last-signer request path so completed PDF is durable
 * even when after()/waitUntil is flaky.
 */
export async function stampAndPersistCompleted(
  envelopeId: string,
): Promise<Envelope | null> {
  let envelope = await loadEnvelopeReadyToComplete(envelopeId)
  if (!envelope) return null
  if (envelope.status === 'completed' && envelope.completedPdfKey) return envelope
  if (!allSignersSigned(envelope)) return null

  const original = await readPdf(envelope.originalPdfKey)
  const stamped = await stampEnvelopePdf(original, envelope)
  const completedKey = await savePdf(`pdfs/${envelope.id}-completed.pdf`, stamped)
  // Keep stored custom placements — never reinject defaultSignatureField tops here.
  const fieldsToKeep = envelope.fields
  envelope = {
    ...envelope,
    status: 'completed',
    completedPdfKey: completedKey,
    fields: fieldsToKeep,
  }
  envelope = appendAudit(envelope, 'completed', 'system', 'All parties signed')
  // Durable completed write before email so a Resend failure cannot leave parties unsigned-looking.
  // saveEnvelope mergeEnvelope must not replace custom fields with factory defaults.
  envelope = await saveEnvelope(envelope)
  return envelope
}

/** Email the completed PDF to parties + admin. Safe to run in after()/waitUntil. */
export async function emailCompletedEnvelope(envelope: Envelope): Promise<void> {
  if (!envelope.completedPdfKey) return
  try {
    const recipients = Array.from(
      new Set([
        ...envelope.signers.map((s) => s.email),
        process.env.ADMIN_EMAIL?.trim() || '',
        process.env.LEAD_TO_EMAIL?.trim() || '',
      ]),
    ).filter(Boolean)

    if (!process.env.RESEND_API_KEY?.trim() || !recipients.length) return

    const stamped = await readPdf(envelope.completedPdfKey)
    const filename = `${envelope.title.replace(/[^\w.\- ]+/g, '').slice(0, 60) || 'document'}-signed.pdf`
    await sendCompletedPdfEmail({
      to: recipients,
      title: envelope.title,
      pdf: Buffer.from(stamped),
      filename,
    })
  } catch (emailError) {
    Sentry.captureException(emailError)
  }
}

/**
 * Stamp PDF, persist status=completed FIRST, then email parties.
 * Proceeds when every signer is signed even if status is still `sent` or wrongly `draft`.
 * Email failures are caught — completed state stays durable.
 */
export async function completeEnvelopeAfterAllSigned(
  envelopeId: string,
): Promise<Envelope | null> {
  const envelope = await stampAndPersistCompleted(envelopeId)
  if (!envelope) return null
  await emailCompletedEnvelope(envelope)
  return envelope
}
