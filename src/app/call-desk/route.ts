import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/sign/auth'
import { readCallDesk } from '@/lib/call-desk/store'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** Thomas's call desk, behind his admin sign-in. */
export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.redirect(new URL('/sign/login?next=/call-desk', request.url))
  }
  const page = await readCallDesk('index.html')
  if (!page) return new NextResponse('The call desk has not been uploaded yet.', { status: 404, headers: PRIVATE })
  return new NextResponse(page, { headers: { ...PRIVATE, 'Content-Type': 'text/html; charset=utf-8' } })
}
