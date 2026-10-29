'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/** Degrees the dial sweeps from its first notch to its last. */
const SWEEP = 270
/** Degrees per millisecond of spin that carry on after a flick, and how fast they fade. */
const FRICTION = 0.92

export interface DetentDialProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** Default 0 and 10. */
  min?: number
  max?: number
  /** Between notches. Default 1. */
  step?: number
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Shows a value as text, under the dial and to screen readers. */
  format?: (value: number) => string
  /** Names the dial. */
  label: string
}

/**
 * A rotary knob that clicks from notch to notch. Turn it by dragging round its centre; flick it
 * and it coasts, slowing until it settles on a notch. A slider on the keyboard: the arrows step
 * a notch, Page Up and Page Down several, Home and End to the ends.
 */
function DetentDial({
  min = 0,
  max = 10,
  step = 1,
  value,
  defaultValue = min,
  onValueChange,
  format = String,
  label,
  className,
  ...props
}: DetentDialProps) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue)
  const current = value ?? own
  const notches = Math.round((max - min) / step)
  const knob = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{
    pointer: number
    angle: number
    from: number
    samples: [number, number][]
  } | null>(null)
  const spin = React.useRef(0)
  // While turning, the knob follows the pointer between notches; let go, it snaps to one.
  const [free, setFree] = React.useState<number | null>(null)
  React.useEffect(() => () => cancelAnimationFrame(spin.current), [])

  const set = (next: number) => {
    const snapped = Math.min(max, Math.max(min, Math.round((next - min) / step) * step + min))
    if (snapped === current) return
    if (value === undefined) setOwn(snapped)
    onValueChange?.(snapped)
    // A tick you can feel, where the device has one.
    navigator.vibrate?.(4)
  }
  const toAngle = (v: number) => ((v - min) / (max - min || 1)) * SWEEP - SWEEP / 2
  const fromAngle = (a: number) => min + ((a + SWEEP / 2) / SWEEP) * (max - min)
  const pointerAngle = (event: React.PointerEvent) => {
    const box = knob.current?.getBoundingClientRect()
    if (!box) return 0
    return (
      (Math.atan2(
        event.clientX - (box.left + box.width / 2),
        -(event.clientY - (box.top + box.height / 2)),
      ) *
        180) /
      Math.PI
    )
  }

  const shown = free ?? toAngle(current)

  return (
    <div
      data-slot="detent-dial"
      className={cn('inline-flex flex-col items-center gap-3', className)}
      {...props}
    >
      {/* The whole face, notches included, turns it: an easier grab than the knob alone. */}
      <div
        className="relative size-40 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          cancelAnimationFrame(spin.current)
          event.currentTarget.setPointerCapture?.(event.pointerId)
          const angle = pointerAngle(event)
          drag.current = {
            pointer: event.pointerId,
            angle,
            from: shown,
            samples: [[event.timeStamp, angle]],
          }
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          const angle = pointerAngle(event)
          // The change since last time, unwrapped across ±180.
          let delta = angle - (d.samples.at(-1)?.[1] ?? angle)
          if (delta > 180) delta -= 360
          if (delta < -180) delta += 360
          d.samples.push([event.timeStamp, angle])
          if (d.samples.length > 5) d.samples.shift()
          const next = Math.max(-SWEEP / 2, Math.min(SWEEP / 2, (free ?? d.from) + delta))
          setFree(next)
          set(fromAngle(next))
        }}
        onPointerUp={(event) => {
          const d = drag.current
          if (!d) return
          drag.current = null
          const first = d.samples[0] as [number, number]
          let speed = (pointerAngle(event) - first[1]) / Math.max(16, event.timeStamp - first[0])
          if (Math.abs(speed) > 180) speed = 0
          let angle = free ?? toAngle(current)
          if (reduced || Math.abs(speed) < 0.05) {
            setFree(null)
            return
          }
          // Coasts after a flick, a little less each frame, clicking past notches.
          const coast = () => {
            speed *= FRICTION
            angle = Math.max(-SWEEP / 2, Math.min(SWEEP / 2, angle + speed * 16))
            setFree(angle)
            set(fromAngle(angle))
            if (Math.abs(speed) > 0.01 && Math.abs(angle) < SWEEP / 2)
              spin.current = requestAnimationFrame(coast)
            else setFree(null)
          }
          spin.current = requestAnimationFrame(coast)
        }}
        onPointerCancel={() => {
          drag.current = null
          setFree(null)
        }}
      >
        {/* The notches round the edge. */}
        {Array.from({ length: notches + 1 }, (_, i) => {
          const a = toAngle(min + i * step)
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: notches are positional
              key={i}
              aria-hidden="true"
              className={cn(
                'absolute top-1/2 left-1/2 h-2 w-0.5 rounded-full',
                min + i * step <= current ? 'bg-primary' : 'bg-muted-foreground/40',
              )}
              style={{ transform: `rotate(${a}deg) translateY(-78px)`, transformOrigin: '50% 0' }}
            />
          )
        })}
        <div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-valuetext={format(current)}
          onKeyDown={(event) => {
            const by: Record<string, number> = {
              ArrowUp: step,
              ArrowRight: step,
              ArrowDown: -step,
              ArrowLeft: -step,
              PageUp: step * Math.max(1, Math.round(notches / 10)),
              PageDown: -step * Math.max(1, Math.round(notches / 10)),
            }
            if (event.key === 'Home') set(min)
            else if (event.key === 'End') set(max)
            else if (by[event.key] !== undefined) set(current + (by[event.key] as number))
            else return
            event.preventDefault()
          }}
          className={cn(
            'absolute inset-5 rounded-full border bg-linear-to-b from-background to-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_8px_20px_-8px_rgb(0_0_0/0.35)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            free === null &&
              'transition-transform duration-(--duration-fast,150ms) ease-(--easing-spring,ease-out) motion-reduce:transition-none',
          )}
          style={{ transform: `rotate(${shown}deg)` }}
        >
          <span
            aria-hidden="true"
            className="absolute top-2 left-1/2 h-5 w-1 -translate-x-1/2 rounded-full bg-primary"
          />
        </div>
      </div>
      <p aria-hidden="true" className="font-semibold text-xl tabular-nums">
        {format(current)}
      </p>
    </div>
  )
}

export { DetentDial }
