'use client'

import { CheckIcon, ChevronsRightIcon, LoaderCircleIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface SlideToConfirmLabels {
  /** How to use it, read with the label. */
  hint: string
  confirmed: string
}

export const defaultSlideToConfirmLabels: SlideToConfirmLabels = {
  hint: 'Slide to the end, or press the right arrow key to the end, to confirm.',
  confirmed: 'Confirmed',
}

/** How far ahead, in milliseconds, the release speed carries the thumb. */
const PROJECT_MS = 150
/** Share of the track past which a release confirms. */
const DONE_AT = 0.92

type State = 'idle' | 'pending' | 'confirmed'

export interface SlideToConfirmProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** What sliding does, such as "Slide to pay $24.00". */
  children: React.ReactNode
  /** Runs at the end of the slide. Return a promise to show a spinner until it settles. */
  onConfirm: () => unknown
  /** Shown once confirmed. Default "Confirmed". */
  confirmedLabel?: React.ReactNode
  disabled?: boolean
  labels?: Partial<SlideToConfirmLabels>
}

/**
 * A confirm control for payments and other actions that can't be taken back: slide the thumb
 * to the end, or flick it there. Let go short of the end and it springs back. On the keyboard it
 * is a slider; the arrows, Home and End move it, and reaching the end confirms.
 */
function SlideToConfirm({
  children,
  onConfirm,
  confirmedLabel,
  disabled = false,
  labels: labelsProp,
  className,
  ...props
}: SlideToConfirmProps) {
  const labels = useLabels('slide-to-confirm', defaultSlideToConfirmLabels, labelsProp)
  const reduced = useReducedMotion()
  const track = React.useRef<HTMLDivElement>(null)
  const thumb = React.useRef<HTMLDivElement>(null)
  const [share, setShare] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const [state, setState] = React.useState<State>('idle')
  const drag = React.useRef<{
    pointer: number
    x: number
    from: number
    samples: [number, number][]
  } | null>(null)
  const hintId = React.useId()

  const room = () => (track.current?.offsetWidth ?? 0) - (thumb.current?.offsetWidth ?? 0) - 8
  // How far the thumb can travel, kept in state for rendering: render cannot measure the DOM.
  const [travel, setTravel] = React.useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: measures once and on resize
  React.useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setTravel(room())
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const finish = async () => {
    setShare(1)
    setState('pending')
    try {
      await onConfirm()
      setState('confirmed')
    } catch {
      setState('idle')
      setShare(0)
    }
  }

  const locked = disabled || state !== 'idle'
  const label = state === 'confirmed' ? (confirmedLabel ?? labels.confirmed) : children

  return (
    <div
      ref={track}
      data-slot="slide-to-confirm"
      data-state={state}
      className={cn(
        'relative flex h-14 w-full max-w-sm touch-pan-y select-none items-center overflow-hidden rounded-full bg-muted p-1',
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {/* Fills behind the thumb as it goes. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 rounded-full bg-primary/15',
          !dragging &&
            'transition-[width] duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) motion-reduce:transition-none',
        )}
        style={{ width: `calc(${share} * (100% - 3.5rem) + 3.5rem)` }}
      />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 font-medium text-sm transition-opacity"
        style={{ opacity: state === 'idle' ? 1 - share * 1.4 : 1 }}
        aria-hidden="true"
      >
        {label}
      </span>
      <div
        ref={thumb}
        role="slider"
        tabIndex={locked ? -1 : 0}
        aria-label={typeof children === 'string' ? children : undefined}
        aria-describedby={hintId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(share * 100)}
        aria-valuetext={state === 'confirmed' ? labels.confirmed : `${Math.round(share * 100)}%`}
        aria-disabled={locked || undefined}
        onKeyDown={(event) => {
          if (locked) return
          const step =
            event.key === 'ArrowRight' || event.key === 'ArrowUp'
              ? 0.25
              : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                ? -0.25
                : event.key === 'End'
                  ? 1
                  : event.key === 'Home'
                    ? -1
                    : 0
          if (!step) return
          event.preventDefault()
          const next = Math.min(1, Math.max(0, share + step))
          if (next >= 1) void finish()
          else setShare(next)
        }}
        onPointerDown={(event) => {
          if (locked || (event.pointerType === 'mouse' && event.button !== 0)) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            from: share,
            samples: [[event.timeStamp, event.clientX]],
          }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          d.samples.push([event.timeStamp, event.clientX])
          if (d.samples.length > 5) d.samples.shift()
          setShare(Math.min(1, Math.max(0, d.from + (event.clientX - d.x) / Math.max(1, room()))))
        }}
        onPointerUp={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          drag.current = null
          setDragging(false)
          // A flick carries on a little past where it was let go.
          const first = d.samples[0] as [number, number]
          const speed = (event.clientX - first[1]) / Math.max(16, event.timeStamp - first[0])
          const projected = share + (speed * PROJECT_MS) / Math.max(1, room())
          if (projected >= DONE_AT) void finish()
          else setShare(0)
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragging(false)
          setShare(0)
        }}
        className={cn(
          'relative z-10 flex size-12 shrink-0 cursor-grab touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing [&_svg]:size-5',
          !dragging &&
            !reduced &&
            'transition-transform duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out)',
          locked && 'cursor-default',
        )}
        style={{ transform: `translateX(${share * travel}px)` }}
      >
        {state === 'pending' ? (
          <LoaderCircleIcon
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
        ) : state === 'confirmed' ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <ChevronsRightIcon aria-hidden="true" />
        )}
      </div>
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>
      <span className="sr-only" aria-live="polite">
        {state === 'confirmed' ? (typeof label === 'string' ? label : labels.confirmed) : ''}
      </span>
    </div>
  )
}

export { SlideToConfirm }
