'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

type Drop = { x: number; y: number; r: number; vy: number }

const MAX_DROPS = 70

export interface RainGlassBackgroundProps extends React.ComponentProps<'div'> {
  /** The view through the window. Same origin. */
  src: string
}

/**
 * A hero seen through a rainy window. The view is fogged; drops gather on the glass, each a
 * little lens that shows the view upside down and sharp, and once heavy enough they run down,
 * clearing a trail. Drag across the glass to wipe the fog away; it slowly comes back. Put
 * content over it as children.
 */
function RainGlassBackground({ src, className, children, ...props }: RainGlassBackgroundProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const image = React.useRef<HTMLImageElement | null>(null)
  const layers = React.useRef<{
    sharp: HTMLCanvasElement
    fog: HTMLCanvasElement
    mask: HTMLCanvasElement
    /** Where the fog is masked each frame, kept to draw into again. */
    work: HTMLCanvasElement
    w: number
    h: number
  } | null>(null)
  const drops = React.useRef<Drop[]>([])
  const [loaded, setLoaded] = React.useState(0)

  React.useEffect(() => {
    const img = new Image()
    img.onload = () => {
      image.current = img
      layers.current = null
      setLoaded((n) => n + 1)
    }
    img.src = src
  }, [src])

  useCanvas(
    canvas,
    ({ ctx, width, height, pointer, reduced }) => {
      const img = image.current
      if (!img) return
      const w = Math.round(width)
      const h = Math.round(height)
      if (!layers.current || layers.current.w !== w || layers.current.h !== h) {
        const make = () => Object.assign(document.createElement('canvas'), { width: w, height: h })
        const sharp = make()
        const fog = make()
        const mask = make()
        const scale = Math.max(w / img.width, h / img.height)
        const cover = (c: CanvasRenderingContext2D) =>
          c.drawImage(
            img,
            (w - img.width * scale) / 2,
            (h - img.height * scale) / 2,
            img.width * scale,
            img.height * scale,
          )
        cover(sharp.getContext('2d') as CanvasRenderingContext2D)
        const f = fog.getContext('2d') as CanvasRenderingContext2D
        f.filter = 'blur(14px) brightness(1.08) saturate(0.7)'
        cover(f)
        f.filter = 'none'
        f.fillStyle = 'rgb(220 228 235 / 0.28)'
        f.fillRect(0, 0, w, h)
        const m = mask.getContext('2d') as CanvasRenderingContext2D
        m.fillStyle = '#000'
        m.fillRect(0, 0, w, h)
        layers.current = { sharp, fog, mask, work: make(), w, h }
        drops.current = []
      }
      const { sharp, fog, mask, work } = layers.current
      const m = mask.getContext('2d') as CanvasRenderingContext2D
      // The fog comes back, a little each frame.
      m.globalCompositeOperation = 'source-over'
      m.fillStyle = 'rgb(0 0 0 / 0.006)'
      m.fillRect(0, 0, w, h)
      m.globalCompositeOperation = 'destination-out'
      m.fillStyle = '#000'
      const clear = (x: number, y: number, r: number) => {
        m.beginPath()
        m.arc(x, y, r, 0, Math.PI * 2)
        m.fill()
      }
      if (pointer?.down) clear(pointer.x, pointer.y, 34)

      if (!reduced) {
        if (drops.current.length < MAX_DROPS && Math.random() < 0.5)
          drops.current.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1.5 + Math.random() * 3,
            vy: 0,
          })
        for (const d of drops.current) {
          d.r += 0.01
          // Heavy drops run, faster as they go, wiping a trail.
          if (d.r > 5.5) {
            d.vy = Math.min(9, d.vy + 0.12)
            d.y += d.vy
            d.x += Math.sin(d.y * 0.05) * 0.3
            clear(d.x, d.y - d.r, d.r * 0.7)
          }
        }
        // Drops that touch merge into the bigger one.
        const list = drops.current
        for (let i = 0; i < list.length; i++)
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i] as Drop
            const b = list[j] as Drop
            if (a.r > 0 && b.r > 0 && Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) {
              const [big, small] = a.r >= b.r ? [a, b] : [b, a]
              big.r = Math.min(12, Math.hypot(big.r, small.r))
              small.r = 0
            }
          }
        drops.current = list.filter((d) => d.r > 0 && d.y < h + 20)
      }

      // The sharp view, the fog over it where the mask still holds, then the drops.
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(sharp, 0, 0)
      const l = work.getContext('2d') as CanvasRenderingContext2D
      l.globalCompositeOperation = 'source-over'
      l.clearRect(0, 0, w, h)
      l.drawImage(fog, 0, 0)
      l.globalCompositeOperation = 'destination-in'
      l.drawImage(mask, 0, 0)
      ctx.drawImage(work, 0, 0)
      for (const d of drops.current) {
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(d.x, d.y, d.r, d.r * 1.15, 0, 0, Math.PI * 2)
        ctx.clip()
        // A lens: the view behind it, flipped and drawn small.
        ctx.translate(d.x, d.y)
        ctx.scale(1, -1)
        const span = Math.min(d.r * 9, w / 2, h / 2)
        ctx.drawImage(
          sharp,
          Math.max(0, Math.min(w - span * 2, d.x - span)),
          Math.max(0, Math.min(h - span * 2, d.y - span)),
          span * 2,
          span * 2,
          -d.r,
          -d.r * 1.15,
          d.r * 2,
          d.r * 2.3,
        )
        ctx.restore()
        ctx.beginPath()
        ctx.ellipse(d.x, d.y, d.r, d.r * 1.15, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgb(0 0 0 / 0.25)'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.fillStyle = 'rgb(255 255 255 / 0.6)'
        ctx.beginPath()
        ctx.arc(d.x - d.r * 0.35, d.y - d.r * 0.45, d.r * 0.22, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    { version: loaded },
  )

  return (
    <div
      data-slot="rain-glass-background"
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full touch-pan-y" />
      {children}
    </div>
  )
}

export { RainGlassBackground }
