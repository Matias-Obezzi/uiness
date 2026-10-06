'use client'

import * as React from 'react'
import { useMotionReady } from '@/hooks/use-motion-ready'
import { cn } from '@/lib/utils'

export interface TypewriterProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** One or more strings. With several, each is typed, held, deleted, then the next one. */
  words: string | string[]
  /** Milliseconds per typed character. Default 70. */
  typeSpeed?: number
  /** Milliseconds per deleted character. Default 40. */
  deleteSpeed?: number
  /** Milliseconds a word stays before it is deleted. Default 1800. */
  pause?: number
  /** Go around again after the last word. Default true. */
  loop?: boolean
  /** Show the blinking cursor. Default true. */
  cursor?: boolean
  /** Milliseconds before typing starts. Default 0. */
  delay?: number
  /** Called each time a word is fully typed. */
  onWordTyped?: (word: string, index: number) => void
}

type Phase = 'typing' | 'deleting'

/**
 * Types text one character at a time, deletes it and moves on to the next word. Screen
 * readers get the current word in full, not the keystrokes.
 *
 * The server renders the first word in full, so it is in the HTML for crawlers and for anyone
 * without JavaScript. On the client it clears and types from the start before the first paint,
 * unless the server HTML was already on screen: then it holds that word and carries on.
 */
function Typewriter({
  words,
  typeSpeed = 70,
  deleteSpeed = 40,
  pause = 1800,
  loop = true,
  cursor = true,
  delay = 0,
  onWordTyped,
  className,
  ...props
}: TypewriterProps) {
  const list = React.useMemo(() => (Array.isArray(words) ? words : [words]), [words])
  const ref = React.useRef<HTMLSpanElement>(null)
  const ready = useMotionReady(ref)
  const still = ready === 'idle'
  const [index, setIndex] = React.useState(0)
  // The first word starts out typed in full: that is what the server sends.
  const [length, setLength] = React.useState(() => list[0]?.length ?? 0)
  const [phase, setPhase] = React.useState<Phase>('typing')
  const [started, setStarted] = React.useState(delay === 0)
  const [cleared, setCleared] = React.useState(false)
  const typedRef = React.useRef(onWordTyped)
  React.useLayoutEffect(() => {
    typedRef.current = onWordTyped
  })

  // A word deleted to the end gives way to the next one straight away, adjusted during render.
  if (started && !still && phase === 'deleting' && length === 0) {
    setIndex((i) => (i + 1) % list.length)
    setPhase('typing')
  }

  // Armed, it starts from nothing. Done during render so no effect sees the full word first.
  if (ready === 'armed' && !cleared) {
    setCleared(true)
    setLength(0)
  }

  const word = list[index % list.length] ?? ''
  const last = index === list.length - 1

  React.useEffect(() => {
    if (started) return
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [started, delay])

  React.useEffect(() => {
    if (!started || still) return
    let timer: ReturnType<typeof setTimeout>
    if (phase === 'typing') {
      if (length < word.length) {
        timer = setTimeout(() => setLength((l) => l + 1), typeSpeed)
      } else {
        typedRef.current?.(word, index)
        if (list.length === 1 || (last && !loop)) return
        timer = setTimeout(() => setPhase('deleting'), pause)
      }
    } else if (phase === 'deleting' && length > 0) {
      timer = setTimeout(() => setLength((l) => l - 1), deleteSpeed)
    }
    return () => clearTimeout(timer)
  }, [
    started,
    still,
    phase,
    length,
    word,
    index,
    last,
    list.length,
    loop,
    typeSpeed,
    deleteSpeed,
    pause,
  ])

  const shown = still ? word : word.slice(0, length)
  // The cursor blinks while the word is held, and stays solid while characters move.
  const idle = still || (phase === 'typing' && length >= word.length)

  return (
    <span
      ref={ref}
      data-slot="typewriter"
      className={cn('inline-flex items-baseline', className)}
      {...props}
    >
      <span className="sr-only">{word}</span>
      <span aria-hidden data-slot="typewriter-text">
        {shown}
      </span>
      {cursor && (
        <span
          aria-hidden
          data-slot="typewriter-cursor"
          className={cn(
            'ml-px inline-block h-[1em] w-[2px] translate-y-[0.1em] bg-current',
            idle && 'animate-[blink_1s_steps(2)_infinite]',
          )}
        />
      )}
    </span>
  )
}

export { Typewriter }
