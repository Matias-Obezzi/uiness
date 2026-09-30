'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface RetroGridProps extends React.ComponentProps<'div'> {
  /** Tilt of the floor in degrees, 0 is flat facing you, 90 is edge on. Default 65. */
  angle?: number
  /** Size of one square in pixels. Default 60. */
  cellSize?: number
  /** Squares per second rolling towards you. 0 stands still. Default 1. */
  speed?: number
  /** Any CSS color. Default the foreground color, faded. */
  lineColor?: string
  /** Distance to the eye in pixels. Lower is more dramatic. Default 500. */
  perspective?: number
}

/**
 * A synthwave floor grid rolling towards you forever, fading out at the horizon. CSS only.
 * Absolutely positioned, so give the parent `relative` and put the content on top of it.
 * The horizon sits `perspective / tan(angle)` pixels above the bottom edge.
 */
function RetroGrid({
  angle = 65,
  cellSize = 60,
  speed = 1,
  lineColor = 'color-mix(in oklab, var(--foreground) 25%, transparent)',
  perspective = 500,
  className,
  style,
  ...props
}: RetroGridProps) {
  const rad = (Math.min(Math.max(angle, 1), 89) * Math.PI) / 180
  const horizon = perspective / Math.tan(rad)
  // The floor is four perspectives deep, and `edge` is how high its far end shows up.
  const depth = 4 * perspective * Math.sin(rad)
  const edge = (depth / (perspective + depth)) * horizon
  return (
    <div
      aria-hidden
      data-slot="retro-grid"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [perspective-origin:50%_100%] [perspective:var(--retro-grid-perspective)]',
        className,
      )}
      style={
        {
          '--retro-grid-perspective': `${perspective}px`,
          '--retro-grid-angle': `${angle}deg`,
          '--retro-grid-cell': `${cellSize}px`,
          '--retro-grid-line': lineColor,
          '--retro-grid-duration': `${speed > 0 ? 1 / speed : 0}s`,
          maskImage: `linear-gradient(to top, #000 ${Math.round(edge * 0.4)}px, transparent ${Math.round(edge)}px)`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="retro-grid-floor"
        className="absolute inset-0 origin-bottom [transform:rotateX(var(--retro-grid-angle))]"
      >
        <div
          data-slot="retro-grid-lines"
          className={cn(
            'absolute bottom-0 -left-[200%] h-[calc(var(--retro-grid-perspective)*4)] w-[500%] [background-position:center_bottom] [background-size:var(--retro-grid-cell)_var(--retro-grid-cell)]',
            '[background-image:linear-gradient(to_right,var(--retro-grid-line)_1px,transparent_0),linear-gradient(to_bottom,var(--retro-grid-line)_1px,transparent_0)]',
            speed > 0 && 'animate-[retro-grid_var(--retro-grid-duration)_linear_infinite]',
            'motion-reduce:animate-none',
          )}
        />
      </div>
    </div>
  )
}

export { RetroGrid }
