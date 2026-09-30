'use client'

import { scrollParent } from '@uiness/scroll'
import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface VelocityMarqueeProps extends React.ComponentProps<'div'> {
  /** Pixels per second while the page is still. Default 50. */
  baseVelocity?: number
  /** Which way the first row runs. The rows after it take turns. Default 'left'. */
  direction?: 'left' | 'right'
  /** How strongly scrolling speeds the rows up. 0 ignores the scroll. Default 1. */
  sensitivity?: number
  /** Space between the copies of a row, any CSS length. Default 2rem. */
  gap?: string
}

interface Row {
  track: HTMLElement
  copy: HTMLElement
  sign: 1 | -1
  x: number
}

/**
 * Rows of text that run sideways forever and speed up while the page scrolls. Scrolling
 * back up turns them around. Each direct child is one row, and rows alternate direction.
 * Stops while off screen and stands still with reduced motion.
 */
function VelocityMarquee({
  baseVelocity = 50,
  direction = 'left',
  sensitivity = 1,
  gap = '2rem',
  className,
  style,
  children,
  ...props
}: VelocityMarqueeProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()
  const rows = React.useRef(new Set<Row>())
  const first = direction === 'left' ? 1 : -1

  const register = React.useCallback((row: Row) => {
    rows.current.add(row)
    return () => {
      rows.current.delete(row)
    }
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el || !inView || reduced) return
    const scroller = scrollParent(el, 'y')
    const read = () => (scroller ? scroller.scrollTop : window.scrollY)
    let lastY = read()
    let last = performance.now()
    let velocity = 0
    // Keeps the way the page last went, so the rows stay reversed until it scrolls down again.
    let turn = 1
    let frame = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const y = read()
      const raw = dt > 0 ? (y - lastY) / dt : 0
      lastY = y
      // Smooth the raw speed so one jumpy frame does not jerk the rows.
      velocity += (raw - velocity) * (1 - Math.exp(-dt * 8))
      const boost = (velocity / 1000) * 5 * sensitivity
      if (boost < -0.01) turn = -1
      else if (boost > 0.01) turn = 1
      const step = baseVelocity * dt * turn * (1 + Math.abs(boost))
      for (const row of rows.current) {
        const width = row.copy.offsetWidth
        if (!width) continue
        row.x = (((row.x - step * row.sign) % width) - width) % width
        row.track.style.transform = `translate3d(${row.x.toFixed(2)}px, 0, 0)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, baseVelocity, sensitivity])

  return (
    <div
      ref={ref}
      data-slot="velocity-marquee"
      className={cn('flex w-full flex-col overflow-hidden', className)}
      style={{ '--gap': gap, ...style } as React.CSSProperties}
      {...props}
    >
      {React.Children.toArray(children).map((child, i) => (
        <VelocityMarqueeRow
          key={React.isValidElement(child) && child.key != null ? child.key : i}
          sign={i % 2 === 0 ? first : (-first as 1 | -1)}
          register={register}
        >
          {child}
        </VelocityMarqueeRow>
      ))}
    </div>
  )
}

interface VelocityMarqueeRowProps {
  sign: 1 | -1
  register: (row: Row) => () => void
  children: React.ReactNode
}

/** One row: as many copies of the content as it takes to cover the width, plus one. */
function VelocityMarqueeRow({ sign, register, children }: VelocityMarqueeRowProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const copy = React.useRef<HTMLDivElement>(null)
  const [copies, setCopies] = React.useState(2)

  React.useEffect(() => {
    if (!track.current || !copy.current) return
    return register({ track: track.current, copy: copy.current, sign, x: 0 })
  }, [register, sign])

  React.useEffect(() => {
    const row = ref.current
    const first = copy.current
    if (!row || !first) return
    const measure = () => {
      const width = first.offsetWidth
      if (width) setCopies(Math.max(2, Math.ceil(row.offsetWidth / width) + 1))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(row)
    ro.observe(first)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} data-slot="velocity-marquee-row" className="flex overflow-hidden">
      <div
        ref={track}
        data-slot="velocity-marquee-track"
        className="flex w-max shrink-0 whitespace-nowrap will-change-transform"
      >
        {Array.from({ length: copies }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: identical copies of the same content
            key={i}
            ref={i === 0 ? copy : undefined}
            aria-hidden={i > 0 || undefined}
            className="shrink-0 pr-(--gap)"
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}

export { VelocityMarquee }
