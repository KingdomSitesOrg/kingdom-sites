import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes, randomInt, randomUUID } from 'crypto'
import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
import { TRACKER_TOKEN, type Payout, type PayoutMethod, type StageKey } from '@/lib/referrals'

/**
 * The referral program's records (T-293): who has a personal link, and who
 * each one sent. One private JSON document, in the same storage /sign uses:
 * private Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise .data/ on a
 * local machine. Reads skip the Blob cache so a change shows at once, and a
 * write only lands on the version it read (ETag), so two at once cannot undo
 * each other.
 */

export type Referrer = {
  /** First name and four random characters, as in `anna-7k2m`. */
  code: string
  name: string
  email: string
  /** Whether the page their link opens may say their first name. */
  showName: boolean
  createdAt: string
  /** The secret part of their private tracker's address. Never the share link. */
  trackerToken: string
  payout?: Payout
}

/** Someone a referrer sent: through their link, or told about on /refer. */
export type Referred = {
  id: string
  /** The referrer's link code. */
  code: string
  via: 'link' | 'form'
  /** The organization, or the person's own name when there is none. */
  name: string
  contactName: string
  contactEmail: string
  website: string
  note: string
  at: string
  callBookedAt?: string
  callHeldAt?: string
  callPaidAt?: string
  callPaidVia?: PayoutMethod
  signedAt?: string
  firstPaymentAt?: string
  joinPaidAt?: string
  joinPaidVia?: PayoutMethod
  /** Thomas marked that they are not going ahead. */
  endedAt?: string
}

export type ReferralsDoc = { referrers: Referrer[]; referred: Referred[] }

const BLOB_PATH = 'refer/records.json'
const LOCAL_FILE = path.join(process.cwd(), '.data', 'refer', 'records.json')

/** More links than this means somebody is filling the form in a loop. */
const MAX_REFERRERS = 5000
const MAX_REFERRED = 5000

const CODE_LETTERS = 'abcdefghjkmnpqrstuvwxyz23456789'

const now = () => new Date().toISOString()

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

const empty = (): ReferralsDoc => ({ referrers: [], referred: [] })

async function load(): Promise<{ doc: ReferralsDoc; etag: string | null }> {
  if (blobEnabled()) {
    const result = await get(BLOB_PATH, { access: 'private', useCache: false })
    if (!result || !result.stream) return { doc: empty(), etag: null }
    const text = await new Response(result.stream).text()
    return { doc: { ...empty(), ...(JSON.parse(text) as ReferralsDoc) }, etag: result.blob.etag }
  }
  // Vercel's filesystem is read-only: there it is Blob or nothing.
  if (process.env.VERCEL) throw new Error('Referral storage is not set up (BLOB_READ_WRITE_TOKEN).')
  try {
    return { doc: { ...empty(), ...JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) }, etag: null }
  } catch {
    return { doc: empty(), etag: null }
  }
}

export async function readReferrals(): Promise<ReferralsDoc> {
  return (await load()).doc
}

/** Read, change, write; again from the top if someone else wrote in between. */
async function change<T>(edit: (doc: ReferralsDoc) => T): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { doc, etag } = await load()
    const result = edit(doc)
    const json = JSON.stringify(doc, null, 2)
    if (!blobEnabled()) {
      await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
      await fs.writeFile(LOCAL_FILE, json, 'utf8')
      return result
    }
    try {
      await put(BLOB_PATH, json, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
      })
      return result
    } catch (error) {
      const raced =
        error instanceof BlobPreconditionFailedError ||
        (!etag && error instanceof Error && /already exists/i.test(error.message))
      if (!raced) throw error
    }
  }
  throw new Error('Referral records are busy. Try again.')
}

/** "Anna María López" → "anna"; a name with no plain letters → "friend". */
function codeStem(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? ''
  const plain = first
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16)
  return plain || 'friend'
}

function newCode(name: string, taken: Set<string>) {
  const stem = codeStem(name)
  for (;;) {
    let tail = ''
    for (let i = 0; i < 4; i += 1) tail += CODE_LETTERS[randomInt(CODE_LETTERS.length)]
    const code = `${stem}-${tail}`
    if (!taken.has(code)) return code
  }
}

/** A referrer's first name, the only part of them a link's page may show. */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? ''
}

/**
 * The personal link for this email address: the one it already has, or a new
 * one. Asking again with the same address never makes a second link.
 *
 * `tracker` is the private tracker's token, and only for a link made just now:
 * anybody can type somebody else's email address, so it is never handed out
 * again here. `isNew` says whether this call made the link.
 */
export async function linkFor(input: {
  name: string
  email: string
  showName: boolean
}): Promise<{ code: string; tracker: string; isNew: boolean }> {
  const email = input.email.trim().toLowerCase()
  return change((doc) => {
    const known = doc.referrers.find((r) => r.email === email)
    if (known) return { code: known.code, tracker: '', isNew: false }
    if (doc.referrers.length >= MAX_REFERRERS) throw new Error('Referral links are full.')
    const code = newCode(input.name, new Set(doc.referrers.map((r) => r.code)))
    const tracker = randomBytes(24).toString('base64url')
    doc.referrers.push({
      code,
      name: input.name.trim(),
      email,
      showName: input.showName,
      createdAt: now(),
      trackerToken: tracker,
    })
    return { code, tracker, isNew: true }
  })
}

/**
 * Whose private tracker this token opens, if anybody's. Only a token with the
 * tracker's shape is looked up, and only against tracker tokens.
 */
export function referrerByTracker(referrers: Referrer[], token: string): Referrer | null {
  if (!TRACKER_TOKEN.test(token)) return null
  return referrers.find((r) => r.trackerToken === token) ?? null
}

export async function referrerByCode(code: string): Promise<Referrer | null> {
  if (!code) return null
  const doc = await readReferrals()
  return doc.referrers.find((r) => r.code === code) ?? null
}

/** How a referrer wants their gifts sent, set from their own tracker. False when the token opens nothing. */
export async function setPayout(token: string, payout: Omit<Payout, 'updatedAt'>): Promise<boolean> {
  return change((doc) => {
    const referrer = referrerByTracker(doc.referrers, token)
    if (!referrer) return false
    referrer.payout = { ...payout, updatedAt: now() }
    return true
  })
}

const sameish = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Someone a referrer sent. One referral per person or organization, matched by
 * name or email, and the first one wins. Returns whether this one was recorded.
 */
export async function recordReferred(
  input: Omit<Referred, 'id' | 'at'>,
): Promise<boolean> {
  return change((doc) => {
    if (!doc.referrers.some((r) => r.code === input.code)) return false
    const known = doc.referred.some(
      (r) =>
        sameish(r.name, input.name) ||
        (input.contactEmail && r.contactEmail && sameish(r.contactEmail, input.contactEmail)),
    )
    if (known || doc.referred.length >= MAX_REFERRED) return false
    doc.referred.push({ ...input, id: randomUUID(), at: now() })
    return true
  })
}

const STAGE_FIELD: Record<StageKey, 'callBookedAt' | 'callHeldAt' | 'callPaidAt' | 'signedAt' | 'firstPaymentAt' | 'joinPaidAt'> = {
  callBooked: 'callBookedAt',
  callHeld: 'callHeldAt',
  callPaid: 'callPaidAt',
  signed: 'signedAt',
  firstPayment: 'firstPaymentAt',
  joinPaid: 'joinPaidAt',
}

/**
 * Thomas marks (or unmarks) a stage on a referred lead, from /sign/referrals.
 * A gift marked paid keeps how he sent it. False when there is no such lead.
 */
export async function markStage(
  id: string,
  stage: StageKey | 'ended',
  on: boolean,
  via?: PayoutMethod,
): Promise<boolean> {
  return change((doc) => {
    const lead = doc.referred.find((r) => r.id === id)
    if (!lead) return false
    const field = stage === 'ended' ? 'endedAt' : STAGE_FIELD[stage]
    if (on) lead[field] ??= now()
    else delete lead[field]
    if (stage === 'callPaid') {
      if (on && via) lead.callPaidVia = via
      if (!on) delete lead.callPaidVia
    }
    if (stage === 'joinPaid') {
      if (on && via) lead.joinPaidVia = via
      if (!on) delete lead.joinPaidVia
    }
    return true
  })
}

/** Removes a referrer and everyone they sent: for test rows and requests to be forgotten. */
export async function removeReferrer(code: string): Promise<boolean> {
  return change((doc) => {
    const before = doc.referrers.length
    doc.referrers = doc.referrers.filter((r) => r.code !== code)
    doc.referred = doc.referred.filter((r) => r.code !== code)
    return doc.referrers.length !== before
  })
}
