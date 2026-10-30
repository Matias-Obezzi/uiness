'use client'

import { Undo2Icon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface UndoButtonLabels {
  /** The button while it can be taken back, with the seconds left. */
  undo: (seconds: number) => string
  /** Announced once it went through. */
  done: string
}

export const defaultUndoButtonLabels: UndoButtonLabels = {
  undo: (seconds) => `Undo, ${seconds}s left`,
  done: 'Done',
}

export interface UndoButtonProps extends Omit<React.ComponentProps<'button'>, 'onClick'> {
  /** What it does, such as "Archive" or "Send". */
  children: React.ReactNode
  /** Runs once the time to take it back is over. */
  onCommit: () => void
  /** Runs if it is taken back. */
  onUndo?: () => void
  /** Milliseconds to take it back. Default 5000. */
  duration?: number
  labels?: Partial<UndoButtonLabels>
}

/**
 * An action that gives a few seconds to take it back. Press it and it turns into Undo, the time
 * left drawn around its own edge; press again to cancel, or let the time run out and it goes
 * through.
 */
function UndoButton({
  children,
  onCommit,
  onUndo,
  duration = 5000,
  labels: labelsProp,
  className,
  ...props
}: UndoButtonProps) {
  const labels = useLabels('undo-button', defaultUndoButtonLabels, labelsProp)
  const [pending, setPending] = React.useState(false)
  const [left, setLeft] = React.useState(Math.ceil(duration / 1000))
  const [announce, setAnnounce] = React.useState('')
  const ring = React.useRef<SVGRectElement>(null)
  const commitRef = React.useRef(onCommit)
  React.useEffect(() => {
    commitRef.current = onCommit
  })

  React.useEffect(() => {
    if (!pending) return
    const started = performance.now()
    const tick = window.setInterval(() => {
      setLeft(Math.max(0, Math.ceil((duration - (performance.now() - started)) / 1000)))
    }, 250)
    const done = window.setTimeout(() => {
      setPending(false)
      setAnnounce(labels.done)
      commitRef.current()
    }, duration)
    // The ring empties around the edge over the same time.
    const animation = ring.current?.animate?.(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }],
      {
        duration,
        fill: 'forwards',
      },
    )
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
      animation?.cancel()
    }
  }, [pending, duration, labels.done])

  return (
    <button
      type="button"
      data-slot="undo-button"
      data-pending={pending || undefined}
      onClick={() => {
        if (pending) {
          setPending(false)
          onUndo?.()
          return
        }
        setLeft(Math.ceil(duration / 1000))
        setAnnounce('')
        setPending(true)
      }}
      className={cn(
        'relative inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-4 font-medium text-sm shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-pending:border-transparent pointer-coarse:h-11 [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {pending && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full! overflow-visible"
        >
          <rect
            ref={ring}
            width="100%"
            height="100%"
            rx="8"
            pathLength={100}
            strokeDasharray="100"
            fill="none"
            strokeWidth="1.5"
            className="stroke-primary"
          />
        </svg>
      )}
      {pending ? (
        <>
          <Undo2Icon aria-hidden="true" />
          <span>{labels.undo(left)}</span>
        </>
      ) : (
        children
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </button>
  )
}

export { UndoButton }
