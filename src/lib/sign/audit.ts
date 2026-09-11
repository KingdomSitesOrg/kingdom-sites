import type { AuditAction, AuditEntry, Envelope } from './types'

export function appendAudit(
  envelope: Envelope,
  action: AuditAction,
  actor: string,
  detail?: string,
): Envelope {
  const entry: AuditEntry = {
    at: new Date().toISOString(),
    action,
    actor,
    detail,
  }
  return {
    ...envelope,
    updatedAt: entry.at,
    audit: [...envelope.audit, entry],
  }
}
