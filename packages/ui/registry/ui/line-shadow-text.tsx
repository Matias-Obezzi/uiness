'use client'

import type * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface LineShadowTextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The text content to display with the line shadow effect. */
  children: React.ReactNode
  /** Color of the shadow lines. Default `'var(--foreground)'`. */
  shadowColor?: string
  /** HTML element to render as the root container. Default `'span'`. */
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div'
  /** Duration of the shadow animation cycle in seconds. Default `15`. */
  speed?: number | string
}

/**
 * Renders text with an offset shadow filled with moving diagonal lines.
 *
 * Screen readers encounter the text exactly once because the visual shadow
 * clone is marked with `aria-hidden`. With reduced motion, the diagonal
 * stripes remain visible as a static depth effect without continuous movement.
 */
function LineShadowText({
  children,
  shadowColor = 'var(--foreground)',
  as: Component = 'span',
  speed = 15,
  className,
  style,
  ...props
}: LineShadowTextProps) {
  const reduced = useReducedMotion()
  const duration = typeof speed === 'number' ? `${speed}s` : speed
  const Comp = Component as React.ElementType

  return (
    <Comp
      data-slot="line-shadow-text"
      className={cn('relative inline-block', className)}
      style={
        {
          '--shadow': shadowColor,
          '--speed': duration,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="relative z-1 inline-block">{children}</span>
      <span
        aria-hidden
        data-slot="line-shadow-text-shadow"
        className="pointer-events-none absolute inset-0 select-none motion-reduce:animate-none"
        style={{
          transform: 'translate(0.04em, 0.04em)',
          background:
            'linear-gradient(45deg, transparent 45%, var(--shadow) 45%, var(--shadow) 55%, transparent 0)',
          backgroundSize: '0.06em 0.06em',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: reduced ? 'none' : 'line-shadow var(--speed) linear infinite',
        }}
      >
        {children}
      </span>
    </Comp>
  )
}

export { LineShadowText }
