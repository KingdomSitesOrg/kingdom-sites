import './ministry.css'

export default function MinistryLayout({ children }: { children: React.ReactNode }) {
  // The ministry pages keep their own manuscript identity, so they render without
  // the Kingdom Sites header and footer (see AppShell) and inside their own scope.
  return <div className="mnst">{children}</div>
}
