'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface LiquidSliderProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  /** From 0 to 100. */
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Names the slider. */
  label: string
  /** Shows the value as text. Default a percent. */
  format?: (value: number) => string
}

/**
 * A vertical slider you fill like a glass: drag up or down and the level follows, its surface
 * sloshing as it moves and settling when it stops, with bubbles rising through it. A slider on
 * the keyboard too.
 */
function LiquidSlider({
  value,
  defaultValue = 40,
  onValueChange,
  label,
  format = (v) => `${Math.round(v)}%`,
  className,
  ...props
}: LiquidSliderProps) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue)
  const level = value ?? own
  const glass = React.useRef<HTMLDivElement>(null)
  const surface = React.useRef<SVGPathElement>(null)
  const dragging = React.useRef<number | null>(null)
  // How hard the surface sloshes: kicked by each move, it fades every frame.
  const slosh = React.useRef(0)
  const last = React.useRef(level)

  const set = (next: number) => {
    const clamped = Math.min(100, Math.max(0, next))
    if (clamped === level) return
    if (value === undefined) setOwn(clamped)
    onValueChange?.(clamped)
  }
  const fromPointer = (event: React.PointerEvent) => {
    const box = glass.current?.getBoundingClientRect()
    if (box) set(((box.bottom - event.clientY) / box.height) * 100)
  }

  React.useEffect(() => {
    slosh.current = Math.min(1, slosh.current + Math.abs(level - last.current) / 12)
    last.current = level
  }, [level])

  // The surface: a wave whose height is the slosh, drawn each frame while it moves.
  React.useEffect(() => {
    if (reduced) return
    let frame = 0
    const draw = (t: number) => {
      const amp = 2 + slosh.current * 9
      slosh.current *= 0.96
      const points = Array.from({ length: 9 }, (_, i) => {
        const x = i * 12.5
        const y =
          10 + Math.sin(t / 380 + i * 0.9) * amp * 0.6 + Math.sin(t / 230 - i * 1.3) * amp * 0.4
        return `${x} ${y.toFixed(2)}`
      })
      surface.current?.setAttribute('d', `M0 30 L${points.join(' L')} L100 30 Z`)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  return (
    <div
      data-slot="liquid-slider"
      className={cn('inline-flex flex-col items-center gap-3', className)}
      {...props}
    >
      <div
        ref={glass}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level)}
        aria-valuetext={format(level)}
        onKeyDown={(event) => {
          const by: Record<string, number> = {
            ArrowUp: 5,
            ArrowRight: 5,
            ArrowDown: -5,
            ArrowLeft: -5,
            PageUp: 20,
            PageDown: -20,
          }
          if (event.key === 'Home') set(0)
          else if (event.key === 'End') set(100)
          else if (by[event.key] !== undefined) set(level + (by[event.key] as number))
          else return
          event.preventDefault()
        }}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          dragging.current = event.pointerId
          fromPointer(event)
        }}
        onPointerMove={(event) => {
          if (dragging.current === event.pointerId) fromPointer(event)
        }}
        onPointerUp={() => {
          dragging.current = null
        }}
        className="relative h-56 w-24 cursor-ns-resize touch-none overflow-hidden rounded-b-[2rem] rounded-t-lg border-2 border-foreground/15 bg-muted/30 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-linear-to-t from-sky-600 to-sky-400 transition-[height] duration-(--duration-fast,150ms) ease-out motion-reduce:transition-none"
          style={{ height: `${level}%` }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            className="absolute inset-x-0 -top-[13px] h-4 w-full"
          >
            <path ref={surface} d="M0 30 L0 10 L100 10 L100 30 Z" className="fill-sky-400" />
          </svg>
          {!reduced &&
            [12, 34, 58, 76, 88].map((left, i) => (
              <span
                key={left}
                // Each bubble rises through the liquid, fading at the surface, over and over.
                ref={(el) => {
                  const rise = el?.animate?.(
                    [
                      { transform: 'translateY(0)', opacity: 0 },
                      { opacity: 0.8, offset: 0.15 },
                      { transform: 'translateY(-14rem)', opacity: 0 },
                    ],
                    {
                      duration: 2400 + i * 500,
                      delay: i * 700,
                      iterations: Number.POSITIVE_INFINITY,
                    },
                  )
                  return () => rise?.cancel()
                }}
                className="absolute bottom-0 size-1.5 rounded-full bg-white/50"
                style={{ left: `${left}%` }}
              />
            ))}
        </div>
        {/* A highlight down the glass. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-3 left-2 w-1.5 rounded-full bg-white/30"
        />
      </div>
      <p aria-hidden="true" className="font-semibold tabular-nums">
        {format(level)}
      </p>
    </div>
  )
}

export { LiquidSlider }
