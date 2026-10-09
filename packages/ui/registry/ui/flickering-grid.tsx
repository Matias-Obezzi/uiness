'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface FlickeringGridProps extends React.ComponentProps<'canvas'> {
  /** Side of each square, in pixels. Default 4. */
  squareSize?: number
  /** Space between squares, in pixels. Default 6. */
  gap?: number
  /** How often a square changes, per second, 0 to 1. Default 0.3. */
  flickerChance?: number
  /** Opacity of the brightest square, 0 to 1. Default 0.3. */
  maxOpacity?: number
  /** Any CSS color. Default the foreground color. */
  color?: string
}

/**
 * A background of small squares flickering on and off, drawn on a canvas. Stops drawing
 * off screen and in background tabs, and holds one still frame with reduced motion.
 */
function FlickeringGrid({
  squareSize = 4,
  gap = 6,
  flickerChance = 0.3,
  maxOpacity = 0.3,
  color = 'var(--foreground)',
  className,
  style,
  ...props
}: FlickeringGridProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !inView) return
    const step = squareSize + gap
    let cols = 0
    let rows = 0
    let cells = new Float32Array(0)
    let frame = 0
    let last = performance.now()

    const size = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(width / step)
      rows = Math.ceil(height / step)
      cells = Float32Array.from({ length: cols * rows }, () => Math.random() * maxOpacity)
    }

    const paint = () => {
      ctx.clearRect(0, 0, cols * step, rows * step)
      ctx.fillStyle = getComputedStyle(canvas).color
      for (let i = 0; i < cells.length; i++) {
        ctx.globalAlpha = cells[i] ?? 0
        ctx.fillRect((i % cols) * step, Math.floor(i / cols) * step, squareSize, squareSize)
      }
      ctx.globalAlpha = 1
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (document.visibilityState === 'hidden') return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const chance = flickerChance * dt
      for (let i = 0; i < cells.length; i++) {
        if (Math.random() < chance) cells[i] = Math.random() * maxOpacity
      }
      paint()
    }

    size()
    paint()
    if (!reduced) frame = requestAnimationFrame(tick)
    const resize = new ResizeObserver(() => {
      size()
      paint()
    })
    resize.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [inView, reduced, squareSize, gap, flickerChance, maxOpacity])

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="flickering-grid"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      style={{ color, ...style }}
      {...props}
    />
  )
}

export { FlickeringGrid }
