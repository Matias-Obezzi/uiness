'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface RetroGridProps extends React.ComponentProps<'div'> {
  /** Tilt of the floor in degrees, 0 is flat facing you, 90 is edge on. Default 65. */
  angle?: number
  /** Size of one square in pixels. Default 60. */
  cellSize?: number
  /** Squares per second rolling towards you. 0 stands still. Default 1. */
  speed?: number
  /** Any CSS color. Default the foreground color, faded. */
  lineColor?: string
  /** Distance to the eye in pixels. Lower is more dramatic. Default 500. */
  perspective?: number
}

/**
 * A synthwave floor grid rolling towards you forever, fading out at the horizon.
 * Absolutely positioned, so give the parent `relative` and put the content on top of it.
 * The horizon sits `perspective / tan(angle)` pixels above the bottom edge.
 *
 * Drawn on a canvas with the perspective worked out per line, rather than a tilted CSS
 * background: far lines get thinner than a pixel, and a tilted background shows them one
 * frame and drops them the next, which flickers. Here a line thinner than a pixel is drawn
 * one pixel wide and fainter by as much, so the floor stays calm all the way to the horizon.
 */
function RetroGrid({
  angle = 65,
  cellSize = 60,
  speed = 1,
  lineColor = 'color-mix(in oklab, var(--foreground) 25%, transparent)',
  perspective = 500,
  className,
  style,
  ...props
}: RetroGridProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()
  const rad = (Math.min(Math.max(angle, 1), 89) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  // The floor is four perspectives deep, and `edge` is how high its far end shows up.
  const depth = 4 * perspective
  const edge = (depth * cos * perspective) / (perspective + depth * sin)
  const moving = speed > 0 && !reduced

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas || !inView) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let frame = 0

    const size = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    /** Scale of the floor `d` pixels in from the bottom edge, as seen from the eye. */
    const scale = (d: number) => perspective / (perspective + d * sin)

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height)
      // Read every frame, so the lines follow a switch to dark mode.
      ctx.strokeStyle = getComputedStyle(canvas).color
      ctx.lineWidth = 1
      const cx = width / 2
      const shift = moving ? (((now / 1000) * speed) % 1) * cellSize : 0

      // Across: a line shrinks with the square of the scale as it goes back. Instead of
      // thinner, it is drawn fainter by as much, so it never drops below a pixel and blinks.
      for (let d = cellSize - shift; d <= depth; d += cellSize) {
        const s = scale(d)
        const y = height - d * cos * s
        ctx.globalAlpha = s * s
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Along: straight lines from the bottom edge to the far end, meeting at the horizon.
      const far = scale(depth)
      const farY = height - depth * cos * far
      const reach = Math.ceil(cx / (far * cellSize)) + 1
      ctx.globalAlpha = 1
      ctx.beginPath()
      for (let i = -reach; i <= reach; i++) {
        const x = i * cellSize
        ctx.moveTo(cx + x, height)
        ctx.lineTo(cx + x * far, farY)
      }
      ctx.stroke()

      if (moving) frame = requestAnimationFrame(draw)
    }

    size()
    draw(performance.now())
    const ro = new ResizeObserver(() => {
      size()
      if (!moving) draw(performance.now())
    })
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [inView, moving, speed, cellSize, perspective, cos, sin, depth])

  return (
    <div
      aria-hidden
      data-slot="retro-grid"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={
        {
          '--retro-grid-line': lineColor,
          maskImage: `linear-gradient(to top, #000 ${Math.round(edge * 0.4)}px, transparent ${Math.round(edge)}px)`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <canvas
        ref={ref}
        data-slot="retro-grid-canvas"
        className="absolute inset-0 size-full"
        style={{ color: 'var(--retro-grid-line)' }}
      />
    </div>
  )
}

export { RetroGrid }
