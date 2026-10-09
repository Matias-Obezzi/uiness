'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface FlipClockProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** What it shows: a time, a count, a code. Each character gets its own flap. */
  value: string | number
  /** Milliseconds for a flap to fall. Default 600. */
  duration?: number
  /** Characters that sit between flaps instead of in one, like the colon of a time. */
  separators?: string
}

/** One half of a character: the top shows its upper half, the bottom its lower one. */
function Half({
  char,
  half,
  className,
}: {
  char: string
  half: 'top' | 'bottom'
  className?: string
}) {
  return (
    <span
      className={cn(
        'absolute inset-x-0 h-1/2 overflow-hidden bg-card [backface-visibility:hidden]',
        half === 'top' ? 'top-0 rounded-t-[inherit]' : 'bottom-0 rounded-b-[inherit]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute inset-x-0 flex h-[200%] items-center justify-center',
          half === 'top' ? 'top-0' : 'bottom-0',
        )}
      >
        {char}
      </span>
    </span>
  )
}

function Flap({ char, duration, still }: { char: string; duration: number; still: boolean }) {
  const [shown, setShown] = React.useState({ now: char, before: char, turn: 0 })
  if (shown.now !== char) setShown({ now: char, before: shown.now, turn: shown.turn + 1 })
  const { now, before, turn } = shown
  const flipping = turn > 0 && !still

  return (
    <span
      className="relative inline-block h-[1.4em] w-[0.9em] rounded-[0.12em] text-card-foreground shadow-sm [perspective:4em]"
      style={{ '--flip-duration': `${duration}ms` } as React.CSSProperties}
    >
      {/* Behind: the new top half, and the old bottom half until the flap covers it. */}
      <Half char={now} half="top" />
      <Half char={flipping ? before : now} half="bottom" />
      {flipping && (
        <React.Fragment key={turn}>
          <Half
            char={before}
            half="top"
            className="z-10 origin-bottom animate-[flip-clock-top_calc(var(--flip-duration)/2)_ease-in_both]"
          />
          <Half
            char={now}
            half="bottom"
            className="z-10 origin-top animate-[flip-clock-bottom_calc(var(--flip-duration)/2)_ease-out_calc(var(--flip-duration)/2)_both]"
          />
        </React.Fragment>
      )}
      {/* The hinge. */}
      <span className="absolute inset-x-0 top-1/2 z-20 h-px -translate-y-1/2 bg-background/70" />
    </span>
  )
}

/**
 * A split-flap display, like an old airport board: when a character changes, its top half
 * falls to show the new one. Give it a time, a countdown or any short text. Screen readers
 * read the value, not the flaps; with reduced motion characters change in place.
 */
function FlipClock({
  value,
  duration = 600,
  separators = ':.,/ -',
  className,
  ...props
}: FlipClockProps) {
  const text = String(value)
  const still = useReducedMotion()
  return (
    // A span, so it can sit inside a sentence: "Next minute in 42".
    <span
      data-slot="flip-clock"
      className={cn(
        'inline-flex items-center gap-[0.08em] font-bold font-mono text-4xl tabular-nums leading-none',
        className,
      )}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-[0.08em]">
        {Array.from(text).map((char, i) =>
          separators.includes(char) ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: each place keeps its flap as the value changes
            <span key={i} className="px-[0.05em] text-muted-foreground">
              {char}
            </span>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: each place keeps its flap as the value changes
            <Flap key={i} char={char} duration={duration} still={still} />
          ),
        )}
      </span>
    </span>
  )
}

export { FlipClock }
