'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

/** Pixels between dots. */
const GAP = 16

export interface DotFieldProps extends React.ComponentProps<'div'> {}

/**
 * A membrane of halftone dots: a swipe leaves ripples behind it, a press rings out from where it
 * landed, and the dots swell and fade with the waves passing through. Put content over it as
 * children.
 */
function DotField({ className, children, ...props }: DotFieldProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  // The membrane: a height and a speed per dot, on a grid that follows the size.
  const field = React.useRef({ cols: 0, rows: 0, h: new Float32Array(0), v: new Float32Array(0) })

  useCanvas(canvas, ({ ctx, width, height, pointer, presses, resized }) => {
    const f = field.current
    if (resized) {
      f.cols = Math.ceil(width / GAP) + 1
      f.rows = Math.ceil(height / GAP) + 1
      f.h = new Float32Array(f.cols * f.rows)
      f.v = new Float32Array(f.cols * f.rows)
    }
    const { cols, rows, h, v } = f
    const poke = (x: number, y: number, amount: number, radius: number) => {
      const ci = Math.round(x / GAP)
      const ri = Math.round(y / GAP)
      for (let r = ri - radius; r <= ri + radius; r++)
        for (let c = ci - radius; c <= ci + radius; c++) {
          if (r < 1 || c < 1 || r >= rows - 1 || c >= cols - 1) continue
          const d = Math.hypot(r - ri, c - ci)
          if (d <= radius)
            h[r * cols + c] = (h[r * cols + c] ?? 0) + amount * (1 - d / (radius + 1))
        }
    }
    if (pointer && (pointer.dx || pointer.dy))
      poke(pointer.x, pointer.y, Math.min(1.2, Math.hypot(pointer.dx, pointer.dy) / 18), 1)
    for (const p of presses) poke(p.x, p.y, 4, 2)
    // The wave equation, damped: each dot pulled toward its neighbours' mean.
    for (let r = 1; r < rows - 1; r++)
      for (let c = 1; c < cols - 1; c++) {
        const i = r * cols + c
        const lap =
          (h[i - 1] ?? 0) +
          (h[i + 1] ?? 0) +
          (h[i - cols] ?? 0) +
          (h[i + cols] ?? 0) -
          4 * (h[i] ?? 0)
        v[i] = ((v[i] ?? 0) + lap * 0.22) * 0.985
      }
    for (let i = 0; i < h.length; i++) h[i] = ((h[i] ?? 0) + (v[i] ?? 0)) * 0.995

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = getComputedStyle(ctx.canvas).color
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const wave = h[r * cols + c] ?? 0
        const radius = Math.max(0.4, 1.3 + wave * 2.2)
        ctx.globalAlpha = Math.min(1, 0.22 + Math.abs(wave) * 0.6)
        ctx.beginPath()
        ctx.arc(c * GAP, r * GAP + wave * 2, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    ctx.globalAlpha = 1
  })

  return (
    <div
      data-slot="dot-field"
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-foreground" />
      {children}
    </div>
  )
}

export { DotField }
