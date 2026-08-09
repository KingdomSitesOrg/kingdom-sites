import { NextResponse } from 'next/server'

/**
 * Free-look funnel retired. Product enquiries use POST /api/inquiry.
 * GET/POST here point people at the new path.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MESSAGE =
  'The free-look form is no longer available. Use /get-started or POST /api/inquiry for a product-ownership enquiry.'

export async function GET() {
  return NextResponse.json(
    { ok: false, error: MESSAGE, inquiry: '/api/inquiry', page: '/get-started' },
    { status: 410 },
  )
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: MESSAGE,
      inquiry: '/api/inquiry',
      page: '/get-started',
    },
    { status: 410 },
  )
}
