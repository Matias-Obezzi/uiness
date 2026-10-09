'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProximityGlowProps extends React.ComponentProps<'div'> {
  /** How far from the pointer an edge still glows, in pixels. Default 240. */
  radius?: number
  /** Any CSS color. Default the primary color. */
  color?: string
}

/**
 * A group of cards whose borders light up near the pointer, brightest where it is closest,
 * across every card at once, like a torch moved over them. Wrap the cards in
 * `ProximityGlowItem`. The pointer is followed without re-rendering React.
 */
function ProximityGlow({
  radius = 240,
  color = 'var(--primary)',
  className,
  style,
  onPointerMove,
  onPointerLeave,
  ...props
}: ProximityGlowProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef(0)
  const point = React.useRef({ x: 0, y: 0 })

  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const place = () => {
    frame.current = 0
    const root = ref.current
    if (!root) return
    // Each card gets the pointer in its own coordinates, so its gradient centers right.
    for (const item of root.querySelectorAll<HTMLElement>('[data-slot=proximity-glow-item]')) {
      const box = item.getBoundingClientRect()
      item.style.setProperty('--glow-x', `${point.current.x - box.left}px`)
      item.style.setProperty('--glow-y', `${point.current.y - box.top}px`)
    }
  }

  return (
    <div
      ref={ref}
      data-slot="proximity-glow"
      className={cn('group/glow', className)}
      style={
        { '--glow-radius': `${radius}px`, '--glow-color': color, ...style } as React.CSSProperties
      }
      onPointerMove={(e) => {
        onPointerMove?.(e)
        point.current = { x: e.clientX, y: e.clientY }
        e.currentTarget.dataset.glowing = ''
        if (!frame.current) frame.current = requestAnimationFrame(place)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        delete e.currentTarget.dataset.glowing
      }}
      {...props}
    />
  )
}

/** A card inside `ProximityGlow`. Its border glows when the pointer comes near. */
function ProximityGlowItem({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="proximity-glow-item"
      className={cn('relative rounded-xl border bg-card text-card-foreground', className)}
      {...props}
    >
      {/* The glow is a gradient shown only through a one pixel ring, over the card's border. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] border border-transparent opacity-0 transition-opacity duration-(--duration-slow,300ms) [background:radial-gradient(var(--glow-radius)_circle_at_var(--glow-x,-999px)_var(--glow-y,-999px),var(--glow-color),transparent_70%)_border-box] [mask:linear-gradient(#000_0_0)_padding-box_exclude,linear-gradient(#000_0_0)_border-box] group-data-[glowing]/glow:opacity-100"
      />
      {/* A faint wash inside, so the card itself warms up under the pointer. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-(--duration-slow,300ms) [background:radial-gradient(calc(var(--glow-radius)*1.5)_circle_at_var(--glow-x,-999px)_var(--glow-y,-999px),color-mix(in_oklab,var(--glow-color)_8%,transparent),transparent_70%)] group-data-[glowing]/glow:opacity-100"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export { ProximityGlow, ProximityGlowItem }
