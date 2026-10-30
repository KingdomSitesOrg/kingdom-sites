import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { INDEXNOW_ENDPOINT, changedSinceDeploy, dueToday, indexNowBody, type IndexNowManifest } from '@/lib/indexnow'
import { SITE_URL } from '@/lib/seo'

/**
 * The daily IndexNow run (T-398; the why is in src/lib/indexnow.ts). Vercel's
 * cron calls it once a day (vercel.json) with `Authorization: Bearer
 * $CRON_SECRET`. Anywhere but production, or without that secret, it sends
 * nothing.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.json({ sent: 0, skipped: 'not production' })
  }
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let manifest: IndexNowManifest | null = null
  try {
    const res = await fetch(`${SITE_URL}/indexnow.json`, { cache: 'no-store' })
    if (res.ok) manifest = (await res.json()) as IndexNowManifest
  } catch {
    // No manifest: still send today's articles.
  }

  const paths = [...new Set([...changedSinceDeploy(manifest), ...dueToday()])]
  if (paths.length === 0) return NextResponse.json({ sent: 0 })

  const body = indexNowBody(paths)
  // Visit each address first, so an hourly page that has just reached its
  // date is rebuilt before a crawler comes to read it.
  await Promise.allSettled(body.urlList.map((u) => fetch(u, { cache: 'no-store' })))

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
    if (!res.ok && res.status !== 202) {
      Sentry.captureMessage(`IndexNow refused ${body.urlList.length} addresses: ${res.status}`, 'warning')
    }
    return NextResponse.json({ sent: body.urlList.length, status: res.status, urls: body.urlList })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'IndexNow unreachable' }, { status: 502 })
  }
}
