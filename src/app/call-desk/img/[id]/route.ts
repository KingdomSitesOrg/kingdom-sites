import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/sign/auth'
import { IMAGE_ID, readCallDesk } from '@/lib/call-desk/store'

export const dynamic = 'force-dynamic'

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

/** A call desk screenshot. Each upload has its own name, so the browser may keep it. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return new NextResponse('Not found', { status: 404 })
  const { id } = await params
  if (!IMAGE_ID.test(id)) return new NextResponse('Not found', { status: 404 })
  const image = await readCallDesk(`img/${id}`)
  if (!image) return new NextResponse('Not found', { status: 404 })
  return new NextResponse(image, {
    headers: {
      'Content-Type': TYPES[id.split('.').pop()!],
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
