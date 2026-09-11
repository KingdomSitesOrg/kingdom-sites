import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession, newId, newSignerToken } from '@/lib/sign/auth'
import { appendAudit } from '@/lib/sign/audit'
import { defaultSignatureField } from '@/lib/sign/pdf'
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
    if (existing.status === 'completed') {
      return NextResponse.json({ ok: false, error: 'Completed envelopes cannot be edited.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => null)) as {
      title?: string
      signers?: { name: string; email: string; id?: string }[]
      fields?: FieldPlacement[]
    } | null
    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
    }

    let envelope = { ...existing }
    if (typeof body.title === 'string' && body.title.trim()) {
      envelope.title = body.title.trim()
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
        if (prev) {
          nextSigners.push({ ...prev, name, email })
        } else {
          nextSigners.push({
            id: newId('sig'),
            name,
            email,
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
      envelope.fields = body.fields.filter(
        (f) =>
          f &&
          typeof f.id === 'string' &&
          (f.type === 'signature' || f.type === 'date') &&
          typeof f.signerId === 'string' &&
          signerIds.has(f.signerId) &&
          typeof f.page === 'number' &&
          f.page >= 1 &&
          f.page <= envelope.pageCount,
      )
    }

    // After signers + fields merge: every signer gets a signature box (defaults if missing).
    {
      const list = envelope.signers
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        if (!envelope.fields.some((f) => f.signerId === s.id && f.type === 'signature')) {
          envelope.fields.push(defaultSignatureField(s.id, envelope.pageCount, i))
        }
      }
      const keep = new Set(list.map((s) => s.id))
      envelope.fields = envelope.fields.filter((f) => keep.has(f.signerId))
    }

    envelope = appendAudit(envelope, 'updated', session.email)
    await saveEnvelope(envelope)
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
