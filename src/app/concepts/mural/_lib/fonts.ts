import { Unbounded } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

/* The mural's three typefaces: wide and blocky for the big lines, Geist for
   reading, Geist Mono for labels. Shared by the home page and every studio
   page that wears the mural look. */
export const display = Unbounded({ subsets: ['latin'], display: 'swap', variable: '--font-unbounded' })

/** The classes that make the three typefaces available to everything inside an element. */
export const MURAL_FONTS = `${display.variable} ${GeistSans.variable} ${GeistMono.variable}`

/** The chat (its button and its panel) sits outside the page's own element, so the typefaces
    are handed to it by name. mural.css draws the rest. */
export const CHAT_FONT_CSS =
  `body:has(.mu) .ki{font-family:${GeistSans.style.fontFamily},system-ui,sans-serif}` +
  `body:has(.mu) :is(.ki-square,.ki-title,.ki-card-title,.km-intro-title,.ki-btn,.ki-tab){font-family:${display.style.fontFamily},'Arial Black',system-ui,sans-serif}` +
  `body:has(.mu) :is(.ki-sub,.ki-foot,.ki-think-word,.km-when,.km-status,.km-promise,.ki-label){font-family:${GeistMono.style.fontFamily},ui-monospace,monospace}`
