import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PatternProps extends React.ComponentProps<'svg'> {
  /** `grid` lines or `dots`. Default grid. */
  variant?: 'grid' | 'dots'
  /** Cell size in pixels. Default 32. */
  size?: number
  /** Fade towards the edges so content in the middle stays readable. Default true. */
  fade?: boolean
  /** Where the fade is centered, CSS position. Default center. */
  fadeAt?: string
}

/**
 * A grid or dot background that fades out towards the edges. Absolutely positioned, so
 * give the parent `relative`. The lines take the border color, override with `text-*`.
 */
function Pattern({
  variant = 'grid',
  size = 32,
  fade = true,
  fadeAt = 'center',
  className,
  style,
  ...props
}: PatternProps) {
  const id = React.useId()
  return (
    <svg
      aria-hidden
      data-slot="pattern"
      className={cn('pointer-events-none absolute inset-0 size-full text-border', className)}
      style={{
        maskImage: fade
          ? `radial-gradient(ellipse at ${fadeAt}, #000 20%, transparent 75%)`
          : undefined,
        ...style,
      }}
      {...props}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          {variant === 'grid' ? (
            <path
              d={`M ${size} 0 L 0 0 0 ${size}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
          ) : (
            <circle cx={size / 2} cy={size / 2} r={1} fill="currentColor" />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export { Pattern }
