import type { ReactNode } from 'react'
import { MURAL_FONTS } from '../_lib/fonts'
import '../mural.css'

/* The element the mural home page lives in: its typefaces, its stylesheet, and
   the mark that says a script will bring the rising pieces in. */
export default function MuralRoot({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // The script below adds a class to this element before React takes over, hence suppressHydrationWarning.
    <div className={`mu ${MURAL_FONTS}`} suppressHydrationWarning>
      {/* Marks the page as scripted before it paints, so pieces that rise into
          place start hidden only where a script will bring them in. */}
      <script dangerouslySetInnerHTML={{ __html: "document.currentScript.parentElement.classList.add('mu-js')" }} />
      {children}
    </div>
  )
}
