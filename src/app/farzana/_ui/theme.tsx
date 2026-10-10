'use client'

import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import { useSyncExternalStore } from 'react'

import { buttonClass } from './button'
import { THEME_KEY } from './theme-script'

/**
 * Light or dark for the Farzana page. It opens in light; the small
 * sun-and-moon switch in the bar flips it, and the choice is kept in this
 * browser. The mode lives on the page's own wrapper (`.farzana[data-theme]`),
 * so the rest of Kingdom Sites is untouched.
 *
 * `theme-script.ts` sets the mode before the first paint, from the layout, so
 * a visitor who chose dark never sees a light flash.
 */

function wrapper() {
  return document.querySelector<HTMLElement>('.farzana')
}

function subscribe(onChange: () => void) {
  const element = wrapper()
  if (!element) return () => {}
  const observer = new MutationObserver(onChange)
  observer.observe(element, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

export function ThemeToggle() {
  // null on the server, where the mode is not known yet.
  const mode = useSyncExternalStore(
    subscribe,
    () => wrapper()?.dataset.theme ?? 'light',
    () => null,
  )
  const dark = mode === 'dark'
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = dark ? 'light' : 'dark'
        const element = wrapper()
        if (element) element.dataset.theme = next
        try {
          localStorage.setItem(THEME_KEY, next)
        } catch {
          // Storage blocked: the switch still works until the page is left.
        }
      }}
      className={buttonClass({ variant: 'ghost', size: 'icon' })}
    >
      {mode === null ? null : dark ? <SunIcon weight="bold" /> : <MoonIcon weight="bold" />}
    </button>
  )
}
