'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AnimatedBeamProps extends Omit<React.ComponentProps<'svg'>, 'from' | 'to'> {
  /** The positioned element the beam is drawn in. Both ends must be inside it. */
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  /** How far the line bows, in pixels; negative bows the other way. Default 0, straight. */
  curvature?: number
  /** Seconds for a pulse to travel the line. Default 3. */
  duration?: number
  /** Seconds before the first pulse. Default 0. */
  delay?: number
  /** Travel from `to` to `from`. */
  reverse?: boolean
  /** Length of the pulse, as a share of the line, 0 to 1. Default 0.25. */
  pulse?: number
  /** Any CSS color for the pulse. Default the primary color. */
  color?: string
}

/**
 * A line between two elements with a pulse of light running along it, for diagrams of what
 * talks to what. It follows both ends as the layout changes. With reduced motion only the
 * line is drawn.
 */
function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  reverse = false,
  pulse = 0.25,
  color = 'var(--primary)',
  className,
  style,
  ...props
}: AnimatedBeamProps) {
  const [path, setPath] = React.useState('')

  React.useEffect(() => {
    const container = containerRef.current
    const from = fromRef.current
    const to = toRef.current
    if (!container || !from || !to) return
    const update = () => {
      const box = container.getBoundingClientRect()
      const a = from.getBoundingClientRect()
      const b = to.getBoundingClientRect()
      const x1 = a.left - box.left + a.width / 2
      const y1 = a.top - box.top + a.height / 2
      const x2 = b.left - box.left + b.width / 2
      const y2 = b.top - box.top + b.height / 2
      // The control point sits off the middle of the line, at right angles to it.
      const length = Math.hypot(x2 - x1, y2 - y1) || 1
      const cx = (x1 + x2) / 2 - ((y2 - y1) / length) * curvature
      const cy = (y1 + y2) / 2 + ((x2 - x1) / length) * curvature
      setPath(`M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`)
    }
    update()
    const resize = new ResizeObserver(update)
    for (const el of [container, from, to]) resize.observe(el)
    return () => resize.disconnect()
  }, [containerRef, fromRef, toRef, curvature])

  return (
    <svg
      aria-hidden="true"
      data-slot="animated-beam"
      fill="none"
      className={cn('pointer-events-none absolute inset-0 size-full overflow-visible', className)}
      style={{ color, ...style }}
      {...props}
    >
      <path d={path} pathLength={1} stroke="currentColor" strokeOpacity={0.15} strokeWidth={2} />
      <path
        d={path}
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={`${pulse} ${1 + pulse}`}
        className="animate-[animated-beam_var(--beam-duration)_linear_var(--beam-delay)_infinite_both] drop-shadow-[0_0_6px_currentColor] motion-reduce:hidden"
        style={
          {
            '--beam-duration': `${duration}s`,
            '--beam-delay': `${delay}s`,
            // The pulse starts just before one end and leaves just past the other.
            '--beam-from': reverse ? `${-1}` : `${pulse}`,
            '--beam-to': reverse ? `${pulse}` : `${-1}`,
          } as React.CSSProperties
        }
      />
    </svg>
  )
}

export { AnimatedBeam }
