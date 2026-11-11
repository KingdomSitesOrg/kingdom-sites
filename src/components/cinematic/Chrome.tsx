import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import MuralHeader from '@/app/concepts/mural/_components/Header'
import { MURAL_FONTS } from '@/app/concepts/mural/_lib/fonts'
import WarmImages from './WarmImages'
import { sans } from './fonts'
import './cinematic.css'
import '@/app/concepts/mural/mural.css'
import './mural-site.css'

/** Direction 2's own header and footer around a page. */
export default function CinematicChrome({ children }: { children: React.ReactNode }) {
  return (
    // `mu mu-site` puts the mural look over the page (mural-site.css).
    <div className={`cn mu mu-site ${sans.variable} ${MURAL_FONTS}`}>
      <MuralHeader />

      <main>{children}</main>
      <WarmImages />

      <footer className="cn-wrap cn-foot flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Kingdom Sites · Rochester, Minnesota</p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={CONTACT_MAILTO} className="hover:text-[var(--fg)]">{CONTACT_EMAIL}</a>
          <Link href="/ai-tooling" className="hover:text-[var(--fg)]">AI consultation</Link>
          <Link href="/prayer" className="hover:text-[var(--fg)]">Prayer</Link>
          <Link href={INQUIRE_PATH} className="hover:text-[var(--fg)]">{INQUIRE_CTA}</Link>
        </p>
      </footer>
    </div>
  )
}
