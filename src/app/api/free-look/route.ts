import { NextResponse } from 'next/server'

/**
 * Free-look funnel is retired. Product contact is email (see CONTACT_MAILTO).
 * Keep the route so old clients get a clear Gone response without breaking the build.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      error: 'gone',
      message:
        'The free-look form is no longer available. Email thomas@kingdom-sites.com about your product or project.',
    },
    { status: 410 },
  )
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'gone',
      message: 'The free-look form is no longer available.',
    },
    { status: 410 },
  )
}
