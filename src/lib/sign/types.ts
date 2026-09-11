/** Kingdom Sites Sign — shared types (MVP). */

export type FieldType = 'signature' | 'date'

export type AuditAction =
  | 'created'
  | 'updated'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'completed'
  | 'downloaded'

export type AuditEntry = {
  at: string
  action: AuditAction
  actor: string
  detail?: string
}

export type FieldPlacement = {
  id: string
  type: FieldType
  signerId: string
  /** 1-based page index */
  page: number
  /** Fractions of page width/height (origin top-left) */
  x: number
  y: number
  width: number
  height: number
}

export type Signer = {
  id: string
  name: string
  email: string
  /** Display role under the signature line (e.g. Client, Provider). */
  role: string
  token: string
  status: 'pending' | 'signed'
  signedAt?: string
  /** PNG data URL captured at sign time (kept for audit; PDF is stamped separately) */
  signaturePng?: string
  signedDateText?: string
}

export type EnvelopeStatus = 'draft' | 'sent' | 'completed'

export type Envelope = {
  id: string
  title: string
  status: EnvelopeStatus
  createdAt: string
  updatedAt: string
  pageCount: number
  /** Storage keys (local path segment or blob pathname) */
  originalPdfKey: string
  completedPdfKey?: string
  signers: Signer[]
  fields: FieldPlacement[]
  audit: AuditEntry[]
}

export type EnvelopeSummary = Pick<
  Envelope,
  'id' | 'title' | 'status' | 'createdAt' | 'updatedAt' | 'pageCount'
> & {
  signerCount: number
  signedCount: number
}
