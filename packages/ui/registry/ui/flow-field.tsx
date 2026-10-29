'use client'

import * as React from 'react'
import { noise2, useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

export interface FlowFieldProps extends React.ComponentProps<'div'> {
  /** Particles drawing the streamlines. Default 700. */
  particles?: number
}

type Particle = { x: number; y: number; vx: number; vy: number; age: number }

/**
 * Streamlines drifting through a slowly changing field: they part around the pointer, swirl in
 * its wake, and scatter from a press. Put content over it as children.
 */
function FlowField({ particles = 700, className, children, ...props }: FlowFieldProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const swarm = React.useRef<Particle[]>([])

  useCanvas(canvas, ({ ctx, width, height, time, pointer, presses, resized, reduced }) => {
    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      age: Math.random() * 200,
    })
    if (resized || swarm.current.length !== particles)
      swarm.current = Array.from({ length: particles }, spawn)
    // Trails fade by erasing a little of the last frame each time.
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = reduced ? 'rgb(0 0 0 / 1)' : 'rgb(0 0 0 / 0.07)'
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = getComputedStyle(ctx.canvas).color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.45
    const t = time / 6000
    ctx.beginPath()
    for (const p of swarm.current) {
      const angle = noise2(p.x * 0.004 + t, p.y * 0.004 - t) * Math.PI * 2
      let ax = Math.cos(angle) * 0.35
      let ay = Math.sin(angle) * 0.35
      if (pointer) {
        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const d = Math.hypot(dx, dy) || 1
        if (d < 140) {
          const near = 1 - d / 140
          // Around the pointer: pushed off it and turned along it, more so when it moves.
          ax +=
            (dx / d) * near * 1.2 +
            (-dy / d) * near * Math.min(2, Math.hypot(pointer.dx, pointer.dy) * 0.08)
          ay +=
            (dy / d) * near * 1.2 +
            (dx / d) * near * Math.min(2, Math.hypot(pointer.dx, pointer.dy) * 0.08)
        }
      }
      for (const press of presses) {
        const dx = p.x - press.x
        const dy = p.y - press.y
        const d = Math.hypot(dx, dy) || 1
        if (d < 220) {
          p.vx += (dx / d) * (1 - d / 220) * 9
          p.vy += (dy / d) * (1 - d / 220) * 9
        }
      }
      p.vx = (p.vx + ax) * 0.9
      p.vy = (p.vy + ay) * 0.9
      const x = p.x
      const y = p.y
      p.x += p.vx
      p.y += p.vy
      p.age++
      if (p.x < 0 || p.y < 0 || p.x > width || p.y > height || p.age > 400)
        Object.assign(p, spawn(), { age: 0 })
      else {
        ctx.moveTo(x, y)
        ctx.lineTo(p.x, p.y)
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  })

  return (
    <div
      data-slot="flow-field"
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-foreground" />
      {children}
    </div>
  )
}

export { FlowField }
