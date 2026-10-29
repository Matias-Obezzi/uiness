'use client'

import { ScissorsIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ReceiptLine {
  label: string
  amount: number
}

export interface ReceiptPrinterLabels {
  /** Names the receipt. */
  receipt: string
  total: string
  tear: string
  printing: string
  /** How to tear it with a pointer, for screen readers. */
  hint: string
}

export const defaultReceiptPrinterLabels: ReceiptPrinterLabels = {
  receipt: 'Receipt',
  total: 'Total',
  tear: 'Tear off',
  printing: 'Printing…',
  hint: 'Pull the receipt down to tear it off, or use the Tear off button.',
}

/** Milliseconds per printed line. */
const LINE_MS = 280
/** Pixels pulled down that tear the receipt off. */
const TEAR_AT = 80

export interface ReceiptPrinterProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** A line at the top, such as the shop's name. */
  title?: string
  lines: ReceiptLine[]
  currency?: string
  locale?: string
  /** Runs once it has been torn off and fallen. */
  onTear?: () => void
  labels?: Partial<ReceiptPrinterLabels>
}

/**
 * A receipt that prints line by line out of a slot, then tears off and falls when pulled down,
 * or with its button. With reduced motion it prints at once.
 */
function ReceiptPrinter({
  title,
  lines,
  currency = 'USD',
  locale,
  onTear,
  labels: labelsProp,
  className,
  ...props
}: ReceiptPrinterProps) {
  const labels = useLabels('receipt-printer', defaultReceiptPrinterLabels, labelsProp)
  const reduced = useReducedMotion()
  // Rows printed so far: the title, each line, the rule and the total.
  const rows = lines.length + 3
  const [printed, setPrinted] = React.useState(0)
  const [pull, setPull] = React.useState(0)
  const [torn, setTorn] = React.useState(false)
  const drag = React.useRef<{ pointer: number; y: number } | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const hintId = React.useId()
  const money = React.useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [locale, currency],
  )
  const done = printed >= rows

  React.useEffect(() => {
    if (done) return
    const timer = window.setTimeout(
      () => setPrinted(reduced ? rows : printed + 1),
      reduced ? 0 : LINE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [printed, rows, done, reduced])

  const tear = () => {
    if (torn || !done) return
    setTorn(true)
    window.setTimeout(() => onTear?.(), reduced ? 0 : 700)
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  const row = (i: number, content: React.ReactNode, key: string) =>
    i < printed ? (
      <div
        key={key}
        className="animate-in fade-in duration-(--duration-fast,150ms) motion-reduce:animate-none"
      >
        {content}
      </div>
    ) : null

  return (
    <div
      data-slot="receipt-printer"
      className={cn('flex w-full max-w-72 flex-col items-center', className)}
      {...props}
    >
      {/* The printer, with its slot. */}
      <div
        aria-hidden="true"
        className="relative z-10 h-6 w-full rounded-t-xl rounded-b-sm bg-foreground/85 shadow-md"
      >
        <span className="absolute inset-x-4 bottom-1 h-1 rounded-full bg-black/60" />
      </div>
      <div className="w-[88%] overflow-hidden pb-6">
        <section
          aria-label={labels.receipt}
          aria-describedby={done && !torn ? hintId : undefined}
          aria-busy={!done}
          onPointerDown={(event) => {
            if (!done || torn || (event.pointerType === 'mouse' && event.button !== 0)) return
            event.currentTarget.setPointerCapture?.(event.pointerId)
            drag.current = { pointer: event.pointerId, y: event.clientY }
            setDragging(true)
          }}
          onPointerMove={(event) => {
            const d = drag.current
            if (d && d.pointer === event.pointerId) setPull(Math.max(0, event.clientY - d.y))
          }}
          onPointerUp={() => {
            if (!drag.current) return
            drag.current = null
            setDragging(false)
            if (pull >= TEAR_AT) tear()
            else setPull(0)
          }}
          onPointerCancel={() => {
            drag.current = null
            setDragging(false)
            setPull(0)
          }}
          className={cn(
            'relative -mt-1 bg-background px-4 pt-4 pb-5 font-mono text-xs shadow-md',
            done && !torn && 'cursor-grab touch-none active:cursor-grabbing',
            !dragging &&
              'transition-transform duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out)',
            torn &&
              'translate-y-[140%] rotate-6 opacity-0 transition-[translate,rotate,opacity] duration-700 ease-in motion-reduce:transition-none',
            // A zigzag torn edge at the bottom.
            'after:absolute after:inset-x-0 after:top-full after:h-2 after:bg-[linear-gradient(-45deg,transparent_6px,var(--background)_0),linear-gradient(45deg,transparent_6px,var(--background)_0)] after:bg-[length:12px_8px] after:bg-repeat-x',
          )}
          style={
            torn
              ? undefined
              : { transform: `translateY(${pull * 0.5}px) rotate(${Math.min(4, pull / 40)}deg)` }
          }
        >
          {row(
            0,
            <p className="mb-3 text-center font-semibold text-sm uppercase tracking-widest">
              {title ?? labels.receipt}
            </p>,
            'title',
          )}
          {lines.map((line, i) =>
            row(
              i + 1,
              <p className="flex justify-between gap-3 py-0.5">
                <span className="truncate">{line.label}</span>
                <span className="tabular-nums">{money.format(line.amount)}</span>
              </p>,
              `line-${i}`,
            ),
          )}
          {row(
            lines.length + 1,
            <hr className="my-2 border-foreground/40 border-dashed" />,
            'rule',
          )}
          {row(
            lines.length + 2,
            <p className="flex justify-between font-semibold text-sm">
              <span>{labels.total}</span>
              <span className="tabular-nums">{money.format(total)}</span>
            </p>,
            'total',
          )}
          {!done && <p className="mt-2 text-center text-muted-foreground">{labels.printing}</p>}
        </section>
      </div>
      {done && !torn && (
        <button
          type="button"
          onClick={tear}
          className="flex h-9 items-center gap-1.5 rounded-full border bg-background px-3.5 font-medium text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-11 [&_svg]:size-4"
        >
          <ScissorsIcon aria-hidden="true" />
          {labels.tear}
        </button>
      )}
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>
    </div>
  )
}

export { ReceiptPrinter }
