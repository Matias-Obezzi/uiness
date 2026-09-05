'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

function track(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`)
}

export interface SpotlightProps extends React.ComponentProps<'div'> {
  /** Diameter of the light in pixels. Default 480. */
  size?: number
  /** Any CSS color. Default the primary color. */
  color?: string
  /** Peak opacity of the light, 0 to 1. Default 0.15. */
  strength?: number
}

/**
 * A soft light that follows the pointer over its children. Put it around a hero, a section
 * or a card; the light only shows while the pointer is inside.
 */
function Spotlight({
  size = 480,
  color = 'var(--primary)',
  strength = 0.15,
  className,
  style,
  children,
  onPointerMove,
  ...props
}: SpotlightProps) {
  return (
    <div
      data-slot="spotlight"
      className={cn('group/spotlight relative overflow-hidden', className)}
      style={
        {
          '--spotlight-size': `${size}px`,
          '--spotlight-color': color,
          '--spotlight-strength': strength,
          ...style,
        } as React.CSSProperties
      }
      onPointerMove={(e) => {
        track(e)
        onPointerMove?.(e)
      }}
      {...props}
    >
      <div
        aria-hidden
        data-slot="spotlight-light"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spotlight:opacity-100"
        style={{
          background:
            'radial-gradient(var(--spotlight-size) circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), color-mix(in oklab, var(--spotlight-color) calc(var(--spotlight-strength) * 100%), transparent), transparent 70%)',
        }}
      />
      {children}
    </div>
  )
}

export interface SpotlightCardProps extends React.ComponentProps<'div'> {
  /** Any CSS color for the border glow. Default the primary color. */
  color?: string
  /** Diameter of the glow in pixels. Default 320. */
  size?: number
}

/**
 * A card whose border lights up around the pointer. Works well in a grid of several,
 * each one tracks the pointer on its own.
 */
function SpotlightCard({
  color = 'var(--primary)',
  size = 320,
  className,
  style,
  children,
  onPointerMove,
  ...props
}: SpotlightCardProps) {
  return (
    <div
      data-slot="spotlight-card"
      className={cn(
        'group/card relative rounded-xl border bg-card p-px text-card-foreground',
        className,
      )}
      style={
        {
          '--spotlight-color': color,
          '--spotlight-size': `${size}px`,
          ...style,
        } as React.CSSProperties
      }
      onPointerMove={(e) => {
        track(e)
        onPointerMove?.(e)
      }}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{
          background:
            'radial-gradient(var(--spotlight-size) circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-color), transparent 70%)',
          // Keep only a ring the width of the padding, so the glow reads as a border.
          mask: 'linear-gradient(#000, #000) content-box exclude, linear-gradient(#000, #000)',
          padding: 1,
        }}
      />
      <div className="relative h-full rounded-[inherit] bg-card">{children}</div>
    </div>
  )
}

export { Spotlight, SpotlightCard }
