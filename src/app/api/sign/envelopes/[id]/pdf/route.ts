import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError, getAdminSession } from '@/lib/sign/auth'
import { findEnvelopeBySignerToken, getEnvelope, readPdf } from '@/lib/sign/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const which = url.searchParams.get('which') === 'completed' ? 'completed' : 'original'

    const session = await getAdminSession()
    let envelope = session ? await getEnvelope(id) : null

    if (!envelope && token) {
      const found = await findEnvelopeBySignerToken(token)
      if (found && found.envelope.id === id) {
        envelope = found.envelope
      }
    }

    if (!envelope) {
      if (!session) throw new AuthError()
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }

    const key =
      which === 'completed' && envelope.completedPdfKey
        ? envelope.completedPdfKey
        : envelope.originalPdfKey
    const bytes = await readPdf(key)
    const filename = `${envelope.title.replace(/[^\w.\- ]+/g, '').slice(0, 60) || 'document'}.pdf`

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not load PDF.' }, { status: 500 })
  }
}
