'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LensPosition {
  /** Horizontal coordinate in pixels relative to the top-left of the container. */
  x: number
  /** Vertical coordinate in pixels relative to the top-left of the container. */
  y: number
}

export interface LensProps extends React.ComponentProps<'div'> {
  /** How much larger the content appears under the glass. Default 2. */
  zoom?: number
  /** Diameter or side length of the magnifying glass in pixels. Default 160. */
  size?: number
  /** The cutout geometry: a round loupe or a soft square. Default 'circle'. */
  shape?: 'circle' | 'square'
  /** Fixes the lens over a static coordinate, disabling pointer tracking. */
  position?: LensPosition
  /** Disables the magnifying glass and hides the overlay. Default false. */
  disabled?: boolean
  /** Whether to draw a ring outline around the lens, or custom utility classes for it. Default true. */
  ring?: boolean | string
}

/**
 * A magnifying loupe that follows the pointer over an image or any other content.
 * The magnified layer is cloned inside an inert overlay clipped to the lens shape,
 * so screen readers and focus navigation interact with the real content only once.
 */
function Lens({
  zoom = 2,
  size = 160,
  shape = 'circle',
  position,
  disabled = false,
  ring = true,
  className,
  style,
  children,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...props
}: LensProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isStatic = position !== undefined
  const [hovered, setHovered] = React.useState(false)
  const active = isStatic || hovered

  const updatePosition = (clientX: number, clientY: number) => {
    const el = ref.current
    if (!el || isStatic || disabled) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    el.style.setProperty('--lens-x', `${x.toFixed(2)}px`)
    el.style.setProperty('--lens-y', `${y.toFixed(2)}px`)
  }

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isStatic && position) {
      el.style.setProperty('--lens-x', `${position.x.toFixed(2)}px`)
      el.style.setProperty('--lens-y', `${position.y.toFixed(2)}px`)
    }
  }, [isStatic, position])

  const clipPathStyle =
    shape === 'circle'
      ? 'circle(calc(var(--lens-size, 160px) / 2) at var(--lens-x, 0px) var(--lens-y, 0px))'
      : 'inset(calc(var(--lens-y, 0px) - var(--lens-size, 160px) / 2) calc(100% - (var(--lens-x, 0px) + var(--lens-size, 160px) / 2)) calc(100% - (var(--lens-y, 0px) + var(--lens-size, 160px) / 2)) calc(var(--lens-x, 0px) - var(--lens-size, 160px) / 2) round 12px)'

  return (
    <div
      ref={ref}
      data-slot="lens"
      data-state={active && !disabled ? 'active' : 'idle'}
      className={cn('relative overflow-hidden', className)}
      style={
        {
          '--lens-size': `${size}px`,
          '--lens-zoom': zoom,
          ...(isStatic && position
            ? {
                '--lens-x': `${position.x.toFixed(2)}px`,
                '--lens-y': `${position.y.toFixed(2)}px`,
              }
            : {}),
          ...style,
        } as React.CSSProperties
      }
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        if (!disabled && !isStatic) setHovered(true)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        if (!isStatic) setHovered(false)
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e)
        updatePosition(e.clientX, e.clientY)
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (!disabled && !isStatic) {
          setHovered(true)
          updatePosition(e.clientX, e.clientY)
        }
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e)
        if (!isStatic && e.pointerType === 'touch') setHovered(false)
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e)
        if (!isStatic && e.pointerType === 'touch') setHovered(false)
      }}
      {...props}
    >
      {children}

      <div
        aria-hidden="true"
        inert
        data-slot="lens-overlay"
        className={cn(
          'pointer-events-none absolute inset-0 select-none transition-opacity duration-150',
          active && !disabled ? 'opacity-100' : 'opacity-0',
        )}
        style={{ clipPath: clipPathStyle }}
      >
        <div
          className="size-full"
          style={{
            transform: 'scale(var(--lens-zoom, 2))',
            transformOrigin: 'var(--lens-x, 0px) var(--lens-y, 0px)',
          }}
        >
          {children}
        </div>
      </div>

      {ring && (
        <div
          aria-hidden="true"
          data-slot="lens-ring"
          className={cn(
            'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 shadow-lg ring-2 ring-primary/60 transition-opacity duration-150',
            shape === 'circle' ? 'rounded-full' : 'rounded-xl',
            typeof ring === 'string' && ring,
            active && !disabled ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            left: 'var(--lens-x, 0px)',
            top: 'var(--lens-y, 0px)',
            width: 'var(--lens-size, 160px)',
            height: 'var(--lens-size, 160px)',
          }}
        />
      )}
    </div>
  )
}

export { Lens }
