import './prayer.css'

export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  // Prayer keeps its own casual identity, so it renders without the Kingdom Sites
  // header and footer (see AppShell) and inside its own scope.
  return <div className="pray">{children}</div>
}
