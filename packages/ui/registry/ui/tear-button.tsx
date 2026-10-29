'use client'

import { CheckIcon, ScissorsIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TearButtonLabels {
  /** How to use it, for screen readers. */
  hint: string
  confirmed: string
}

export const defaultTearButtonLabels: TearButtonLabels = {
  hint: 'Drag the stub away to tear it off, or hold Space or Enter.',
  confirmed: 'Confirmed',
}

const HOLES = 7
/** Pixels of drag that tear the whole line. */
const TEAR_PX = 90
/** Milliseconds per hole while a key is held. */
const KEY_MS = 110

export interface TearButtonProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** What tearing it does, such as "Cancel order". */
  children: React.ReactNode
  onConfirm: () => void
  confirmedLabel?: React.ReactNode
  labels?: Partial<TearButtonLabels>
}

/**
 * A confirm button you tear off like a ticket stub: drag the stub away and it parts hole by
 * hole down the perforation, then drops. Let go early and it springs back. On the keyboard,
 * holding Space or Enter tears it, and letting go early mends it.
 */
function TearButton({
  children,
  onConfirm,
  confirmedLabel,
  labels: labelsProp,
  className,
  ...props
}: TearButtonProps) {
  const labels = useLabels('tear-button', defaultTearButtonLabels, labelsProp)
  const [torn, setTorn] = React.useState(0)
  const [done, setDone] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const drag = React.useRef<{ pointer: number; x: number; y: number } | null>(null)
  const timer = React.useRef(0)
  const hintId = React.useId()
  React.useEffect(() => () => window.clearInterval(timer.current), [])

  const tearTo = (holes: number) => {
    const next = Math.max(0, Math.min(HOLES, holes))
    setTorn(next)
    if (next === HOLES && !done) {
      setDone(true)
      window.clearInterval(timer.current)
      onConfirm()
    }
  }
  const progress = torn / HOLES

  return (
    <div
      data-slot="tear-button"
      data-done={done || undefined}
      className={cn('relative inline-flex h-12 select-none', className)}
      {...props}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-l-xl border border-r-0 bg-card px-4 font-medium text-sm transition-colors',
          done && 'rounded-r-xl border-r bg-emerald-600 text-white',
        )}
      >
        {done ? (
          <>
            <CheckIcon aria-hidden="true" className="size-4" />
            {confirmedLabel ?? labels.confirmed}
          </>
        ) : (
          children
        )}
      </div>
      {!done && (
        <>
          {/* The perforation: the holes torn so far open up. */}
          <span aria-hidden="true" className="flex w-0 flex-col items-center justify-between py-1">
            {Array.from({ length: HOLES }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: holes are positional
                key={i}
                className={cn(
                  'z-10 size-1.5 rounded-full bg-background ring-1 ring-border transition-[scale]',
                  i < torn && 'scale-y-150 bg-transparent ring-0',
                )}
              />
            ))}
          </span>
          {/* A div: it is dragged, and a button would take the drag as a click. */}
          {/* biome-ignore lint/a11y/useSemanticElements: see above */}
          <div
            role="button"
            tabIndex={0}
            aria-label={typeof children === 'string' ? children : undefined}
            aria-describedby={hintId}
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse' && event.button !== 0) return
              event.currentTarget.setPointerCapture?.(event.pointerId)
              drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY }
              setDragging(true)
            }}
            onPointerMove={(event) => {
              const d = drag.current
              if (!d || d.pointer !== event.pointerId) return
              const pulled = Math.max(event.clientX - d.x, event.clientY - d.y)
              tearTo(Math.floor((pulled / TEAR_PX) * HOLES))
            }}
            onPointerUp={() => {
              drag.current = null
              setDragging(false)
              if (!done) setTorn(0)
            }}
            onPointerCancel={() => {
              drag.current = null
              setDragging(false)
              setTorn(0)
            }}
            onKeyDown={(event) => {
              if ((event.key !== ' ' && event.key !== 'Enter') || event.repeat) return
              event.preventDefault()
              let holes = torn
              timer.current = window.setInterval(() => tearTo(++holes), KEY_MS)
            }}
            onKeyUp={(event) => {
              if (event.key !== ' ' && event.key !== 'Enter') return
              window.clearInterval(timer.current)
              if (!done) setTorn(0)
            }}
            className={cn(
              'flex w-14 cursor-grab touch-none items-center justify-center rounded-r-xl border border-l-0 border-dashed bg-muted text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing',
              !dragging &&
                'transition-transform duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out) motion-reduce:transition-none',
            )}
            // Torn from the top, it hangs from what is left at the bottom.
            style={{
              transform: `rotate(${progress * 14}deg) translateX(${progress * 6}px)`,
              transformOrigin: '0 100%',
            }}
          >
            <ScissorsIcon aria-hidden="true" className="size-4" />
          </div>
        </>
      )}
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>
      <span className="sr-only" aria-live="polite">
        {done ? labels.confirmed : ''}
      </span>
    </div>
  )
}

export { TearButton }
