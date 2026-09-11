import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession, newId, newSignerToken } from '@/lib/sign/auth'
import { appendAudit } from '@/lib/sign/audit'
import { defaultSignatureField, lockedEnvelopeStructuralError, maxPageInRawFields, mergeSigner, sanitizeField } from '@/lib/sign/placement'
import { deleteEnvelope, getEnvelope, saveEnvelope } from '@/lib/sign/store'
import type { FieldPlacement, Signer } from '@/lib/sign/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Ctx = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) throw new AuthError()
  return session
}

function normalizeRole(raw: unknown, fallback = 'Signer'): string {
  const role = String(raw ?? fallback).trim().slice(0, 60)
  return role || fallback
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin()
    const { id } = await ctx.params
    const envelope = await getEnvelope(id)
    if (!envelope) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, envelope })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not load envelope.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const session = await requireAdmin()
    const { id } = await ctx.params
    const existing = await getEnvelope(id)
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }
    const body = (await request.json().catch(() => null)) as {
      title?: string
      signers?: { name: string; email: string; role?: string; id?: string }[]
      fields?: unknown[]
      pageCount?: number
    } | null
    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
    }

    // Once sent/completed: reject title/signers/fields (race with magic-link signatures).
    // pageCount-only bumps from pdf.js remain allowed for display consistency.
    const lockError = lockedEnvelopeStructuralError(existing.status, body)
    if (lockError) {
      return NextResponse.json({ ok: false, error: lockError }, { status: 400 })
    }

    let envelope = { ...existing }
    if (typeof body.title === 'string' && body.title.trim()) {
      envelope.title = body.title.trim()
    }

    if (typeof body.pageCount === 'number' && Number.isFinite(body.pageCount)) {
      const n = Math.round(body.pageCount)
      if (n > envelope.pageCount) envelope.pageCount = n
    }

    if (Array.isArray(body.signers)) {
      const prevByEmail = new Map(existing.signers.map((s) => [s.email.toLowerCase(), s]))
      const nextSigners: Signer[] = []
      for (const raw of body.signers) {
        const name = String(raw.name || '').trim()
        const email = String(raw.email || '').trim()
        if (!name || !email) continue
        const prev = raw.id
          ? existing.signers.find((s) => s.id === raw.id)
          : prevByEmail.get(email.toLowerCase())
        const role = normalizeRole(raw.role, prev?.role || 'Signer')
        if (prev) {
          // Preserve signed/token from existing — admin drafts omit status and must
          // never downgrade a Client who signed via magic link while autosave runs.
          nextSigners.push(
            mergeSigner(
              { ...prev, name, email, role: role || prev.role || 'Signer' },
              prev,
            ),
          )
        } else {
          nextSigners.push({
            id: newId('sig'),
            name,
            email,
            role,
            token: newSignerToken(),
            status: 'pending',
          })
        }
      }
      envelope.signers = nextSigners
      const signerIds = new Set(nextSigners.map((s) => s.id))
      envelope.fields = envelope.fields.filter((f) => signerIds.has(f.signerId))
    }

    if (Array.isArray(body.fields)) {
      const signerIds = new Set(envelope.signers.map((s) => s.id))
      // PdfScrollViewer may show more pages than a stale envelope.pageCount.
      // Expand first so sanitize cannot drop last-page placements.
      const discovered = maxPageInRawFields(body.fields)
      if (discovered > envelope.pageCount) {
        envelope.pageCount = discovered
      }
      const sanitized: FieldPlacement[] = []
      for (const raw of body.fields) {
        const field = sanitizeField(raw, signerIds, envelope.pageCount)
        if (field) sanitized.push(field)
      }
      // Also expand from sanitized pages (belt-and-suspenders).
      const maxSaved = sanitized.reduce((m, f) => Math.max(m, f.page), envelope.pageCount)
      if (maxSaved > envelope.pageCount) envelope.pageCount = maxSaved
      envelope.fields = sanitized
    }

    // Only backfill defaults when the client omitted fields (e.g. signer-only save).
    // If fields were sent, trust sanitize — do not re-inject bottom defaults.
    if (!Array.isArray(body.fields)) {
      const list = envelope.signers
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        if (!envelope.fields.some((f) => f.signerId === s.id && f.type === 'signature')) {
          envelope.fields.push(defaultSignatureField(s.id, i))
        }
      }
    }
    {
      const keep = new Set(envelope.signers.map((s) => s.id))
      envelope.fields = envelope.fields.filter((f) => keep.has(f.signerId))
    }

    // Normalize missing roles on older envelopes
    envelope.signers = envelope.signers.map((s) => ({
      ...s,
      role: normalizeRole(s.role, 'Signer'),
    }))

    envelope = appendAudit(envelope, 'updated', session.email)
    // Return merged blob state so admin UI does not flash pending over a durable Client signature.
    envelope = await saveEnvelope(envelope)
    return NextResponse.json({ ok: true, envelope })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not update envelope.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin()
    const { id } = await ctx.params
    await deleteEnvelope(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not delete envelope.' }, { status: 500 })
  }
}
