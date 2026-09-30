'use client'

import { Slot } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const defaultColors = ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4']

/**
 * A gradient that repeats seamlessly: the first color comes back at the end, and the
 * image is twice the width of the box, so sliding it by its own width loops without a jump.
 */
function flowingGradient(colors: string[], angle: number) {
  const stops = colors.length > 0 ? colors : defaultColors
  return `linear-gradient(${angle}deg, ${[...stops, stops[0]].join(', ')})`
}

interface FlowingProps {
  /** Colors of the gradient, any CSS color. Default violet, pink, amber and cyan. */
  colors?: string[]
  /** How fast it flows, 1 is one full loop every 8 seconds. Default 1. */
  speed?: number
  /** Let the gradient flow. Default true. */
  animate?: boolean
  /** Direction of the gradient in degrees. Default 90, left to right. */
  angle?: number
}

function flowingStyle({ colors = defaultColors, speed = 1, angle = 90 }: FlowingProps) {
  return {
    '--gradient-duration': `${8 / Math.max(speed, 0.01)}s`,
    backgroundImage: flowingGradient(colors, angle),
    backgroundSize: '200% 100%',
  } as React.CSSProperties
}

const flowClasses =
  'animate-[gradient-text_var(--gradient-duration)_linear_infinite] motion-reduce:animate-none'

export interface GradientTextProps extends React.ComponentProps<'span'>, FlowingProps {
  asChild?: boolean
}

/**
 * Text filled with a gradient that flows through it. Inherits the font, so wrap a word
 * in a headline or use `asChild` on the heading itself. Holds still with reduced motion.
 */
function GradientText({
  asChild,
  colors,
  speed,
  animate = true,
  angle,
  className,
  style,
  ...props
}: GradientTextProps) {
  const Comp = asChild ? Slot.Root : 'span'
  return (
    <Comp
      data-slot="gradient-text"
      data-animate={animate || undefined}
      className={cn(
        // The padding lets the fill reach descenders on tight line heights; the margin gives
        // the space back so the line does not grow.
        '-my-[0.1em] inline-block bg-clip-text py-[0.1em] text-transparent',
        animate && flowClasses,
        className,
      )}
      style={{ ...flowingStyle({ colors, speed, angle }), ...style }}
      {...props}
    />
  )
}

export interface GradientBorderProps extends React.ComponentProps<'div'>, FlowingProps {
  /** Border width, any CSS length. Default 1px. */
  width?: string
}

/**
 * A box with the same flowing gradient as its border. The corners follow the box's own
 * `rounded-*` class, and the content keeps its background.
 */
function GradientBorder({
  colors,
  speed,
  animate = true,
  angle,
  width = '1px',
  className,
  style,
  children,
  ...props
}: GradientBorderProps) {
  return (
    <div
      data-slot="gradient-border"
      className={cn('relative', className)}
      style={{ '--gradient-border-width': width, ...style } as React.CSSProperties}
      {...props}
    >
      <span
        aria-hidden
        data-slot="gradient-border-ring"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit] p-(--gradient-border-width)',
          animate && flowClasses,
        )}
        style={{
          ...flowingStyle({ colors, speed, angle }),
          // Only the padding shows: the content box is cut out of the full box.
          mask: 'linear-gradient(#000, #000) content-box exclude, linear-gradient(#000, #000)',
        }}
      />
      {children}
    </div>
  )
}

export { GradientBorder, GradientText }
