'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface OrbitProps extends React.ComponentProps<'div'> {
  /** Distance from the center to the items, in pixels. Default 100. */
  radius?: number
  /** Seconds for one full lap. Default 20. */
  duration?: number
  /** Go counterclockwise. */
  reverse?: boolean
  /** Draw the circle the items travel along. Default true. */
  path?: boolean
  /** Stop while the pointer is over one of the items. */
  pauseOnHover?: boolean
}

const OrbitContext = React.createContext<{ index: number; count: number } | null>(null)

/**
 * Items circling a center, spread evenly around the ring and kept upright. Centered in its
 * parent, so give the parent `relative` and room for the ring. Stack a few with different
 * radii for concentric orbits.
 */
function Orbit({
  radius = 100,
  duration = 20,
  reverse = false,
  path = true,
  pauseOnHover = false,
  className,
  style,
  children,
  ...props
}: OrbitProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  return (
    <div
      data-slot="orbit"
      data-reverse={reverse ? '' : undefined}
      data-pause-on-hover={pauseOnHover ? '' : undefined}
      className={cn(
        'group/orbit pointer-events-none absolute inset-0 m-auto size-(--orbit-size)',
        className,
      )}
      style={
        {
          '--orbit-size': `${radius * 2}px`,
          '--orbit-radius': `${radius}px`,
          '--orbit-duration': `${duration}s`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {path && (
        <div
          aria-hidden
          data-slot="orbit-path"
          className="absolute inset-0 rounded-full border border-border"
        />
      )}
      {items.map((child, index) => (
        <OrbitContext.Provider key={child.key ?? index} value={{ index, count: items.length }}>
          {child}
        </OrbitContext.Provider>
      ))}
    </div>
  )
}

export interface OrbitItemProps extends React.ComponentProps<'div'> {
  /** Starting angle in degrees. By default items are spread evenly. */
  angle?: number
}

/** One thing on an `Orbit`. It stays upright while it travels. */
function OrbitItem({ angle, className, style, ...props }: OrbitItemProps) {
  const ctx = React.useContext(OrbitContext)
  const start = angle ?? (ctx ? (360 / ctx.count) * ctx.index : 0)
  return (
    <div
      data-slot="orbit-item"
      className={cn(
        'pointer-events-auto absolute top-1/2 left-1/2 flex -translate-1/2 items-center justify-center',
        'animate-[orbit_var(--orbit-duration)_linear_infinite] group-data-reverse/orbit:[animation-direction:reverse] motion-reduce:animate-none',
        'group-data-pause-on-hover/orbit:group-hover/orbit:[animation-play-state:paused]',
        className,
      )}
      style={
        {
          '--orbit-angle': `${start}deg`,
          // Where it sits when the animation is off.
          transform:
            'rotate(var(--orbit-angle)) translateX(var(--orbit-radius)) rotate(calc(var(--orbit-angle) * -1))',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Orbit, OrbitItem }
