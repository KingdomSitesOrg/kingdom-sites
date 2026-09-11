import { NextResponse } from 'next/server'
import { adminConfigured, getAdminSession } from '@/lib/sign/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  return NextResponse.json({
    ok: true,
    configured: adminConfigured(),
    authenticated: Boolean(session),
    email: session?.email ?? null,
  })
}
