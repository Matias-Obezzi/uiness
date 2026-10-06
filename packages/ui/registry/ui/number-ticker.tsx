'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useMotionReady } from '@/hooks/use-motion-ready'
import { useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface NumberTickerProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The number to land on. */
  value: number
  /** Where the count starts. Default 0. */
  from?: number
  /** Milliseconds for the whole count. Default 1500. */
  duration?: number
  /** Milliseconds before it starts. Default 0. */
  delay?: number
  /** Digits after the decimal point. Default 0. */
  decimals?: number
  /** Formatting locale, defaults to the browser's. */
  locale?: string
  /** Extra Intl.NumberFormat options, for currency or units. */
  format?: Intl.NumberFormatOptions
  /** Wait for the element to scroll into view. Default true. */
  whenVisible?: boolean
}

const easeOut = (t: number) => 1 - (1 - t) ** 3

/**
 * A number that counts up, or down, to its value when it scrolls into view.
 * Renders the final value for screen readers and with reduced motion.
 *
 * The server renders the final value. After mount, with motion allowed and the number not on
 * screen yet, it drops to `from` and counts when it scrolls in. The final value keeps holding
 * the width while it counts, so nothing around it moves.
 */
function NumberTicker({
  value,
  from = 0,
  duration = 1500,
  delay = 0,
  decimals = 0,
  locale: localeProp,
  format,
  whenVisible = true,
  className,
  ...props
}: NumberTickerProps) {
  const locale = useLocale(localeProp)
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  const ready = useMotionReady(ref)
  const animate = ready === 'armed'
  const play = animate && (!whenVisible || inView)
  // The final value first: that is what the server sends and what crawlers read.
  const [current, setCurrent] = React.useState(value)
  const [reset, setReset] = React.useState(false)
  if (animate && !reset) {
    setReset(true)
    setCurrent(from)
  }

  React.useEffect(() => {
    if (!animate) {
      setCurrent(value)
      return
    }
    if (!play) return
    let frame = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min((now - start) / duration, 1)
      setCurrent(from + (value - from) * easeOut(t))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [animate, play, value, from, duration, delay])

  const formatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        ...format,
      }),
    [locale, decimals, format],
  )

  return (
    <span
      ref={ref}
      data-slot="number-ticker"
      className={cn('inline-block tabular-nums', className)}
      {...props}
    >
      <span className="sr-only">{formatter.format(value)}</span>
      {animate ? (
        <span aria-hidden className="inline-grid justify-items-end">
          {/* The final value as generated content: it holds the width, but is not text twice. */}
          <span
            data-slot="number-ticker-sizer"
            data-value={formatter.format(value)}
            className="invisible [grid-area:1/1] before:content-[attr(data-value)]"
          />
          <span data-slot="number-ticker-value" className="[grid-area:1/1]">
            {formatter.format(current)}
          </span>
        </span>
      ) : (
        <span aria-hidden data-slot="number-ticker-value">
          {formatter.format(current)}
        </span>
      )}
    </span>
  )
}

export { NumberTicker }
