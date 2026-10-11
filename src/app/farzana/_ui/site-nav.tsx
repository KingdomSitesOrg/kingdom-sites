'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonClass } from './button'
import { ABOUT_PATH, FILM_PATH, PRICING_PATH } from './contact'
import { cn } from './cn'

/**
 * The bar's way round the Farzana pages. Pricing and About show from the `md`
 * width; the front page's two sections join them on a wide screen. On a phone
 * the same links sit in the footer. The page you are on keeps a soft fill.
 */
const LINKS = [
  { href: '/farzana#features', label: 'Features', wide: true },
  { href: PRICING_PATH, label: 'Pricing', wide: false },
  { href: ABOUT_PATH, label: 'About', wide: false },
  { href: FILM_PATH, label: 'The film', wide: true },
]

export function SiteNav() {
  const pathname = usePathname()
  return (
    <div className="me-2 hidden items-center gap-1 md:flex">
      {LINKS.map((link) => {
        const current = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? 'page' : undefined}
            className={buttonClass({
              variant: 'ghost',
              size: 'sm',
              className: cn(link.wide && 'hidden lg:inline-flex', current && 'bg-wash'),
            })}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}
