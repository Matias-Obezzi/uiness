'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface WarpProps extends React.ComponentProps<'canvas'> {
  /** Stars in the field. Default 400. */
  stars?: number
  /** How fast they come, 1 being a calm cruise. Default 1. */
  speed?: number
  /** Any CSS color. Default the foreground color. */
  color?: string
  /** Speed while the pointer is pressed on the parent, for a jump to light speed. Default 8. */
  boost?: number
}

interface Star {
  x: number
  y: number
  z: number
}

const spawn = (star: Star, far = true) => {
  star.x = Math.random() * 2 - 1
  star.y = Math.random() * 2 - 1
  star.z = far ? 1 : Math.random()
}

/**
 * A star field flying at the viewer, each star drawn as a streak that grows as it nears. Press
 * on the area under it to jump to light speed. Drawn on a canvas: stops off screen and in
 * background tabs, and holds still with reduced motion.
 */
function Warp({
  stars = 400,
  speed = 1,
  color = 'var(--foreground)',
  boost = 8,
  className,
  style,
  ...props
}: WarpProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const inView = useInView(ref, { once: false, amount: 0 })
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !inView) return
    let width = 0
    let height = 0
    let frame = 0
    let last = performance.now()
    let current = speed
    let target = speed
    const field: Star[] = Array.from({ length: stars }, () => {
      const star = { x: 0, y: 0, z: 0 }
      spawn(star, false)
      return star
    })

    const size = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const project = (star: Star, z: number) => {
      const scale = Math.max(width, height) / 2
      return [width / 2 + (star.x / z) * scale, height / 2 + (star.y / z) * scale] as const
    }

    const paint = (dz: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = getComputedStyle(canvas).color
      ctx.lineCap = 'round'
      for (const star of field) {
        const z = Math.max(star.z, 0.001)
        const [x, y] = project(star, z)
        // The streak runs back to where the star was a moment ago, longer the faster it goes.
        const [px, py] = project(star, Math.min(1, z + Math.max(dz * 4, 0.004)))
        const near = 1 - z
        ctx.globalAlpha = Math.min(1, near * 1.5)
        ctx.lineWidth = Math.max(0.5, near * 2.2)
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (document.visibilityState === 'hidden') return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      current += (target - current) * Math.min(1, dt * 3)
      const dz = current * 0.25 * dt
      for (const star of field) {
        star.z -= dz
        const [x, y] = project(star, Math.max(star.z, 0.001))
        if (star.z <= 0.01 || x < 0 || x > width || y < 0 || y > height) spawn(star)
      }
      paint(dz)
    }

    const press = () => {
      target = speed * boost
    }
    const release = () => {
      target = speed
    }
    const host = canvas.parentElement
    host?.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)

    size()
    paint(0)
    if (!reduced) frame = requestAnimationFrame(tick)
    const resize = new ResizeObserver(() => {
      size()
      paint(0)
    })
    resize.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      host?.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [inView, reduced, stars, speed, boost])

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="warp"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      style={{ color, ...style }}
      {...props}
    />
  )
}

export { Warp }
