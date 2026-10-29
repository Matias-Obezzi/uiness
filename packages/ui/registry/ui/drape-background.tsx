'use client'

import * as React from 'react'
import { noise2, useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

const COLS = 28
const ROWS = 16
/** Constraint passes per frame: more is stiffer cloth. */
const PASSES = 3

type Point = { x: number; y: number; px: number; py: number }

export interface DrapeBackgroundProps extends React.ComponentProps<'div'> {
  /** Any CSS colour for the cloth. Default the primary colour. */
  color?: string
}

/**
 * A pleated curtain hanging in a breeze: a small cloth simulation, pinned along the top, that
 * sways in the wind and is pushed aside by the pointer. Each pleat is shaded by how it faces
 * the light. Put content over it as children.
 */
function DrapeBackground({ color, className, children, style, ...props }: DrapeBackgroundProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const cloth = React.useRef<{ points: Point[]; rest: number; w: number; h: number } | null>(null)

  useCanvas(canvas, ({ ctx, width, height, time, pointer, resized, reduced }) => {
    // The cloth runs past every edge but the top, so a sway never shows a gap.
    const rowGap = (height * 1.15) / (ROWS - 1)
    if (resized || !cloth.current) {
      const rest = width / (COLS - 5)
      const points: Point[] = []
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const x = (c - 2) * rest
          const y = r * rowGap
          points.push({ x, y, px: x, py: y })
        }
      cloth.current = { points, rest, w: width, h: height }
    }
    const { points, rest } = cloth.current
    const t = time / 1000
    // Verlet: carry on, plus gravity, wind and the pointer's push.
    if (!reduced)
      for (let i = COLS; i < points.length; i++) {
        const p = points[i] as Point
        const vx = (p.x - p.px) * 0.97
        const vy = (p.y - p.py) * 0.97
        p.px = p.x
        p.py = p.y
        let ax = noise2(p.y * 0.01 + t * 0.4, i * 0.05) * 0.06
        let ay = 0.18
        if (pointer) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const d = Math.hypot(dx, dy) || 1
          if (d < 110) {
            ax += (dx / d) * (1 - d / 110) * 2.2 + pointer.dx * 0.05
            ay += (dy / d) * (1 - d / 110) * 0.6
          }
        }
        p.x += vx + ax
        p.y += vy + ay
      }
    // Keep neighbours at their rest length; the top row stays pinned.
    const keep = (a: Point, b: Point, length: number, pinA: boolean) => {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1
      const diff = (d - length) / d
      if (pinA) {
        b.x -= dx * diff
        b.y -= dy * diff
      } else {
        a.x += dx * diff * 0.5
        a.y += dy * diff * 0.5
        b.x -= dx * diff * 0.5
        b.y -= dy * diff * 0.5
      }
    }
    for (let pass = 0; pass < PASSES; pass++)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c
          const p = points[i] as Point
          if (c < COLS - 1 && r > 0) keep(p, points[i + 1] as Point, rest, false)
          if (r < ROWS - 1) keep(p, points[i + COLS] as Point, rowGap, r === 0)
        }

    ctx.clearRect(0, 0, width, height)
    const base = color ?? getComputedStyle(ctx.canvas).color
    const mid = Math.floor(ROWS / 2) * COLS
    // How lit a column's edge is: a pleat every few columns, then how far the wind leans it,
    // with the light from the upper left. As a white or black film over the cloth.
    const shade = (c: number) => {
      const top = points[c] as Point
      const bottom = points[(ROWS - 1) * COLS + c] as Point
      const pleat = Math.sin((c / (COLS - 1)) * Math.PI * 9)
      const lean = (bottom.x - top.x) / (rowGap * ROWS)
      const light = Math.max(0, Math.min(1, 0.55 + pleat * 0.28 - lean * 0.8)) - 0.55
      return light > 0 ? `rgb(255 255 255 / ${light * 0.9})` : `rgb(0 0 0 / ${-light * 0.9})`
    }
    // One strip per column, down its left edge and up its right, shaded smoothly across.
    for (let c = 0; c < COLS - 1; c++) {
      ctx.beginPath()
      for (let r = 0; r < ROWS; r++) {
        const p = points[r * COLS + c] as Point
        ctx.lineTo(p.x, p.y)
      }
      for (let r = ROWS - 1; r >= 0; r--) {
        const p = points[r * COLS + c + 1] as Point
        ctx.lineTo(p.x + 0.6, p.y)
      }
      ctx.closePath()
      ctx.fillStyle = base
      ctx.fill()
      const left = points[mid + c] as Point
      const right = points[mid + c + 1] as Point
      const film = ctx.createLinearGradient(left.x, 0, right.x, 0)
      film.addColorStop(0, shade(c))
      film.addColorStop(1, shade(c + 1))
      ctx.fillStyle = film
      ctx.fill()
    }
  })

  return (
    <div
      data-slot="drape-background"
      className={cn('relative isolate overflow-hidden', className)}
      style={style}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-primary" />
      {children}
    </div>
  )
}

export { DrapeBackground }
