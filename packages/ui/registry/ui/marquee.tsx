'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface MarqueeProps extends React.ComponentProps<'div'> {
  /** Scroll the other way. */
  reverse?: boolean
  /** Scroll up instead of sideways. */
  vertical?: boolean
  /** Stop while the pointer is over it. Default true. */
  pauseOnHover?: boolean
  /** Seconds for one full loop of the content. Default 40. */
  duration?: number
  /** Space between items, any CSS length. Default 1rem. */
  gap?: string
  /** How many copies of the content to lay out. Default 2, enough when the content is wider than the box. */
  repeat?: number
  /** Fade the edges out. Default true. */
  fade?: boolean
}

/**
 * Content that scrolls forever: logos, testimonials, tags. The children are repeated so
 * the loop has no seam. Pauses on hover and stands still with reduced motion.
 */
function Marquee({
  reverse = false,
  vertical = false,
  pauseOnHover = true,
  duration = 40,
  gap = '1rem',
  repeat = 2,
  fade = true,
  className,
  style,
  children,
  ...props
}: MarqueeProps) {
  const copies = Math.max(2, repeat)
  return (
    <div
      data-slot="marquee"
      data-orientation={vertical ? 'vertical' : 'horizontal'}
      className={cn(
        'group/marquee flex overflow-hidden [gap:var(--gap)]',
        vertical ? 'h-full flex-col' : 'w-full flex-row',
        className,
      )}
      style={
        {
          '--gap': gap,
          '--duration': `${duration}s`,
          maskImage: fade
            ? vertical
              ? 'linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent)'
              : 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)'
            : undefined,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {Array.from({ length: copies }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: identical copies of the same content
          key={i}
          aria-hidden={i > 0 || undefined}
          data-slot="marquee-group"
          className={cn(
            'flex shrink-0 justify-around [gap:var(--gap)] motion-reduce:animate-none',
            vertical ? 'flex-col' : 'flex-row',
            pauseOnHover && 'group-hover/marquee:[animation-play-state:paused]',
          )}
          style={{
            animation: `${vertical ? 'marquee-vertical' : 'marquee'} var(--duration) linear infinite${reverse ? ' reverse' : ''}`,
          }}
        >
          {children}
        </div>
      ))}
    </div>
  )
}

export { Marquee }
