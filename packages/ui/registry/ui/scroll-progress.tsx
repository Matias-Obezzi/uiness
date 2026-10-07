'use client'

import { ArrowUp } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { type ScrollDriver, useScrollDriver } from '@/hooks/use-scroll-driver'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ScrollProgressLabels {
  /** Accessible title and label for the return to top button in the circle variant. */
  backToTop: string
}

export const defaultScrollProgressLabels: ScrollProgressLabels = {
  backToTop: 'Back to top',
}

export interface ScrollProgressProps extends React.ComponentProps<'div'> {
  /**
   * Layout presentation style:
   * `'bar'`: slim indicator fixed to the top or bottom viewport edge.
   * `'circle'`: floating progress ring that scrolls back to the top when clicked.
   * Default 'bar'.
   */
  variant?: 'bar' | 'circle'
  /** Edge position for the bar variant: `'top' | 'bottom'`. Default 'top'. */
  position?: 'top' | 'bottom'
  /** Thickness of the progress bar or stroke width of the circle ring in pixels. Default 3. */
  thickness?: number
  /** Progress indicator color or gradient. Default 'var(--primary)'. */
  color?: string
  /** Scrollable container element to measure. Left out, tracks window scrolling. */
  target?: React.RefObject<HTMLElement | null>
  /** What drives the progress: `'auto' | 'css' | 'js'`. Default 'auto'. */
  driver?: ScrollDriver
  /** Diameter of the circular progress button in pixels. Default 44. */
  size?: number
  /** Label overrides or localization strings. */
  labels?: Partial<ScrollProgressLabels>
}

/**
 * Visual indicator tracking how far the user has scrolled through a page or container.
 * Runs on CSS scroll-driven animations where supported and falls back to JavaScript listeners.
 */
function ScrollProgress({
  variant = 'bar',
  position = 'top',
  thickness = 3,
  color = 'var(--primary)',
  target,
  driver = 'auto',
  size = 44,
  labels,
  className,
  style,
  ...props
}: ScrollProgressProps) {
  const words = useLabels('scroll-progress', defaultScrollProgressLabels, labels)
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const isCircle = variant === 'circle'

  const mode = useScrollDriver(ref, driver, {
    container: target?.current,
    supported: !target && !isCircle,
  })
  const css = mode === 'css' && !target && !isCircle

  const [percent, setPercent] = React.useState(0)

  React.useEffect(() => {
    const el = ref.current
    if (!el || css) return

    let frame = 0
    const scroller: EventTarget = target?.current ?? window

    const update = () => {
      frame = 0
      let progress = 0
      if (target?.current) {
        const s = target.current
        const max = s.scrollHeight - s.clientHeight
        progress = max > 0 ? s.scrollTop / max : 0
      } else {
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        progress = max > 0 ? window.scrollY / max : 0
      }

      const clamped = Math.max(0, Math.min(1, progress))
      el.style.setProperty('--scroll-progress', clamped.toFixed(4))

      if (isCircle) {
        const pct = Math.round(clamped * 100)
        setPercent((prev) => (prev !== pct ? pct : prev))
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [target, isCircle, css])

  const scrollToTop = () => {
    const scroller = target?.current ?? window
    scroller.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  if (isCircle) {
    const radius = (size - thickness * 2) / 2
    const circumference = 2 * Math.PI * radius

    return (
      <div
        ref={ref}
        data-slot="scroll-progress"
        data-variant="circle"
        className={cn('fixed right-6 bottom-6 z-50', className)}
        style={{ '--scroll-color': color, ...style } as React.CSSProperties}
        {...props}
      >
        <button
          type="button"
          aria-label={words.backToTop}
          title={words.backToTop}
          onClick={scrollToTop}
          className="group relative flex items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-border transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ width: size, height: size }}
        >
          <svg
            className="absolute inset-0 size-full -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness}
              className="opacity-15"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--scroll-color)"
              strokeWidth={thickness}
              strokeDasharray={circumference}
              strokeDashoffset={`calc(${circumference} * (1 - var(--scroll-progress, 0)))`}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-75"
            />
          </svg>
          <span className="font-semibold text-[10px] tabular-nums leading-none transition-opacity duration-150 group-hover:opacity-0">
            {percent}%
          </span>
          <ArrowUp className="absolute size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="scroll-progress"
      data-variant="bar"
      data-driver={mode}
      className={cn(
        'fixed right-0 left-0 z-50 origin-left motion-reduce:transition-none',
        position === 'top' ? 'top-0' : 'bottom-0',
        css
          ? 'motion-safe:supports-[animation-timeline:scroll()]:[animation-name:scroll-progress] motion-safe:supports-[animation-timeline:scroll()]:[animation-timeline:scroll()] motion-safe:supports-[animation-timeline:scroll()]:[animation-timing-function:linear] motion-safe:supports-[animation-timeline:scroll()]:[animation-fill-mode:both]'
          : 'transition-transform duration-75 [transform:scaleX(var(--scroll-progress,0))]',
        className,
      )}
      style={
        {
          height: `${thickness}px`,
          background: color,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { ScrollProgress }
