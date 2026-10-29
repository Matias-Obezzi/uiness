'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/** Gravity's pull back to rest, and how much swing is lost each frame. */
const PULL = 0.0035
const DAMP = 0.996
/** Degrees per radian, for the transforms. */
const DEG = 180 / Math.PI

/**
 * One step of a Newton's cradle of letters: each swings back toward rest, and two neighbours
 * that meet trade their swings, so a knock at one end comes out at the other.
 */
export function swingStep(angle: number[], speed: number[]) {
  for (let i = 0; i < angle.length; i++) {
    speed[i] = ((speed[i] ?? 0) - Math.sin(angle[i] ?? 0) * PULL) * DAMP
    angle[i] = (angle[i] ?? 0) + (speed[i] ?? 0)
  }
  for (let i = 0; i < angle.length - 1; i++) {
    // Letter i swinging right into letter i + 1, or i + 1 back into i.
    if ((angle[i] ?? 0) > (angle[i + 1] ?? 0) && (speed[i] ?? 0) > (speed[i + 1] ?? 0)) {
      const s = speed[i] as number
      speed[i] = speed[i + 1] as number
      speed[i + 1] = s
      angle[i] = angle[i + 1] as number
    }
  }
}

export interface CradleTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The words, hung letter by letter. */
  text: string
}

/**
 * A headline hung like a Newton's cradle: every letter swings from a thread, and a knock on one,
 * by brushing past it or a tap, clacks through the word and out at the far end. The text reads
 * as plain words to screen readers; with reduced motion it hangs still.
 */
function CradleText({ text, className, ...props }: CradleTextProps) {
  const reduced = useReducedMotion()
  const letters = React.useRef<(HTMLSpanElement | null)[]>([])
  const state = React.useRef({ angle: [] as number[], speed: [] as number[] })
  const frame = React.useRef(0)
  const chars = [...text]

  const run = React.useCallback(() => {
    if (frame.current) return
    const tick = () => {
      const { angle, speed } = state.current
      swingStep(angle, speed)
      letters.current.forEach((el, i) => {
        if (el) el.style.transform = `rotate(${((angle[i] ?? 0) * DEG).toFixed(2)}deg)`
      })
      const moving =
        speed.some((s) => Math.abs(s) > 0.0004) || angle.some((a) => Math.abs(a) > 0.002)
      frame.current = moving ? requestAnimationFrame(tick) : 0
    }
    frame.current = requestAnimationFrame(tick)
  }, [])
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])
  // A new length of text, a new row of letters at rest.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the count of letters matters
  React.useEffect(() => {
    state.current = { angle: chars.map(() => 0), speed: chars.map(() => 0) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the count of letters matters
  }, [chars.length])

  const knock = (i: number, push: number) => {
    if (reduced) return
    const { speed } = state.current
    speed[i] = (speed[i] ?? 0) + Math.max(-0.08, Math.min(0.08, push))
    run()
  }

  return (
    <span data-slot="cradle-text" className={cn('inline-block', className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative inline-flex items-start pt-[0.6em]">
        {/* The bar the letters hang from. */}
        <span className="absolute inset-x-0 top-0 h-px bg-current opacity-30" />
        {chars.map((char, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional
            key={i}
            ref={(el) => {
              letters.current[i] = el
            }}
            onPointerEnter={(event) => knock(i, event.movementX * 0.006)}
            onPointerDown={() => knock(i, i < chars.length / 2 ? -0.06 : 0.06)}
            className="relative inline-block cursor-pointer whitespace-pre"
            style={{ transformOrigin: '50% -0.6em' }}
          >
            {/* Its thread. */}
            <span className="absolute -top-[0.6em] left-1/2 h-[0.6em] w-px bg-current opacity-30" />
            {char}
          </span>
        ))}
      </span>
    </span>
  )
}

export { CradleText }
