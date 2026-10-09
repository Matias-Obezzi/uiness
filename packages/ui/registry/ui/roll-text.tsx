'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface RollTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  text: string
  /** Milliseconds between one letter and the next. Default 25. */
  stagger?: number
  /** Milliseconds each letter takes to roll. Default 350. */
  duration?: number
}

/**
 * Text whose letters roll up on hover, each one replaced by its copy from below, one after
 * another. It rolls when the text itself is hovered, and when a link or button around it is
 * hovered or focused, so it can be a button's label. Screen readers read the text once.
 */
function RollText({ text, stagger = 25, duration = 350, className, ...props }: RollTextProps) {
  const letters = Array.from(text)
  return (
    <span data-slot="roll-text" className={cn('group/roll inline-flex', className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex whitespace-pre">
        {letters.map((letter, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: letters repeat; their place is their identity
            key={i}
            className="relative inline-block overflow-hidden"
          >
            <span
              className="inline-block transition-transform ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-safe:group-hover/roll:-translate-y-full motion-safe:[:is(a,button):is(:hover,:focus-visible)_&]:-translate-y-full"
              style={{ transitionDuration: `${duration}ms`, transitionDelay: `${i * stagger}ms` }}
            >
              {letter}
              <span className="absolute top-full left-0">{letter}</span>
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}

export { RollText }
