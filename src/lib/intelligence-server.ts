import { readFileSync } from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { cleanKnowledge, signingSecret } from './intelligence'

/**
 * What both Intelligence routes share on the server: the API key (from
 * ANTHROPIC_API_KEY, never sent to the browser), the client, what it knows,
 * and who is asking.
 */

let knowledge: string | null = null

/** content/intelligence.md, read once per server instance. */
export function readKnowledge(): string {
  knowledge ??= cleanKnowledge(readFileSync(path.join(process.cwd(), 'content', 'intelligence.md'), 'utf8'))
  return knowledge
}

export function apiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY?.trim() || null
}

let client: Anthropic | null = null

export function anthropic(key: string): Anthropic {
  // Two quick retries at most: a visitor is waiting.
  client ??= new Anthropic({ apiKey: key, maxRetries: 1, timeout: 25_000 })
  return client
}

export function secretFor(key: string): string {
  return signingSecret(key)
}

export function visitorOf(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/** A browser on another site can't use the chat. (A script can, so the limits still apply.) */
export function fromThisSite(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(':')[0]
  try {
    return new URL(origin).hostname === host
  } catch {
    return false
  }
}
