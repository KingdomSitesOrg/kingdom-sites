import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAccount, findAccountByEmail, looksLikeEmail, normalizeEmail, renewVerifyToken } from '@/lib/sign/accounts'
import { hashPassword } from '@/lib/sign/auth'
import { sendVerifyEmail } from '@/lib/sign/email'
import { clientIp, lockedMessage, loginLockedFor, recordLoginFailure } from '@/lib/sign/login-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIN_PASSWORD = 10

/**
 * Create a Sign account and email a confirmation link. The answer is the same
 * whether or not the email already has an account, so the form cannot be used
 * to find out who uses Sign.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      name?: string
      email?: string
      password?: string
    } | null
    const name = String(body?.name || '').trim()
    const email = normalizeEmail(String(body?.email || ''))
    const password = String(body?.password || '')

    if (!name) return bad('Add your name.')
    if (!looksLikeEmail(email)) return bad('That email address does not look right.')
    if (password.length < MIN_PASSWORD) {
      return bad(`Use a password of at least ${MIN_PASSWORD} characters.`)
    }

    // Sign-ups count against the same per-address limit as wrong passwords.
    const ip = clientIp(request.headers)
    const keys = ip ? [`signup-ip:${ip}`] : []
    const wait = loginLockedFor(keys)
    if (wait > 0) {
      return NextResponse.json({ ok: false, error: lockedMessage(wait) }, { status: 429 })
    }
    recordLoginFailure(keys)

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const existing = email === adminEmail ? null : await findAccountByEmail(email)
    if (email === adminEmail) {
      // Thomas already signs in with this address; nothing to create.
    } else if (existing) {
      if (!existing.emailVerified) {
        const token = await renewVerifyToken(existing)
        await sendVerifyEmail({ to: existing.email, name: existing.name, token })
      }
    } else {
      const { account, verifyToken } = await createAccount({
        email,
        name,
        passwordHash: hashPassword(password),
      })
      await sendVerifyEmail({ to: account.email, name: account.name, token: verifyToken })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not create the account. Try again.' }, { status: 500 })
  }
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 })
}
