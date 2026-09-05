'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface SparklesProps extends React.ComponentProps<'canvas'> {
  /** Particles per 10,000 square pixels. Default 1.2. */
  density?: number
  /** Any CSS color. Default the foreground color. */
  color?: string
  /** Smallest and largest radius in pixels. Default [0.6, 1.8]. */
  size?: [number, number]
  /** Twinkle speed multiplier. Default 1. */
  speed?: number
  /** Slow drift in pixels per second. Default 6. */
  drift?: number
}

interface Particle {
  x: number
  y: number
  r: number
  phase: number
  rate: number
  vx: number
  vy: number
}

/**
 * Twinkling particles on a canvas. Absolutely positioned, so give the parent `relative`.
 * Stops drawing while off screen and holds still with `prefers-reduced-motion`.
 */
function Sparkles({
  density = 1.2,
  color = 'var(--foreground)',
  size = [0.6, 1.8],
  speed = 1,
  drift = 6,
  className,
  ...props
}: SparklesProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()
  const [minR, maxR] = size

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas || !inView) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let width = 0
    let height = 0
    let frame = 0
    let last = performance.now()

    const resolvedColor = getComputedStyle(canvas).color

    const seed = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(((width * height) / 10000) * density)
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: minR + Math.random() * (maxR - minR),
        phase: Math.random() * Math.PI * 2,
        rate: (0.6 + Math.random() * 1.4) * speed,
        vx: (Math.random() - 0.5) * drift,
        vy: (Math.random() - 0.5) * drift,
      }))
    }

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = resolvedColor
      for (const p of particles) {
        if (!reduced) {
          p.phase += dt * p.rate * 2
          p.x = (p.x + p.vx * dt + width) % width
          p.y = (p.y + p.vy * dt + height) % height
        }
        const alpha = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(p.phase))
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (!reduced) frame = requestAnimationFrame(draw)
    }

    seed()
    // Paint right away, then follow the frames.
    draw(performance.now())
    const ro = new ResizeObserver(() => {
      seed()
      if (reduced) draw(performance.now())
    })
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [inView, reduced, density, minR, maxR, speed, drift])

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="sparkles"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      style={{ color }}
      {...props}
    />
  )
}

export { Sparkles }
