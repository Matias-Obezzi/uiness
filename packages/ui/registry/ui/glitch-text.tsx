'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export type GlitchTrigger = 'idle' | 'hover' | 'change'

/** Keyframes of hard-cut horizontal bands, each shifted sideways. */
function bands(count: number): Keyframe[] {
  return Array.from({ length: count }, () => {
    const top = Math.random() * 90
    const height = 4 + Math.random() * 18
    return {
      clipPath: `inset(${top.toFixed(1)}% 0 ${Math.max(0, 100 - top - height).toFixed(1)}% 0)`,
      translate: `${((Math.random() - 0.5) * 14).toFixed(1)}px 0`,
    }
  })
}

export interface GlitchTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  text: string
  /** When it glitches: every few seconds on its own, on hover, or when the text changes. Default `hover`. */
  trigger?: GlitchTrigger
}

/**
 * Flat text that cuts into hard-shifted bands, with a thin red and cyan split, for a fraction of
 * a second: on its own every few seconds, on hover, or when the text changes. Screen readers get
 * the text once; with reduced motion it never glitches.
 */
function GlitchText({
  text,
  trigger = 'hover',
  className,
  onPointerEnter,
  ...props
}: GlitchTextProps) {
  const reduced = useReducedMotion()
  const red = React.useRef<HTMLSpanElement>(null)
  const cyan = React.useRef<HTMLSpanElement>(null)

  const glitch = React.useCallback(() => {
    if (reduced) return
    const opts = { duration: 380, easing: 'steps(6, end)' }
    red.current?.animate?.([{ opacity: 1 }, ...bands(6), { opacity: 0 }], opts)
    cyan.current?.animate?.([{ opacity: 1 }, ...bands(6), { opacity: 0 }], { ...opts, delay: 30 })
  }, [reduced])

  React.useEffect(() => {
    if (trigger !== 'idle' || reduced) return
    let timer = 0
    const next = () => {
      timer = window.setTimeout(
        () => {
          glitch()
          next()
        },
        2500 + Math.random() * 3500,
      )
    }
    next()
    return () => window.clearTimeout(timer)
  }, [trigger, reduced, glitch])

  const first = React.useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new text is what sets it off
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (trigger === 'change') glitch()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new text is what sets it off
  }, [text])

  return (
    <span
      data-slot="glitch-text"
      className={cn('relative inline-block', className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (trigger === 'hover') glitch()
      }}
      {...props}
    >
      {text}
      <span
        ref={red}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-[#ff2d55] opacity-0 mix-blend-screen"
        style={{ left: -2 }}
      >
        {text}
      </span>
      <span
        ref={cyan}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-[#00e5ff] opacity-0 mix-blend-screen"
        style={{ left: 2 }}
      >
        {text}
      </span>
    </span>
  )
}

export { GlitchText }
