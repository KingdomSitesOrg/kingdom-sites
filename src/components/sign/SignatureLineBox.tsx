'use client'

type Props = {
  role: string
  name: string
  signed?: boolean
  /** Real signed day shown to the right of the signature line when present. */
  signedDate?: string | null
  hint?: string
}

/** Contract-style signature block: role, ink on a rule, printed name; date on the right when signed. */
export default function SignatureLineBox({ role, name, signed, signedDate, hint }: Props) {
  const label = (role || 'Signer').trim() || 'Signer'
  const showDate = Boolean(signed && signedDate)
  return (
    <div className="flex h-full min-h-0 w-full gap-2">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between px-2 py-1">
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
        </div>
      </div>
      {showDate ? (
        <div className="flex w-[36%] shrink-0 flex-col justify-between border-l border-line/80 px-2 py-1">
          <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted">
            Date
          </span>
          <div className="mt-auto flex min-h-0 flex-1 flex-col justify-end">
            <span className="block truncate text-[11px] leading-tight text-ink">{signedDate}</span>
            <div className="mt-0.5 h-px w-full bg-ink/80" aria-hidden />
          </div>
        </div>
      ) : null}
    </div>
  )
}
