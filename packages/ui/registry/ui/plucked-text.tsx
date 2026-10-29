'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/** Points along the string. */
const NODES = 48
const TENSION = 0.35
const DAMP = 0.992

/** One step of the string: the wave equation on a line fixed at both ends, slowly damped. */
export function stringStep(y: Float32Array, v: Float32Array) {
  for (let i = 1; i < y.length - 1; i++)
    v[i] = ((v[i] ?? 0) + ((y[i - 1] ?? 0) + (y[i + 1] ?? 0) - 2 * (y[i] ?? 0)) * TENSION) * DAMP
  for (let i = 1; i < y.length - 1; i++) y[i] = (y[i] ?? 0) + (v[i] ?? 0)
}

export interface PluckedTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** The words, sitting on the string. */
  text: string
}

/**
 * A headline sitting on a string. Sweep the pointer across the string to strum it, or press on
 * it to pluck: the string rings, the letters riding its waves, and slowly comes to rest. The
 * text reads as plain words to screen readers; with reduced motion it stays still.
 */
function PluckedText({ text, className, ...props }: PluckedTextProps) {
  const reduced = useReducedMotion()
  const box = React.useRef<HTMLSpanElement>(null)
  const path = React.useRef<SVGPathElement>(null)
  const letters = React.useRef<(HTMLSpanElement | null)[]>([])
  const wave = React.useRef({ y: new Float32Array(NODES), v: new Float32Array(NODES) })
  const frame = React.useRef(0)
  const last = React.useRef<number | null>(null)
  const chars = [...text]

  const draw = () => {
    const el = box.current
    if (!el) return
    const { y } = wave.current
    const w = el.offsetWidth
    const h = el.offsetHeight
    const base = h - 4
    const at = (x: number) => {
      const f = (x / w) * (NODES - 1)
      const i = Math.floor(f)
      return (y[i] ?? 0) + ((y[i + 1] ?? 0) - (y[i] ?? 0)) * (f - i)
    }
    path.current?.setAttribute(
      'd',
      `M0 ${base} ${Array.from(y, (v, i) => `L${((i / (NODES - 1)) * w).toFixed(1)} ${(base + v).toFixed(1)}`).join(' ')}`,
    )
    for (const letter of letters.current) {
      if (!letter) continue
      const x = letter.offsetLeft + letter.offsetWidth / 2
      const slope = at(x + 4) - at(x - 4)
      letter.style.transform = `translateY(${at(x).toFixed(1)}px) rotate(${(slope * 4).toFixed(1)}deg)`
    }
  }
  const run = () => {
    if (frame.current || reduced) return
    const tick = () => {
      stringStep(wave.current.y, wave.current.v)
      draw()
      const ringing = wave.current.y.some((v) => Math.abs(v) > 0.05)
      frame.current = ringing ? requestAnimationFrame(tick) : 0
    }
    frame.current = requestAnimationFrame(tick)
  }
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])
  React.useLayoutEffect(() => draw())

  const nodeAt = (event: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return null
    return {
      i: Math.round(((event.clientX - r.left) / r.width) * (NODES - 1)),
      y: event.clientY - r.top,
      h: r.height,
    }
  }
  const pluck = (i: number, amount: number) => {
    if (i <= 0 || i >= NODES - 1) return
    for (let k = -3; k <= 3; k++) {
      const j = i + k
      if (j > 0 && j < NODES - 1)
        wave.current.y[j] = (wave.current.y[j] ?? 0) + amount * (1 - Math.abs(k) / 4)
    }
    run()
  }

  return (
    <span
      ref={box}
      data-slot="plucked-text"
      className={cn('relative inline-block pb-3', className)}
      onPointerMove={(event) => {
        const n = nodeAt(event)
        if (!n) return
        // Crossing the string's line strums it, in the direction of the crossing.
        const line = n.h - 4
        if (last.current !== null && last.current < line !== n.y < line)
          pluck(n.i, (n.y - last.current) * 0.6)
        last.current = n.y
      }}
      onPointerLeave={() => {
        last.current = null
      }}
      onPointerDown={(event) => {
        const n = nodeAt(event)
        if (n) pluck(n.i, 14)
      }}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative inline-flex">
        {chars.map((char, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional
            key={i}
            ref={(el) => {
              letters.current[i] = el
            }}
            className="inline-block whitespace-pre"
            style={{ transformOrigin: '50% 100%' }}
          >
            {char}
          </span>
        ))}
      </span>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <path
          ref={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-50"
        />
      </svg>
    </span>
  )
}

export { PluckedText }
