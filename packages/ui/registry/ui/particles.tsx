'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface ParticlesProps extends React.ComponentProps<'canvas'> {
  /** Total number of particles in the field. Default 100. */
  quantity?: number
  /** Particle radius in pixels, or a [min, max] range. Default [1, 2]. */
  size?: number | [number, number]
  /** Any CSS color for particles and lines. Default the foreground color. */
  color?: string
  /** Horizontal drift velocity multiplier. Default 0.5. */
  vx?: number
  /** Vertical drift velocity multiplier. Default 0.5. */
  vy?: number
  /** Pointer reaction mode: attract, repel, or none. Default 'none'. */
  mode?: 'attract' | 'repel' | 'none'
  /** Resistance against pointer movement (higher means less displacement). Default 50. */
  staticity?: number
  /** Speed of settling after pointer interaction. Default 50. */
  ease?: number
  /** Maximum pixel distance for connecting lines between close particles. 0 turns connections off. Default 0. */
  connect?: number
}

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
}

/**
 * A canvas particle field that drifts and reacts to the pointer.
 * Pauses drawing when off-screen or in background tabs, and renders a single
 * static frame when prefers-reduced-motion is enabled.
 */
function Particles({
  quantity = 100,
  size = [1, 2],
  color = 'var(--foreground)',
  vx = 0.5,
  vy = 0.5,
  mode = 'none',
  staticity = 50,
  ease = 50,
  connect = 0,
  className,
  ...props
}: ParticlesProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()
  const [minR, maxR] = Array.isArray(size) ? size : [size, size]

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
    const mouse = { x: -1000, y: -1000 }

    const init = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = Array.from({ length: quantity }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: minR + Math.random() * (maxR - minR),
        vx: (Math.random() - 0.5) * vx * 1.5,
        vy: (Math.random() - 0.5) * vy * 1.5,
        alpha: 0.2 + Math.random() * 0.7,
      }))
    }

    const drawConnections = (resolvedColor: string) => {
      if (connect <= 0 || particles.length === 0) return
      const cellSize = connect
      const cols = Math.max(1, Math.ceil(width / cellSize))
      const rows = Math.max(1, Math.ceil(height / cellSize))
      const grid: number[][] = Array.from({ length: cols * rows }, () => [])

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!p) continue
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / cellSize)))
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / cellSize)))
        const cell = grid[cy * cols + cx]
        if (cell) cell.push(i)
      }

      const connectSq = connect * connect
      const drawLine = (p1: Particle, p2: Particle) => {
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const d2 = dx * dx + dy * dy
        if (d2 < connectSq) {
          const dist = Math.sqrt(d2)
          const lineAlpha = (1 - dist / connect) * 0.25
          ctx.strokeStyle = resolvedColor
          ctx.globalAlpha = lineAlpha
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }

      const neighborOffsets: readonly (readonly [number, number])[] = [
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ]

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const cell = grid[cy * cols + cx]
          if (!cell) continue

          for (let i = 0; i < cell.length; i++) {
            const idx1 = cell[i]
            if (idx1 === undefined) continue
            const p1 = particles[idx1]
            if (!p1) continue
            for (let j = i + 1; j < cell.length; j++) {
              const idx2 = cell[j]
              if (idx2 === undefined) continue
              const p2 = particles[idx2]
              if (!p2) continue
              drawLine(p1, p2)
            }
          }

          for (const [ox, oy] of neighborOffsets) {
            const ncx = cx + ox
            const ncy = cy + oy
            if (ncx >= 0 && ncx < cols && ncy >= 0 && ncy < rows) {
              const neighborCell = grid[ncy * cols + ncx]
              if (!neighborCell) continue
              for (const idx1 of cell) {
                const p1 = particles[idx1]
                if (!p1) continue
                for (const idx2 of neighborCell) {
                  const p2 = particles[idx2]
                  if (!p2) continue
                  drawLine(p1, p2)
                }
              }
            }
          }
        }
      }
    }

    const draw = (now: number) => {
      if (document.visibilityState === 'hidden') {
        frame = requestAnimationFrame(draw)
        return
      }

      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      ctx.clearRect(0, 0, width, height)
      const resolvedColor = getComputedStyle(canvas).color

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx * dt * 60
          p.y += p.vy * dt * 60

          if (mode !== 'none') {
            const dx = mouse.x - p.x
            const dy = mouse.y - p.y
            const dist = Math.hypot(dx, dy)
            if (dist < 120 && dist > 0) {
              const force = (120 - dist) / 120
              const dir = mode === 'repel' ? -1 : 1
              p.x += dir * (dx / dist) * force * (60 / Math.max(1, staticity))
              p.y += dir * (dy / dist) * force * (60 / Math.max(1, staticity))
            }
          }

          if (p.x < 0) p.x += width
          else if (p.x > width) p.x -= width
          if (p.y < 0) p.y += height
          else if (p.y > height) p.y -= height
        }

        ctx.fillStyle = resolvedColor
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      drawConnections(resolvedColor)
      ctx.globalAlpha = 1

      if (!reduced) {
        frame = requestAnimationFrame(draw)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (mode === 'none' || e.pointerType === 'touch') return
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const onPointerLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    init()
    draw(performance.now())

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    canvas.addEventListener('pointerleave', onPointerLeave)

    const ro = new ResizeObserver(() => {
      init()
      if (reduced) draw(performance.now())
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      ro.disconnect()
    }
  }, [inView, reduced, quantity, minR, maxR, vx, vy, mode, staticity, connect])

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="particles"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      style={{ color }}
      {...props}
    />
  )
}

export { Particles }
