'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface StackScrollProps extends React.ComponentProps<'div'> {
  /** Where the first card sticks, in pixels from the top of the scroller. Default 96. */
  top?: number
  /** How much of each card stays showing above the next, in pixels. Default 16. */
  offset?: number
  /** How much a card shrinks for each card stacked on it, 0 to 1. Default 0.05. */
  shrink?: number
}

/**
 * Cards that pile up as the page scrolls: each one sticks a little under the last, and the
 * ones underneath shrink and dim as more land on them. Wrap each card in `StackScrollItem`.
 * Works in the page or any scroller. With reduced motion they stack without shrinking.
 */
function StackScroll({
  top = 96,
  offset = 16,
  shrink = 0.05,
  className,
  style,
  ...props
}: StackScrollProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const root = ref.current
    if (!root || reduced) return
    let frame = 0
    const update = () => {
      frame = 0
      const items = Array.from(root.querySelectorAll<HTMLElement>('[data-slot=stack-scroll-item]'))
      const boxes = items.map((item) => item.getBoundingClientRect())
      items.forEach((item, i) => {
        const box = boxes[i]
        if (!box) return
        // How many of the cards after this one sit on it, counting one arriving as a share.
        let depth = 0
        for (const next of boxes.slice(i + 1)) {
          depth += Math.min(1, Math.max(0, (box.bottom - next.top) / box.height))
        }
        const card = item.firstElementChild as HTMLElement | null
        if (!card) return
        card.style.scale = String(Math.max(0.5, 1 - depth * shrink))
        card.style.filter = depth > 0 ? `brightness(${Math.max(0.6, 1 - depth * 0.08)})` : ''
      })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    // Capturing, so a scroll in any scroller around it is heard, not only the page's.
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      for (const card of root.querySelectorAll<HTMLElement>('[data-slot=stack-scroll-item] > *')) {
        card.style.scale = ''
        card.style.filter = ''
      }
    }
  }, [reduced, shrink])

  return (
    <div
      ref={ref}
      data-slot="stack-scroll"
      className={cn('flex flex-col', className)}
      style={
        {
          '--stack-top': `${top}px`,
          '--stack-offset': `${offset}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export interface StackScrollItemProps extends React.ComponentProps<'div'> {
  /** Its place in the stack, from 0. Sets how far below the last card it sticks. */
  index: number
}

/** One card of a `StackScroll`. The card's own classes go on `className`. */
function StackScrollItem({ index, className, children, style, ...props }: StackScrollItemProps) {
  return (
    <div
      data-slot="stack-scroll-item"
      className="sticky pb-8"
      style={{ top: `calc(var(--stack-top) + ${index} * var(--stack-offset))`, ...style }}
      {...props}
    >
      <div className={cn('origin-top will-change-transform', className)}>{children}</div>
    </div>
  )
}

export { StackScroll, StackScrollItem }
