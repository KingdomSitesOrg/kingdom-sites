/**
 * The sender's path through Sign, shown on the new-document and document
 * screens so it is always clear which step this is and what comes next.
 */
export const SENDER_STEPS = ['Upload', 'Place lines', 'Send', 'Signed'] as const

type Props = {
  steps?: readonly string[]
  /** Index of the step in progress; steps before it show as done. */
  current: number
  /** Every step done (the document is signed by everyone). */
  allDone?: boolean
}

export default function SignSteps({ steps = SENDER_STEPS, current, allDone }: Props) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" aria-label="Progress">
      {steps.map((label, i) => {
        const done = allDone || i < current
        const active = !allDone && i === current
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                active
                  ? 'bg-accent text-white'
                  : done
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-surface-2 text-muted'
              }`}
            >
              <span aria-hidden>{done ? '✓' : i + 1}</span>
              {label}
            </span>
            {i < steps.length - 1 ? (
              <span aria-hidden className="h-px w-3 bg-line" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
