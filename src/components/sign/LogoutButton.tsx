'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch('/api/sign/logout', { method: 'POST' })
        router.replace('/sign/login')
        router.refresh()
      }}
      className="rounded-full border border-line px-3 py-2 text-xs text-body hover:bg-surface-2"
    >
      Log out
    </button>
  )
}
