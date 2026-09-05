'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface FlipWordsProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  words: string[]
  /** Milliseconds each word stays. Default 2500. */
  interval?: number
  /** Milliseconds the swap takes. Default 500. */
  duration?: number
  /** Animate letter by letter instead of the whole word. Default true. */
  byLetter?: boolean
}

/**
 * One word from the list at a time, each one blurring out as the next blurs in.
 * The width follows the current word.
 */
function FlipWords({
  words,
  interval = 2500,
  duration = 500,
  byLetter = true,
  className,
  ...props
}: FlipWordsProps) {
  const reduced = useReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  const word = words[index % words.length] ?? ''

  React.useEffect(() => {
    if (reduced || words.length < 2) return
    const timer = setTimeout(() => {
      setLeaving(word)
      setIndex((i) => (i + 1) % words.length)
    }, interval)
    return () => clearTimeout(timer)
  }, [word, words.length, interval, reduced])

  React.useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLeaving(null), duration)
    return () => clearTimeout(timer)
  }, [leaving, duration])

  const letters = byLetter ? Array.from(word) : [word]
  const step = byLetter ? Math.min(40, duration / Math.max(letters.length, 1)) : 0

  return (
    <span
      data-slot="flip-words"
      className={cn('relative inline-block whitespace-nowrap align-baseline', className)}
      aria-live="polite"
      {...props}
    >
      {leaving && !reduced && (
        <span
          key={`out-${leaving}-${index}`}
          aria-hidden
          data-slot="flip-word-out"
          className="absolute inset-0 inline-block"
          style={{ animation: `flip-out ${duration}ms ease-in forwards` }}
        >
          {leaving}
        </span>
      )}
      <span key={`${word}-${index}`} data-slot="flip-word" className="inline-block">
        {letters.map((letter, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional
            key={i}
            className="inline-block motion-reduce:animate-none"
            style={
              reduced
                ? undefined
                : { animation: `flip-in ${duration}ms ease-out ${i * step}ms both` }
            }
          >
            {letter === ' ' ? ' ' : letter}
          </span>
        ))}
      </span>
    </span>
  )
}

export { FlipWords }
