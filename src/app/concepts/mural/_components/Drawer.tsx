'use client'

import Link from 'next/link'
import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import { play, setSound, soundOn, watchSound } from '../_lib/sound'

/* The header's menu on a phone or tablet, where there is no room for the
   links (Thomas, 2026-11-11). Its button is four tiles, two by two; pressed,
   they slide apart and the menu drops out of the header. It closes on a
   link, on Escape and on a tap outside. The Sound switch is in it on a
   phone, where the header has no room for it. A desktop never shows it. */

export type DrawerLink = { label: string; href: string }

export default function Drawer({ links }: { links: DrawerLink[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const sound = useSyncExternalStore(watchSound, soundOn, () => true)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="mu-drawer-btn"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((v) => !v)
          play('flip')
        }}
      >
        <i />
        <i />
        <i />
        <i />
      </button>
      <div className="mu-drawer-shade" hidden={!open} onClick={() => setOpen(false)} aria-hidden="true" />
      <nav id={id} className="mu-drawer" hidden={!open} aria-label="Menu">
        {links.map((link) => (
          <Link key={link.href} href={link.href} data-snap onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <button type="button" className="mu-sound" aria-pressed={sound} data-snap onClick={() => setSound(!sound)}>
          <span className="mu-sound-label">Sound</span>
          <span className="mu-sound-track" aria-hidden="true">
            <i />
          </span>
        </button>
      </nav>
    </>
  )
}
