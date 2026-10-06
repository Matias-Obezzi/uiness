'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useMotionReady } from '@/hooks/use-motion-ready'
import { cn } from '@/lib/utils'

export type RevealVariant = 'fade' | 'up' | 'down' | 'left' | 'right' | 'blur' | 'scale'

const hiddenStyles: Record<RevealVariant, string> = {
  fade: 'data-[state=hidden]:opacity-0',
  up: 'data-[state=hidden]:translate-y-6 data-[state=hidden]:opacity-0',
  down: 'data-[state=hidden]:-translate-y-6 data-[state=hidden]:opacity-0',
  left: 'data-[state=hidden]:translate-x-6 data-[state=hidden]:opacity-0',
  right: 'data-[state=hidden]:-translate-x-6 data-[state=hidden]:opacity-0',
  blur: 'data-[state=hidden]:opacity-0 data-[state=hidden]:blur-sm',
  scale: 'data-[state=hidden]:scale-95 data-[state=hidden]:opacity-0',
}

export interface RevealProps extends React.ComponentProps<'div'> {
  variant?: RevealVariant
  /** Milliseconds the transition takes. Default 700. */
  duration?: number
  /** Milliseconds before it starts. Default 0. */
  delay?: number
  /** Milliseconds between each direct child, so a list cascades in. */
  stagger?: number
  /** Play again every time it scrolls into view. Default false. */
  repeat?: boolean
  /** How much of it has to be visible before it plays, 0 to 1. Default 0.2. */
  amount?: number
}

/**
 * Plays a transition when its content scrolls into view. With `stagger` each child
 * follows the previous one; children then need to accept `style` and `data-state`.
 *
 * The server renders the content visible. It is only hidden after mount, with motion allowed,
 * and only if it is not on screen yet (or the page was rendered on the client), so without
 * JavaScript, or with slow JavaScript, nothing stays blank.
 */
function Reveal({
  variant = 'up',
  duration = 700,
  delay = 0,
  stagger,
  repeat = false,
  amount = 0.2,
  className,
  style,
  children,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: !repeat, amount })
  const animate = useMotionReady(ref) === 'armed'
  const state = !animate || inView ? 'visible' : 'hidden'
  // Only on the way in: hiding has to be instant, or the content would fade out after mount.
  const transition: React.CSSProperties = {
    transitionProperty: animate && inView ? 'opacity, transform, filter' : 'none',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'ease-out',
  }

  if (stagger === undefined) {
    return (
      <div
        ref={ref}
        data-slot="reveal"
        data-state={state}
        data-animate={animate || undefined}
        className={cn(
          'motion-reduce:transition-none motion-reduce:data-[state=hidden]:transform-none motion-reduce:data-[state=hidden]:opacity-100 motion-reduce:data-[state=hidden]:blur-none',
          hiddenStyles[variant],
          className,
        )}
        style={{ ...transition, transitionDelay: `${delay}ms`, ...style }}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      data-slot="reveal"
      data-state={state}
      data-animate={animate || undefined}
      className={className}
      style={style}
      {...props}
    >
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement<{ className?: string; style?: React.CSSProperties }>(child))
          return child
        return React.cloneElement(child, {
          'data-state': state,
          className: cn(
            child.props.className,
            'motion-reduce:transition-none motion-reduce:data-[state=hidden]:transform-none motion-reduce:data-[state=hidden]:opacity-100 motion-reduce:data-[state=hidden]:blur-none',
            hiddenStyles[variant],
          ),
          style: {
            ...child.props.style,
            ...transition,
            transitionDelay: `${delay + i * stagger}ms`,
          },
        } as Record<string, unknown>)
      })}
    </div>
  )
}

export { Reveal }
