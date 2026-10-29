'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

type Body = { x: number; y: number; vx: number; vy: number; r: number }

const GRAVITY = 0.45
const BOUNCE = 0.35
const SHAPES = ['circle', 'square', 'pill', 'triangle'] as const

/** Moves bodies one step: gravity, walls and floor, then pushes overlapping ones apart. */
export function stepBodies(bodies: Body[], width: number, height: number, held: number | null) {
  for (const [i, b] of bodies.entries()) {
    if (i === held) continue
    b.vy += GRAVITY
    b.vx *= 0.995
    b.x += b.vx
    b.y += b.vy
    if (b.y + b.r > height) {
      b.y = height - b.r
      b.vy *= -BOUNCE
      b.vx *= 0.9
    }
    if (b.x - b.r < 0) {
      b.x = b.r
      b.vx *= -BOUNCE
    }
    if (b.x + b.r > width) {
      b.x = width - b.r
      b.vx *= -BOUNCE
    }
  }
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < bodies.length; i++)
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i] as Body
        const b = bodies[j] as Body
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 0.01
        const overlap = a.r + b.r - d
        if (overlap <= 0) continue
        // The one held stays where the pointer has it; the other gives way.
        const share = i === held ? [0, 1] : j === held ? [1, 0] : [0.5, 0.5]
        a.x -= (dx / d) * overlap * (share[0] as number)
        a.y -= (dy / d) * overlap * (share[0] as number)
        b.x += (dx / d) * overlap * (share[1] as number)
        b.y += (dy / d) * overlap * (share[1] as number)
      }
}

export interface ShapeHeroProps extends React.ComponentProps<'section'> {
  /** How many shapes drop in. Default 18. */
  count?: number
}

/**
 * A landing hero where shapes drop in from above and pile up at the bottom, under the headline.
 * Grab one and throw it; the pile shifts to make room. With reduced motion they are simply
 * there, already settled.
 */
function ShapeHero({ count = 18, className, children, ...props }: ShapeHeroProps) {
  const reduced = useReducedMotion()
  const box = React.useRef<HTMLElement>(null)
  const shapes = React.useRef<(HTMLSpanElement | null)[]>([])
  const bodies = React.useRef<Body[]>([])
  const held = React.useRef<{
    index: number
    pointer: number
    dx: number
    dy: number
    samples: [number, number, number][]
  } | null>(null)

  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    bodies.current = Array.from({ length: count }, (_, i) => {
      const r = 18 + ((i * 37) % 5) * 7
      return { x: r + ((i * 97) % Math.max(1, width - 2 * r)), y: -60 - i * 45, vx: 0, vy: 0, r }
    })
    const paint = () => {
      bodies.current.forEach((b, i) => {
        const s = shapes.current[i]
        if (s)
          s.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${(b.x * 0.6) % 360}deg)`
      })
    }
    if (reduced) {
      for (let i = 0; i < 600; i++) stepBodies(bodies.current, width, height, null)
      paint()
      return
    }
    let frame = 0
    const tick = () => {
      const { width: w, height: h } = el.getBoundingClientRect()
      stepBodies(bodies.current, w, h, held.current?.index ?? null)
      paint()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [count, reduced])

  const local = (event: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect()
    return { x: event.clientX - (r?.left ?? 0), y: event.clientY - (r?.top ?? 0) }
  }

  return (
    <section
      ref={box}
      data-slot="shape-hero"
      className={cn('relative isolate overflow-hidden', className)}
      onPointerMove={(event) => {
        const h = held.current
        const b = h && bodies.current[h.index]
        if (!h || !b || h.pointer !== event.pointerId) return
        const p = local(event)
        b.x = p.x - h.dx
        b.y = p.y - h.dy
        h.samples.push([event.timeStamp, b.x, b.y])
        if (h.samples.length > 5) h.samples.shift()
      }}
      onPointerUp={(event) => {
        const h = held.current
        const b = h && bodies.current[h.index]
        held.current = null
        if (!h || !b) return
        // Thrown at the speed it was moving as it was let go.
        const first = h.samples[0] as [number, number, number]
        const ms = Math.max(16, event.timeStamp - first[0])
        b.vx = ((b.x - first[1]) / ms) * 16
        b.vy = ((b.y - first[2]) / ms) * 16
      }}
      {...props}
    >
      {children}
      {Array.from({ length: count }, (_, i) => {
        const kind = SHAPES[i % SHAPES.length]
        const r = 18 + ((i * 37) % 5) * 7
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: shape n is always the same
            key={i}
            ref={(el) => {
              shapes.current[i] = el
            }}
            aria-hidden="true"
            onPointerDown={(event) => {
              const b = bodies.current[i]
              if (!b || reduced) return
              event.currentTarget.parentElement?.setPointerCapture?.(event.pointerId)
              const p = local(event)
              held.current = {
                index: i,
                pointer: event.pointerId,
                dx: p.x - b.x,
                dy: p.y - b.y,
                samples: [[event.timeStamp, b.x, b.y]],
              }
              b.vx = 0
              b.vy = 0
            }}
            className={cn(
              'absolute top-0 left-0 cursor-grab touch-none will-change-transform active:cursor-grabbing',
              kind === 'circle' && 'rounded-full',
              kind === 'square' && 'rounded-xl',
              kind === 'pill' && 'rounded-full',
              kind === 'triangle' && '[clip-path:polygon(50%_6%,96%_90%,4%_90%)]',
            )}
            style={{
              width: kind === 'pill' ? r * 2 : r * 2 * 0.9,
              height: kind === 'pill' ? r * 1.1 : r * 2 * 0.9,
              background: `var(--chart-${(i % 5) + 1})`,
              transform: 'translate(-200px, -200px)',
            }}
          />
        )
      })}
    </section>
  )
}

export { ShapeHero }
