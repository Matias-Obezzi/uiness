import { Slot } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface ShimmerProps extends React.ComponentProps<'span'> {
  asChild?: boolean
  /** Seconds for one sweep. Default 3. */
  duration?: number
  /** Color of the sweep. Any CSS color, `currentColor` included. Default the foreground color. */
  highlight?: string
  /**
   * Base color of the text. Any CSS color; `currentColor` is the color the text would have had,
   * so `color-mix(in oklab, currentColor 55%, transparent)` dims whatever it sits in, like a
   * button label. Default the foreground at 55%.
   */
  color?: string
  /** Width of the sweep as a percentage of the text. Default 30. */
  width?: number
}

/**
 * Text with a highlight that sweeps across it. Wrap a heading, or use `asChild` on a
 * button label. Inherits the font, so it fits anywhere.
 *
 * The glyphs are emptied with `-webkit-text-fill-color` rather than `color: transparent`, so
 * `color` keeps the inherited text color and `currentColor` in either color resolves to it.
 */
function Shimmer({
  asChild,
  duration = 3,
  highlight = 'var(--foreground)',
  color = 'color-mix(in oklab, var(--foreground) 55%, transparent)',
  width = 30,
  className,
  style,
  ...props
}: ShimmerProps) {
  const Comp = asChild ? Slot.Root : 'span'
  return (
    <Comp
      data-slot="shimmer"
      className={cn(
        'inline-block bg-clip-text [-webkit-text-fill-color:transparent] motion-reduce:animate-none motion-reduce:[-webkit-text-fill-color:currentColor]',
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(110deg, ${color} ${50 - width / 2}%, ${highlight} 50%, ${color} ${50 + width / 2}%)`,
        backgroundSize: '200% auto',
        animation: `shimmer ${duration}s linear infinite`,
        ...style,
      }}
      {...props}
    />
  )
}

export { Shimmer }
