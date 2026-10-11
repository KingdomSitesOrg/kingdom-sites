'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import {
  CalendarCheckIcon,
  FilmStripIcon,
  HouseIcon,
  InfoIcon,
  ListIcon,
  ListNumbersIcon,
  SquaresFourIcon,
  TagIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react'

import { buttonClass } from './button'
import { cn } from './cn'
import { ABOUT_PATH, BOOK_PATH, FILM_PATH, PRICING_PATH } from './contact'
import { ThemeToggle } from './theme'
import { Wordmark } from './wordmark'

/**
 * The way round the Farzana pages on a phone, where the bar has no room for
 * its links: a menu button that opens a drawer from the end side with every
 * page and section, the sun-and-moon switch, and Book a call at the foot.
 * Hidden from the `md` width up, where the links sit in the bar
 * (`site-nav.tsx`).
 *
 * The drawer is a native modal <dialog>, so focus moves into it, Escape and
 * the close button shut it, and nothing behind it can be reached while it is
 * open. A tap on the dimmed page beside it closes it too, and so does
 * choosing a link — a section link stays on the same page, so the page
 * changing is not enough.
 */

const LINKS: { href: string; label: string; icon: Icon }[] = [
  { href: '/farzana', label: 'Home', icon: HouseIcon },
  { href: '/farzana#features', label: 'Features', icon: SquaresFourIcon },
  { href: '/farzana#how-it-works', label: 'How it works', icon: ListNumbersIcon },
  { href: PRICING_PATH, label: 'Pricing', icon: TagIcon },
  { href: ABOUT_PATH, label: 'About', icon: InfoIcon },
  { href: FILM_PATH, label: 'The film', icon: FilmStripIcon },
]

export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  const close = () => dialog.current?.close()

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={buttonClass({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}
      >
        <ListIcon weight="bold" />
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
        className="fz-drawer fixed inset-y-0 start-auto end-0 m-0 h-dvh max-h-none w-[min(320px,85vw)] max-w-none bg-surface p-0 text-ink shadow-overlay"
      >
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-center justify-between ps-2">
            <Wordmark className="text-[26px]" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className={buttonClass({ variant: 'ghost', size: 'icon' })}
              >
                <XIcon weight="bold" />
              </button>
            </div>
          </div>
          <nav aria-label="Farzana" className="mt-2 flex flex-col gap-1">
            {LINKS.map(({ href, label, icon: LinkIcon }) => {
              const current = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 items-center gap-3 rounded-sm px-3 text-base font-medium text-heading no-underline transition-colors hover:bg-wash',
                    current && 'bg-wash',
                  )}
                >
                  <LinkIcon weight="bold" className="size-5 text-muted" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <Link
            href={BOOK_PATH}
            onClick={close}
            className={buttonClass({ size: 'lg', className: 'mt-auto w-full' })}
          >
            <CalendarCheckIcon weight="bold" />
            Book a 15-minute call
          </Link>
        </div>
      </dialog>
    </>
  )
}
