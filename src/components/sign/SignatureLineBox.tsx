'use client'

type Props = {
  role: string
  name: string
  signed?: boolean
  /** Real signed day shown under the printed name when present. */
  signedDate?: string | null
  hint?: string
}

/** Contract-style signature block: role, ink on a rule, printed name, date under the name. */
export default function SignatureLineBox({ role, name, signed, signedDate, hint }: Props) {
  const label = (role || 'Signer').trim() || 'Signer'
  const showDate = Boolean(signed && signedDate)
  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-between px-2 py-1">
      <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="mt-auto flex min-h-0 flex-1 flex-col justify-end">
        {signed && name ? (
          <span
            className="block truncate text-base italic leading-none text-ink"
            style={{
              fontFamily: '"Segoe Script", "Brush Script MT", "Apple Chancery", cursive',
            }}
          >
            {name}
          </span>
        ) : (
          <span className="block text-[10px] text-muted">{hint || 'Sign here'}</span>
        )}
        <div className="mt-0.5 h-px w-full bg-ink/80" aria-hidden />
        {signed && name ? (
          <span className="mt-0.5 truncate text-[10px] leading-tight text-ink">{name}</span>
        ) : null}
        {showDate ? (
          <span className="mt-0.5 truncate text-[10px] leading-tight text-muted">{signedDate}</span>
        ) : null}
      </div>
    </div>
  )
}
