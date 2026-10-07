'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface SpinningTextProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The text string whose characters are arranged around the circular path. */
  children: string
  /** Duration of one full 360-degree revolution in seconds. Default `10`. */
  duration?: number
  /** Whether the text revolves counter-clockwise instead of clockwise. Default `false`. */
  reverse?: boolean
  /** Circle radius, in em units if a number is provided. Default `5`. */
  radius?: number | string
  /** Pause the circular rotation when hovered by a pointer. Default `false`. */
  pauseOnHover?: boolean
  /** Optional element rendered in the center of the spinning circle, such as an icon or avatar. */
  center?: React.ReactNode
}

/**
 * Arranges characters along a circular path that rotates continuously.
 *
 * Screen readers hear the complete string through `role="img"` and `aria-label`
 * on the root container, while individual character nodes are marked `aria-hidden`.
 * With reduced motion, the rotation stops and the characters remain positioned
 * cleanly along the ring.
 */
function SpinningText({
  children,
  duration = 10,
  reverse = false,
  radius = 5,
  pauseOnHover = false,
  center,
  className,
  style,
  ...props
}: SpinningTextProps) {
  const chars = Array.from(children)
  const radiusValue = typeof radius === 'number' ? `${radius}em` : radius

  return (
    <div
      role="img"
      aria-label={children}
      data-slot="spinning-text"
      className={cn(
        'relative inline-flex items-center justify-center select-none',
        pauseOnHover && 'group',
        className,
      )}
      style={
        {
          width: `calc(${radiusValue} * 2 + 2.5em)`,
          height: `calc(${radiusValue} * 2 + 2.5em)`,
          '--radius': radiusValue,
          '--duration': `${duration}s`,
          '--n': chars.length,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Circular rotating ring carrying each character */}
      <div
        aria-hidden="true"
        data-slot="spinning-text-ring"
        className={cn(
          'absolute inset-0 flex items-center justify-center motion-reduce:animate-none',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
        style={{
          animation: `spin var(--duration) linear infinite ${reverse ? 'reverse' : 'normal'}`,
        }}
      >
        {chars.map((char, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: characters are positional along the perimeter
            key={i}
            aria-hidden="true"
            data-slot="spinning-text-char"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center whitespace-pre"
            style={
              {
                '--i': i,
                transform:
                  'rotate(calc(var(--i) * 360deg / var(--n))) translateY(calc(-1 * var(--radius)))',
              } as React.CSSProperties
            }
          >
            {char}
          </span>
        ))}
      </div>

      {/* Center slot */}
      {center ? (
        <div
          data-slot="spinning-text-center"
          className="relative z-1 pointer-events-auto flex items-center justify-center"
        >
          {center}
        </div>
      ) : null}
    </div>
  )
}

export { SpinningText }
