'use client'

import { type Offset, useScrollEffect } from '@uiness/scroll'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextRevealProps extends Omit<React.ComponentProps<'p'>, 'children'> {
  /** The paragraph. Split into words on whitespace. */
  text: string
  /** Opacity of a word not reached yet, 0 to 1. Default 0.15. */
  from?: number
  /**
   * When the reveal starts and ends, as `@uiness/scroll` offsets. Default from the top of the
   * paragraph at 85% down the viewport to its bottom at 45%.
   */
  offset?: Offset
  /**
   * Scrolling ancestor. Left out, the nearest one that actually scrolls is used, or the
   * window. Pass `null` to always follow the window.
   */
  container?: HTMLElement | null
}

const defaultOffset: Offset = ['start 0.85', 'end 0.45']

/**
 * A paragraph whose words light up one after another as it scrolls through the viewport.
 * Scroll progress goes into a single CSS variable, so nothing re-renders while scrolling.
 * The text is always in the document for screen readers, and fully visible with reduced motion.
 */
function TextReveal({
  text,
  from = 0.15,
  offset = defaultOffset,
  container,
  className,
  style,
  ...props
}: TextRevealProps) {
  const ref = React.useRef<HTMLParagraphElement>(null)
  const words = text.split(/\s+/).filter(Boolean)

  useScrollEffect(
    ref,
    ({ progress }) => {
      ref.current?.style.setProperty('--text-reveal-progress', progress.toFixed(4))
    },
    { offset, container },
  )

  return (
    <p
      ref={ref}
      data-slot="text-reveal"
      className={cn('text-pretty', className)}
      style={
        {
          '--text-reveal-from': from,
          '--text-reveal-count': words.length,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {words.map((word, i) => (
        <React.Fragment
          // biome-ignore lint/suspicious/noArrayIndexKey: words are positional and may repeat
          key={i}
        >
          {i > 0 && ' '}
          <span
            data-slot="text-reveal-word"
            className="motion-reduce:opacity-100!"
            style={
              {
                '--i': i,
                // Each word fades in over its own slice of the progress, the next one follows.
                opacity:
                  'clamp(var(--text-reveal-from), calc(var(--text-reveal-from) + (1 - var(--text-reveal-from)) * (var(--text-reveal-progress, 0) * var(--text-reveal-count) - var(--i))), 1)',
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        </React.Fragment>
      ))}
    </p>
  )
}

export { TextReveal }
