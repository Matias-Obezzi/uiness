'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface AuroraProps extends React.ComponentProps<'div'> {
  /** Up to three CSS colors for the blobs. Defaults to the primary color and two neighbours. */
  colors?: [string, string?, string?]
  /** Seconds for one full drift. Default 18. */
  duration?: number
  /** Fade the edges so the aurora sits behind content. Default true. */
  fade?: boolean
  /** Blur in pixels. Default 80. */
  blur?: number
}

/**
 * Slow drifting blobs of color, blurred into an aurora. Absolutely positioned, so give the
 * parent `relative` and put the content on top of it.
 */
function Aurora({
  colors = ['var(--primary)', 'oklch(0.7 0.18 300)', 'oklch(0.75 0.15 200)'],
  duration = 18,
  fade = true,
  blur = 80,
  className,
  style,
  ...props
}: AuroraProps) {
  const [a, b = a, c = b] = colors
  const blob = (color: string, extra: string, delay: number) => (
    <div
      className={cn(
        'absolute rounded-full opacity-60 mix-blend-screen motion-reduce:animate-none',
        extra,
      )}
      style={{
        background: `radial-gradient(circle at center, ${color}, transparent 65%)`,
        animation: `aurora ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  )
  return (
    <div
      aria-hidden
      data-slot="aurora"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{
        filter: `blur(${blur}px)`,
        maskImage: fade
          ? 'radial-gradient(ellipse at center, #000 40%, transparent 80%)'
          : undefined,
        ...style,
      }}
      {...props}
    >
      {blob(a, '-top-1/4 -left-1/4 size-[70%]', 0)}
      {blob(b, '-right-1/4 top-0 size-[60%]', -duration / 3)}
      {blob(c, '-bottom-1/3 left-1/4 size-[65%]', (-duration * 2) / 3)}
    </div>
  )
}

export { Aurora }
