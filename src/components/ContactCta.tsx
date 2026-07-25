import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

export default function ContactCta({ label = 'Email me', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={className}>
      <a href={CONTACT_MAILTO} className="btn-primary">{label}</a>
      <p className="mt-3 text-sm text-muted">
        <a href={CONTACT_MAILTO} className="link-accent">{CONTACT_EMAIL}</a>
      </p>
    </div>
  )
}
