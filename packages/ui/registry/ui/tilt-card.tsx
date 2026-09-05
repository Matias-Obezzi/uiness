'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface TiltCardProps extends React.ComponentProps<'div'> {
  /** Largest rotation in degrees. Default 12. */
  max?: number
  /** Scale while hovered. Default 1.02. */
  scale?: number
  /** Perspective in pixels. Default 1000. */
  perspective?: number
  /** Show a light reflection that moves with the tilt. Default true. */
  glare?: boolean
  /** Milliseconds to settle back when the pointer leaves. Default 500. */
  duration?: number
}

/**
 * A card that tilts towards the pointer in 3D. Give children a `translateZ` through
 * `TiltCardItem` and they float above the surface.
 */
function TiltCard({
  max = 12,
  scale = 1.02,
  perspective = 1000,
  glare = true,
  duration = 500,
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [hover, setHover] = React.useState(false)

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    const el = ref.current
    if (!el || reduced) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    el.style.setProperty('--tilt-x', `${((py - 0.5) * -2 * max).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${((px - 0.5) * 2 * max).toFixed(2)}deg`)
    el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`)
    if (!hover) setHover(true)
  }

  const leave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
    setHover(false)
  }

  return (
    <div
      data-slot="tilt-card-scene"
      className="[perspective:var(--perspective)]"
      style={{ '--perspective': `${perspective}px` } as React.CSSProperties}
    >
      <div
        ref={ref}
        data-slot="tilt-card"
        data-hover={hover ? '' : undefined}
        className={cn(
          'group/tilt relative rounded-xl border bg-card text-card-foreground shadow-sm transition-transform ease-out will-change-transform [transform-style:preserve-3d] motion-reduce:transform-none',
          className,
        )}
        style={{
          transform: `rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale(${hover ? scale : 1})`,
          transitionDuration: hover ? '80ms' : `${duration}ms`,
          ...style,
        }}
        onPointerMove={move}
        onPointerLeave={leave}
        {...props}
      >
        {children}
        {glare && (
          <div
            aria-hidden
            data-slot="tilt-card-glare"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
            style={{
              background:
                'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgb(255 255 255 / 0.18), transparent 60%)',
            }}
          />
        )}
      </div>
    </div>
  )
}

export interface TiltCardItemProps extends React.ComponentProps<'div'> {
  /** How far above the card it floats, in pixels. Default 40. */
  depth?: number
}

/** Something inside a `TiltCard` that pops out of the surface. */
function TiltCardItem({ depth = 40, className, style, ...props }: TiltCardItemProps) {
  return (
    <div
      data-slot="tilt-card-item"
      className={cn('[transform-style:preserve-3d]', className)}
      style={{ transform: `translateZ(${depth}px)`, ...style }}
      {...props}
    />
  )
}

export { TiltCard, TiltCardItem }
