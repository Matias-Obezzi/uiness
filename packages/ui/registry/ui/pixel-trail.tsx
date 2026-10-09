'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface PixelTrailProps extends React.ComponentProps<'canvas'> {
  /** Side of each pixel, in pixels. Default 16. */
  pixelSize?: number
  /** Milliseconds a pixel takes to fade out. Default 600. */
  fade?: number
  /** Any CSS color. Default the primary color. */
  color?: string
}

/**
 * The pointer leaves a trail of square pixels over its parent that fade away behind it. Put it
 * inside a positioned element; it follows the pointer there without taking clicks. It only
 * draws while something is fading, and not at all with reduced motion.
 */
function PixelTrail({
  pixelSize = 16,
  fade = 600,
  color = 'var(--primary)',
  className,
  style,
  ...props
}: PixelTrailProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const canvas = ref.current
    const host = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !host || !ctx || reduced) return
    // Pixels still showing, by cell, with how much of them is left.
    const lit = new Map<string, number>()
    let frame = 0
    let last = 0
    let from: { x: number; y: number } | null = null

    const size = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const tick = (now: number) => {
      const dt = last ? now - last : 16
      last = now
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = getComputedStyle(canvas).color
      for (const [key, left] of lit) {
        const next = left - dt / fade
        if (next <= 0) {
          lit.delete(key)
          continue
        }
        lit.set(key, next)
        const [cx = 0, cy = 0] = key.split(',').map(Number)
        ctx.globalAlpha = next
        ctx.fillRect(cx * pixelSize, cy * pixelSize, pixelSize, pixelSize)
      }
      ctx.globalAlpha = 1
      // Asleep until the pointer moves again.
      frame = lit.size ? requestAnimationFrame(tick) : 0
      if (!frame) last = 0
    }

    const light = (x: number, y: number) => {
      lit.set(`${Math.floor(x / pixelSize)},${Math.floor(y / pixelSize)}`, 1)
    }

    const move = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const to = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      // A fast pointer skips cells between two events: fill them in along the way.
      if (from) {
        const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (pixelSize / 2))
        for (let s = 1; s <= steps; s++) {
          light(from.x + ((to.x - from.x) * s) / steps, from.y + ((to.y - from.y) * s) / steps)
        }
      }
      light(to.x, to.y)
      from = to
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const leave = () => {
      from = null
    }

    size()
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    const resize = new ResizeObserver(size)
    resize.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      resize.disconnect()
    }
  }, [reduced, pixelSize, fade])

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="pixel-trail"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      style={{ color, ...style }}
      {...props}
    />
  )
}

export { PixelTrail }
