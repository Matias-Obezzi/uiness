'use client'

import { PlaneIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface Airport {
  /** IATA code, such as `LIS`. */
  code: string
  city: string
}

export interface BoardingPassLabels {
  passenger: string
  flight: string
  gate: string
  boards: string
  departs: string
  seat: string
  /** Announced when a field changes. */
  changed: (field: string, from: string, to: string) => string
}

export const defaultBoardingPassLabels: BoardingPassLabels = {
  passenger: 'Passenger',
  flight: 'Flight',
  gate: 'Gate',
  boards: 'Boards',
  departs: 'Departs',
  seat: 'Seat',
  changed: (field, from, to) => `${field} changed from ${from} to ${to}`,
}

/** How long a changed value shows its old one struck through. */
const STRUCK_MS = 6000

export interface BoardingPassProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  from: Airport
  to: Airport
  passenger: string
  flight: string
  gate: string
  boards: string
  departs: string
  seat: string
  /** A line of status, such as "Delayed 25 min". */
  status?: string
  /** Colors the status for a delay or a cancellation. */
  tone?: 'ok' | 'warn' | 'bad'
  labels?: Partial<BoardingPassLabels>
}

/**
 * A boarding pass that keeps itself current. When the gate or a time changes, only the
 * characters that changed roll over to the new ones, and the old value stays struck through
 * beside it for a moment. Each change is read out.
 */
function BoardingPass({
  from,
  to,
  passenger,
  flight,
  gate,
  boards,
  departs,
  seat,
  status,
  tone = 'ok',
  labels: labelsProp,
  className,
  ...props
}: BoardingPassProps) {
  const labels = useLabels('boarding-pass', defaultBoardingPassLabels, labelsProp)
  const [announce, setAnnounce] = React.useState('')
  const say = React.useCallback(
    (field: string, old: string, next: string) => setAnnounce(labels.changed(field, old, next)),
    [labels],
  )
  return (
    <article
      data-slot="boarding-pass"
      className={cn(
        'w-full max-w-sm overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="font-bold text-3xl tracking-tight">{from.code}</p>
          <p className="text-primary-foreground/75 text-xs">{from.city}</p>
        </div>
        <PlaneIcon aria-hidden="true" className="size-5 rotate-45" />
        <div className="text-right">
          <p className="font-bold text-3xl tracking-tight">{to.code}</p>
          <p className="text-primary-foreground/75 text-xs">{to.city}</p>
        </div>
      </div>
      {status && (
        <p
          className={cn(
            'px-5 pt-3 font-medium text-sm',
            tone === 'ok' && 'text-emerald-700 dark:text-emerald-400',
            tone === 'warn' && 'text-amber-700 dark:text-amber-400',
            tone === 'bad' && 'text-destructive',
          )}
        >
          {status}
        </p>
      )}
      <dl className="grid grid-cols-3 gap-x-4 gap-y-3 px-5 py-4">
        <Field label={labels.passenger} value={passenger} className="col-span-2" onChange={say} />
        <Field label={labels.flight} value={flight} onChange={say} />
        <Field label={labels.gate} value={gate} big onChange={say} />
        <Field label={labels.boards} value={boards} big onChange={say} />
        <Field label={labels.seat} value={seat} big onChange={say} />
        <Field label={labels.departs} value={departs} onChange={say} />
      </dl>
      {/* The tear line, with a notch at each side, and a code to scan. */}
      <div aria-hidden="true" className="relative mx-5 border-t border-dashed">
        <span className="absolute -top-2.5 -left-8 size-5 rounded-full border bg-background" />
        <span className="absolute -top-2.5 -right-8 size-5 rounded-full border bg-background" />
      </div>
      <div
        aria-hidden="true"
        className="mx-5 my-4 h-12 rounded-sm"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 5px, transparent 5px 8px, currentColor 8px 11px, transparent 11px 13px)',
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </article>
  )
}

function Field({
  label,
  value,
  big = false,
  className,
  onChange,
}: {
  label: string
  value: string
  big?: boolean
  className?: string
  onChange: (field: string, old: string, next: string) => void
}) {
  // The value before the last change, kept while it shows struck through.
  const [shown, setShown] = React.useState(value)
  const [old, setOld] = React.useState<string | null>(null)
  if (shown !== value) {
    setOld(shown)
    setShown(value)
  }
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })
  React.useEffect(() => {
    if (old === null) return
    onChangeRef.current(label, old, value)
    const timer = window.setTimeout(() => setOld(null), STRUCK_MS)
    return () => window.clearTimeout(timer)
  }, [old, value, label])

  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-muted-foreground text-[11px] uppercase tracking-wide">{label}</dt>
      <dd
        className={cn(
          'flex flex-wrap items-baseline gap-x-1.5 font-semibold',
          big ? 'text-xl' : 'text-sm',
        )}
      >
        <span className="inline-flex overflow-hidden">
          {[...value].map((char, i) => (
            <span
              // A character keeps its key while it stays the same, so only changed ones roll in.
              // biome-ignore lint/suspicious/noArrayIndexKey: the place and the character are the identity
              key={`${i}-${char}`}
              className={cn(
                'inline-block whitespace-pre',
                old !== null &&
                  old[i] !== char &&
                  'animate-in fade-in slide-in-from-bottom-full duration-(--duration-slow,300ms) motion-reduce:animate-none',
              )}
            >
              {char}
            </span>
          ))}
        </span>
        {old !== null && (
          <del className="font-normal text-muted-foreground text-xs animate-in fade-in motion-reduce:animate-none">
            {old}
          </del>
        )}
      </dd>
    </div>
  )
}

export { BoardingPass }
