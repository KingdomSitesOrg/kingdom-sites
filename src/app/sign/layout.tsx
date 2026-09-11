import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign',
  description: 'Kingdom Sites Sign — send and sign PDF agreements.',
  robots: { index: false, follow: false },
}

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-dvh bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/sign" className="text-sm font-semibold tracking-tight text-ink">
            Kingdom Sites <span className="text-accent">Sign</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign/pricing" className="btn-ghost-sm">
              Plans
            </Link>
            <Link href="/" className="btn-ghost-sm">
              kingdom-sites.com
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
