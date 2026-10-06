'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { type ScrollDriver, scrollParent, useScrollDriver } from '@/hooks/use-scroll-driver'
import { cn } from '@/lib/utils'

export interface VelocityMarqueeProps extends React.ComponentProps<'div'> {
  /** Pixels per second while the page is still. Default 50. */
  baseVelocity?: number
  /** Which way the first row runs. The rows after it take turns. Default 'left'. */
  direction?: 'left' | 'right'
  /**
   * How strongly scrolling speeds the rows up. 0 ignores the scroll. Default 1. With the CSS
   * driver it is how many copy widths the rows travel, on top of their own run, while the
   * marquee crosses the viewport.
   */
  sensitivity?: number
  /** Space between the copies of a row, any CSS length. Default 2rem. */
  gap?: string
  /**
   * What moves the rows. `js` reads the scroll speed every frame: faster scrolling, faster rows,
   * and they turn around when the page goes back up. `css` needs no JavaScript: the rows run
   * at a constant speed and, where CSS scroll-driven animations exist, are pushed along by the
   * scroll position, forwards going down and backwards going up. CSS cannot read speed, so
   * this is a nudge rather than a true velocity. `auto` uses CSS where scroll timelines exist
   * and JavaScript elsewhere. Default `js`.
   */
  driver?: ScrollDriver
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
  driver = 'js',
  className,
  style,
  children,
  ...props
}: VelocityMarqueeProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()
  const mode = useScrollDriver(ref, driver)
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
    if (!el || !inView || reduced || mode !== 'js') return
    // The same set for the life of the component; rows add and remove themselves in it.
    const list = rows.current
    const scroller = scrollParent(el)
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
      for (const row of list) {
        const width = row.copy.offsetWidth
        if (!width) continue
        row.x = (((row.x - step * row.sign) % width) - width) % width
        row.track.style.transform = `translate3d(${row.x.toFixed(2)}px, 0, 0)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      for (const row of list) row.track.style.removeProperty('transform')
    }
  }, [inView, reduced, mode, baseVelocity, sensitivity])

  const css = mode === 'css'

  return (
    <div
      ref={ref}
      data-slot="velocity-marquee"
      data-driver={mode}
      className={cn('flex w-full flex-col overflow-hidden', className)}
      style={
        {
          '--gap': gap,
          ...(css && {
            viewTimeline: '--velocity-marquee block',
            '--velocity-marquee-loops': Math.max(0, sensitivity),
          }),
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {React.Children.toArray(children).map((child, i) => (
        <VelocityMarqueeRow
          key={React.isValidElement(child) && child.key != null ? child.key : i}
          sign={i % 2 === 0 ? first : (-first as 1 | -1)}
          register={register}
          css={css}
          baseVelocity={baseVelocity}
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
  css: boolean
  baseVelocity: number
  children: React.ReactNode
}

/**
 * One row: as many copies of the content as it takes to cover the width, plus one. The CSS
 * driver moves the row twice over (its own run plus the scroll), so it keeps one more.
 */
function VelocityMarqueeRow({
  sign,
  register,
  css,
  baseVelocity,
  children,
}: VelocityMarqueeRowProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const copy = React.useRef<HTMLDivElement>(null)
  const spare = css ? 2 : 1
  // Before measuring there is no width to go by; four copies cover most rows on wide screens.
  const [copies, setCopies] = React.useState(css ? 4 : 2)
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    if (!track.current || !copy.current) return
    return register({ track: track.current, copy: copy.current, sign, x: 0 })
  }, [register, sign])

  React.useEffect(() => {
    const row = ref.current
    const first = copy.current
    if (!row || !first) return
    const measure = () => {
      const w = first.offsetWidth
      if (!w) return
      setWidth(w)
      setCopies(Math.max(2, Math.ceil(row.offsetWidth / w) + spare))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(row)
    ro.observe(first)
    return () => ro.disconnect()
  }, [spare])

  const reverse = sign === -1 ? 'reverse' : 'normal'

  return (
    <div ref={ref} data-slot="velocity-marquee-row" className="flex overflow-hidden">
      <div
        ref={track}
        data-slot="velocity-marquee-track"
        className={cn(
          'flex w-max shrink-0 whitespace-nowrap will-change-transform',
          // The scroll part: one copy width per loop, pushed by the marquee's view timeline.
          css &&
            'motion-safe:supports-[animation-timeline:view()]:[animation-name:velocity-marquee-scroll]',
        )}
        style={
          css
            ? ({
                '--velocity-marquee-copies': copies,
                animationTimeline: '--velocity-marquee',
                animationDuration: 'auto',
                animationTimingFunction: 'linear',
                animationFillMode: 'both',
                animationIterationCount: 'var(--velocity-marquee-loops)',
                animationDirection: reverse,
              } as React.CSSProperties)
            : undefined
        }
      >
        {Array.from({ length: copies }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: identical copies of the same content
            key={i}
            ref={i === 0 ? copy : undefined}
            aria-hidden={i > 0 || undefined}
            // The constant run: every copy slides one copy width per loop, so the seams line up.
            className={cn(
              'shrink-0 pr-(--gap)',
              css && 'motion-safe:[animation-name:velocity-marquee]',
            )}
            style={
              css
                ? {
                    // Without JavaScript nothing has been measured yet: 20 seconds a loop.
                    animationDuration: width
                      ? `${(width / Math.max(1, baseVelocity)).toFixed(2)}s`
                      : 'var(--velocity-marquee-duration, 20s)',
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    animationDirection: reverse,
                  }
                : undefined
            }
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}

export { VelocityMarquee }
