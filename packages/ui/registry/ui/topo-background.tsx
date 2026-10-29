'use client'

import * as React from 'react'
import { noise2, useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

/** Pixels per cell of the height map. */
const CELL = 14
const LEVELS = 11

export interface TopoBackgroundProps extends React.ComponentProps<'div'> {}

/**
 * A living contour map: the land drifts slowly, rises in a hill under the pointer, and ripples
 * out from a press. Drawn with marching squares on a canvas; put content over it as children.
 */
function TopoBackground({ className, children, ...props }: TopoBackgroundProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const ripples = React.useRef<{ x: number; y: number; t: number }[]>([])
  const hill = React.useRef({ x: 0, y: 0, h: 0 })

  useCanvas(canvas, ({ ctx, width, height, time, pointer, presses }) => {
    const t = time / 1000
    for (const p of presses) ripples.current.push({ ...p, t })
    ripples.current = ripples.current.filter((r) => t - r.t < 3)
    if (pointer) Object.assign(hill.current, { x: pointer.x, y: pointer.y })
    hill.current.h += ((pointer ? 1 : 0) - hill.current.h) * 0.06

    const cols = Math.ceil(width / CELL) + 1
    const rows = Math.ceil(height / CELL) + 1
    const z = new Float32Array(cols * rows)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = c * CELL
        const y = r * CELL
        let v =
          noise2(x * 0.006 + t * 0.03, y * 0.006) * 0.6 +
          noise2(x * 0.015, y * 0.015 - t * 0.02) * 0.25
        const hx = x - hill.current.x
        const hy = y - hill.current.y
        v += hill.current.h * 0.9 * Math.exp(-(hx * hx + hy * hy) / 12000)
        for (const ripple of ripples.current) {
          const age = t - ripple.t
          const d = Math.hypot(x - ripple.x, y - ripple.y)
          v +=
            Math.sin((d - age * 220) * 0.05) *
            Math.exp(-((d - age * 220) ** 2) / 4000) *
            0.35 *
            (1 - age / 3)
        }
        z[r * cols + c] = v
      }

    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = getComputedStyle(ctx.canvas).color
    // Marching squares: each level's line through every cell it crosses.
    for (let level = 0; level < LEVELS; level++) {
      const iso = -0.9 + (level / (LEVELS - 1)) * 1.9
      ctx.globalAlpha = level % 5 === 0 ? 0.55 : 0.25
      ctx.lineWidth = level % 5 === 0 ? 1.2 : 0.8
      ctx.beginPath()
      for (let r = 0; r < rows - 1; r++)
        for (let c = 0; c < cols - 1; c++) {
          const a = z[r * cols + c] ?? 0
          const b = z[r * cols + c + 1] ?? 0
          const d = z[(r + 1) * cols + c] ?? 0
          const e = z[(r + 1) * cols + c + 1] ?? 0
          const x = c * CELL
          const y = r * CELL
          const lerp = (p: number, q: number) => (iso - p) / (q - p || 1e-6)
          const top = [x + lerp(a, b) * CELL, y] as const
          const right = [x + CELL, y + lerp(b, e) * CELL] as const
          const bottom = [x + lerp(d, e) * CELL, y + CELL] as const
          const left = [x, y + lerp(a, d) * CELL] as const
          const points: (readonly [number, number])[] = []
          if (a < iso !== b < iso) points.push(top)
          if (b < iso !== e < iso) points.push(right)
          if (d < iso !== e < iso) points.push(bottom)
          if (a < iso !== d < iso) points.push(left)
          for (let i = 0; i + 1 < points.length; i += 2) {
            ctx.moveTo(...(points[i] as [number, number]))
            ctx.lineTo(...(points[i + 1] as [number, number]))
          }
        }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })

  return (
    <div
      data-slot="topo-background"
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-foreground" />
      {children}
    </div>
  )
}

export { TopoBackground }
