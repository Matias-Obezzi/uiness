'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

/** Pixels between dots, and inside the loupe. */
const CELL = 10
const FINE = 4
const LOUPE = 90

export interface HalftoneBackgroundProps extends React.ComponentProps<'div'> {
  /** An image to print; leave out for a lit sphere. Same origin, so its pixels can be read. */
  src?: string
}

/**
 * Any image, or a lit sphere, printed as a halftone dot screen in the text colour: darker
 * places get bigger dots. Under the pointer a loupe looks closer, with a finer screen. Put
 * content over it as children.
 */
function HalftoneBackground({ src, className, children, ...props }: HalftoneBackgroundProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const image = React.useRef<HTMLImageElement | null>(null)
  // Darkness, from 0 to 1, of every pixel of the box, read once per size.
  const tone = React.useRef<{ w: number; h: number; dark: Float32Array } | null>(null)
  const [loaded, setLoaded] = React.useState(0)

  React.useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      image.current = img
      tone.current = null
      setLoaded((n) => n + 1)
    }
    img.src = src
  }, [src])

  const sample = (w: number, h: number) => {
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const c = off.getContext('2d', { willReadFrequently: true })
    if (!c) return null
    const img = image.current
    if (src && img) {
      // Covering the box, like object-fit: cover.
      const scale = Math.max(w / img.width, h / img.height)
      c.drawImage(
        img,
        (w - img.width * scale) / 2,
        (h - img.height * scale) / 2,
        img.width * scale,
        img.height * scale,
      )
    } else {
      const r = Math.min(w, h) * 0.38
      const g = c.createRadialGradient(w / 2 - r * 0.4, h / 2 - r * 0.45, r * 0.05, w / 2, h / 2, r)
      g.addColorStop(0, '#fff')
      g.addColorStop(0.7, '#555')
      g.addColorStop(1, '#111')
      c.fillStyle = '#fff'
      c.fillRect(0, 0, w, h)
      c.fillStyle = g
      c.beginPath()
      c.arc(w / 2, h / 2, r, 0, Math.PI * 2)
      c.fill()
    }
    const data = c.getImageData(0, 0, w, h).data
    const dark = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++)
      dark[i] =
        1 -
        (0.299 * (data[i * 4] ?? 0) +
          0.587 * (data[i * 4 + 1] ?? 0) +
          0.114 * (data[i * 4 + 2] ?? 0)) /
          255
    return { w, h, dark }
  }

  useCanvas(
    canvas,
    ({ ctx, width, height, pointer }) => {
      const w = Math.round(width)
      const h = Math.round(height)
      if (!tone.current || tone.current.w !== w || tone.current.h !== h) tone.current = sample(w, h)
      const t = tone.current
      if (!t) return
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = getComputedStyle(ctx.canvas).color
      const dots = (step: number, inside: (x: number, y: number) => boolean) => {
        ctx.beginPath()
        for (let y = step / 2; y < h; y += step)
          for (let x = step / 2 + ((y / step) % 2) * (step / 2); x < w; x += step) {
            if (!inside(x, y)) continue
            const d = t.dark[Math.floor(y) * w + Math.floor(x)] ?? 0
            const r = Math.sqrt(d) * step * 0.55
            if (r < 0.3) continue
            ctx.moveTo(x + r, y)
            ctx.arc(x, y, r, 0, Math.PI * 2)
          }
        ctx.fill()
      }
      const near = (x: number, y: number) =>
        !!pointer && Math.hypot(x - pointer.x, y - pointer.y) < LOUPE
      dots(CELL, (x, y) => !near(x, y))
      if (pointer) {
        dots(FINE, near)
        ctx.globalAlpha = 0.35
        ctx.strokeStyle = ctx.fillStyle
        ctx.beginPath()
        ctx.arc(pointer.x, pointer.y, LOUPE, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    },
    // It only changes with the pointer or the size.
    { animate: false, version: loaded },
  )

  return (
    <div
      data-slot="halftone-background"
      data-loaded={loaded || undefined}
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-foreground" />
      {children}
    </div>
  )
}

export { HalftoneBackground }
