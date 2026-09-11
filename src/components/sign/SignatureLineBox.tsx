'use client'

type Props = {
  role: string
  name: string
  signed?: boolean
  hint?: string
}

/** Contract-style signature block: role, ink on a rule, printed name under the line. */
export default function SignatureLineBox({ role, name, signed, hint }: Props) {
  const label = (role || 'Signer').trim() || 'Signer'
  return (
    <div className="flex h-full min-h-0 flex-col justify-between px-2 py-1">
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
  )
}
