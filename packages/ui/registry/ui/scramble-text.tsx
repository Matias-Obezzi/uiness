'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export type ScrambleTrigger = 'mount' | 'view' | 'hover'

export interface ScrambleTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The text it resolves into. */
  text: string
  /**
   * When it plays. `mount` right away, `view` when it scrolls into view, `hover` each time
   * the pointer enters or focus lands on it or on the link or button around it. Default `view`.
   */
  trigger?: ScrambleTrigger
  /** Milliseconds from the first scrambled frame to the final text. Default 900. */
  duration?: number
  /** Milliseconds between glyph changes. Default 40. */
  speed?: number
  /** Glyphs to pick from while scrambling. */
  characters?: string
  /** Milliseconds before it starts. Default 0. */
  delay?: number
  /** Called when the text has resolved. */
  onComplete?: () => void
}

const defaultCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}=+*^?#'

const randomOf = (glyphs: string[]) => glyphs[Math.floor(Math.random() * glyphs.length)] ?? ''

/**
 * Text that decodes itself: characters cycle through random glyphs and settle, left to
 * right, into the real text. Each character keeps the width of its final glyph, so the line
 * never jumps. Screen readers get the real text, and reduced motion shows it straight away.
 */
function ScrambleText({
  text,
  trigger = 'view',
  duration = 900,
  speed = 40,
  characters = defaultCharacters,
  delay = 0,
  onComplete,
  className,
  ...props
}: ScrambleTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduced = useReducedMotion()
  // The first render shows the real text, so the server and the client agree.
  const [shown, setShown] = React.useState(text)
  const [run, setRun] = React.useState(0)
  const running = React.useRef(false)
  const doneRef = React.useRef(onComplete)
  doneRef.current = onComplete

  const armed = trigger === 'mount' || (trigger === 'view' && inView)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new text plays again
  React.useEffect(() => {
    if (armed) setRun((r) => r + 1)
  }, [armed, text])

  React.useEffect(() => {
    const el = ref.current
    if (trigger !== 'hover' || !el) return
    // Hovering anywhere on the link is what people do, not hovering the letters themselves.
    const target = el.closest<HTMLElement>('a, button, [role=button], [role=link]') ?? el
    const play = () => {
      if (!running.current) setRun((r) => r + 1)
    }
    target.addEventListener('pointerenter', play)
    target.addEventListener('focus', play)
    return () => {
      target.removeEventListener('pointerenter', play)
      target.removeEventListener('focus', play)
    }
  }, [trigger])

  React.useEffect(() => {
    if (run === 0) return
    if (reduced) {
      setShown(text)
      doneRef.current?.()
      return
    }
    const chars = Array.from(text)
    const glyphs = Array.from(characters)
    const steps = Math.max(1, Math.round(duration / speed))
    let step = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const tick = () => {
      if (step >= steps) {
        clearInterval(interval)
        running.current = false
        setShown(text)
        doneRef.current?.()
        return
      }
      // Everything left of the edge is settled, everything right of it keeps cycling.
      const edge = Math.floor((step / steps) * chars.length)
      setShown(chars.map((c, i) => (i < edge || !c.trim() ? c : randomOf(glyphs))).join(''))
      step++
    }
    running.current = true
    const timer = setTimeout(() => {
      tick()
      interval = setInterval(tick, speed)
    }, delay)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      running.current = false
    }
  }, [run, reduced, text, characters, duration, speed, delay])

  const finalChars = Array.from(text)
  const shownChars = Array.from(shown)
  const scrambling = shown !== text

  // Words are kept whole so the line can only wrap between them.
  const words: React.ReactNode[] = []
  let index = 0
  for (const [w, word] of text.split(/(\s+)/).entries()) {
    if (!word) continue
    if (!word.trim()) {
      words.push(word)
      index += Array.from(word).length
      continue
    }
    const cells = Array.from(word).map((c, i) => {
      const at = index + i
      const glyph = shownChars[at] ?? c
      return (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: characters are positional
          key={i}
          data-scrambled={glyph !== finalChars[at] || undefined}
          className="inline-grid justify-items-center"
        >
          <span className="invisible [grid-area:1/1]">{c}</span>
          <span className="[grid-area:1/1]">{glyph}</span>
        </span>
      )
    })
    index += Array.from(word).length
    words.push(
      <span key={w} className="inline-block whitespace-nowrap">
        {cells}
      </span>,
    )
  }

  return (
    <span
      ref={ref}
      data-slot="scramble-text"
      data-state={scrambling ? 'scrambling' : 'idle'}
      className={className}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden data-slot="scramble-text-glyphs">
        {words}
      </span>
    </span>
  )
}

export { ScrambleText }
