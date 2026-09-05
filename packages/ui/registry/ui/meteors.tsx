'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

/** Deterministic pseudo random, so the server and the client draw the same sky. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export interface MeteorsProps extends React.ComponentProps<'div'> {
  /** How many streaks. Default 20. */
  count?: number
  /** Angle of travel in degrees. Default 215. */
  angle?: number
  /** Any CSS color. Default the foreground color. */
  color?: string
}

/**
 * Streaks that fall across the parent. Absolutely positioned, so give the parent
 * `relative` and `overflow-hidden`.
 */
function Meteors({
  count = 20,
  angle = 215,
  color = 'var(--foreground)',
  className,
  style,
  ...props
}: MeteorsProps) {
  return (
    <div
      aria-hidden
      data-slot="meteors"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ '--angle': `${angle}deg`, '--meteor-color': color, ...style } as React.CSSProperties}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: meteors are positional, seeded by index
          key={i}
          data-slot="meteor"
          className="absolute h-0.5 w-0.5 rounded-full bg-(--meteor-color) opacity-0 shadow-[0_0_0_1px_color-mix(in_oklab,var(--meteor-color)_15%,transparent)] before:absolute before:top-1/2 before:h-px before:w-16 before:-translate-y-1/2 before:bg-linear-to-r before:from-(--meteor-color) before:to-transparent before:content-[''] motion-reduce:hidden"
          style={{
            // The angle lives on `rotate`, so it holds while the animation waits out its delay.
            rotate: 'var(--angle)',
            top: `${rand(i * 3 + 1) * 60 - 10}%`,
            left: `${rand(i * 3 + 2) * 120 - 10}%`,
            animation: `meteor ${(rand(i * 3 + 3) * 5 + 4).toFixed(2)}s linear ${(rand(i * 7 + 5) * 8).toFixed(2)}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export { Meteors }
