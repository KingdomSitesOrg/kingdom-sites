import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession, newId, newSignerToken } from '@/lib/sign/auth'
import { appendAudit } from '@/lib/sign/audit'
import { countPdfPages, defaultSignatureField } from '@/lib/sign/pdf'
import { listEnvelopes, saveEnvelope, savePdf } from '@/lib/sign/store'
import type { Envelope, Signer } from '@/lib/sign/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) throw new AuthError()
  return session
}

export async function GET() {
  try {
    await requireAdmin()
    const items = await listEnvelopes()
    return NextResponse.json({ ok: true, envelopes: items })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not list envelopes.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const form = await request.formData()
    const title = String(form.get('title') || '').trim() || 'Untitled document'
    const file = form.get('pdf')
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'PDF file is required.' }, { status: 400 })
    }
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ ok: false, error: 'Only PDF files are accepted.' }, { status: 400 })
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'PDF must be under 12 MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const pageCount = await countPdfPages(bytes)
    const id = newId('env')
    const pdfKey = await savePdf(`pdfs/${id}-original.pdf`, bytes)

    const pairs: { name: string; email: string; role: string }[] = [
      {
        name: String(form.get('clientName') || form.get('signerName') || 'Client').trim() || 'Client',
        email: String(form.get('clientEmail') || form.get('signerEmail') || '').trim(),
        role: 'Client',
      },
      {
        name: String(form.get('providerName') || 'Provider').trim() || 'Provider',
        email: String(form.get('providerEmail') || '').trim(),
        role: 'Provider',
      },
    ]

    const signers: Signer[] = []
    for (const pair of pairs) {
      if (!pair.email) continue
      signers.push({
        id: newId('sig'),
        name: pair.name,
        email: pair.email,
        role: pair.role,
        token: newSignerToken(),
        status: 'pending',
      })
    }

    const now = new Date().toISOString()
    let envelope: Envelope = {
      id,
      title,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      pageCount,
      originalPdfKey: pdfKey,
      signers,
      fields: signers.map((s, i) => defaultSignatureField(s.id, i)),
      audit: [],
    }
    envelope = appendAudit(envelope, 'created', session.email, title)
    await saveEnvelope(envelope)

    return NextResponse.json({ ok: true, envelope })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not create envelope.' }, { status: 500 })
  }
}
