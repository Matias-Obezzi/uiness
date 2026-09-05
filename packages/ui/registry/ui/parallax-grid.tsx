'use client'

import { useParallax } from '@uiness/scroll'
import * as React from 'react'
import { cn } from '@/lib/utils'

const columnClasses: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
}

const defaultSpeeds = [0.25, -0.15, 0.2, -0.1]

function Column({
  speed,
  className,
  children,
}: {
  speed: number
  className?: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  useParallax(ref, { speed })
  return (
    <div
      ref={ref}
      data-slot="parallax-column"
      className={cn('flex flex-col gap-(--gap) will-change-transform', className)}
    >
      {children}
    </div>
  )
}

export interface ParallaxGridProps extends React.ComponentProps<'div'> {
  /** Number of columns on wide screens. Default 3. */
  columns?: 2 | 3 | 4
  /**
   * How far each column moves over its trip through the viewport, as a fraction of the
   * viewport. Alternating signs by default, so neighbours drift apart.
   */
  speeds?: number[]
  /** Image sources, a shortcut for children. */
  images?: string[]
  /** Space between items, any CSS length. Default 1rem. */
  gap?: string
  /** Classes for every image rendered from `images`. */
  imageClassName?: string
}

/**
 * A grid whose columns scroll at different speeds, so the whole thing shifts as you
 * scroll past it. Pass images or your own children; they are dealt into the columns
 * in order.
 */
function ParallaxGrid({
  columns = 3,
  speeds,
  images,
  gap = '1rem',
  imageClassName,
  className,
  style,
  children,
  ...props
}: ParallaxGridProps) {
  const items = images
    ? images.map((src, i) => (
        <img
          // biome-ignore lint/suspicious/noArrayIndexKey: the same image may appear twice
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className={cn('w-full rounded-xl object-cover', imageClassName)}
        />
      ))
    : React.Children.toArray(children)
  const dealt = Array.from({ length: columns }, (_, c) => items.filter((_, i) => i % columns === c))
  return (
    <div
      data-slot="parallax-grid"
      className={cn('grid items-start gap-(--gap)', columnClasses[columns], className)}
      style={{ '--gap': gap, ...style } as React.CSSProperties}
      {...props}
    >
      {dealt.map((column, c) => (
        <Column
          // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
          key={c}
          speed={speeds?.[c] ?? defaultSpeeds[c % defaultSpeeds.length] ?? 0}
        >
          {column}
        </Column>
      ))}
    </div>
  )
}

export { ParallaxGrid }
