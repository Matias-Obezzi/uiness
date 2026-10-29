'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

/** The light is worked out on a grid this many times smaller, then smoothed up. */
const SCALE = 5

export interface CausticsBackgroundProps extends React.ComponentProps<'div'> {
  /** The water's colour, as `[r, g, b]`. Default a pool blue. */
  tint?: [number, number, number]
}

/**
 * A hero on the floor of a pool: bright caustics ripple across it, a press drops rings that bend
 * the light as they spread, and text inside casts a shadow that wobbles with the water, through
 * the `--caustics-shadow` it sets. Put content over it as children.
 */
function CausticsBackground({
  tint = [24, 120, 180],
  className,
  children,
  ...props
}: CausticsBackgroundProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const box = React.useRef<HTMLDivElement>(null)
  const small = React.useRef<HTMLCanvasElement | null>(null)
  const rings = React.useRef<{ x: number; y: number; t: number }[]>([])

  useCanvas(canvas, ({ ctx, width, height, time, presses }) => {
    const t = time / 1000
    for (const p of presses) rings.current.push({ ...p, t })
    rings.current = rings.current.filter((r) => t - r.t < 4)
    const w = Math.max(1, Math.ceil(width / SCALE))
    const h = Math.max(1, Math.ceil(height / SCALE))
    small.current ??= document.createElement('canvas')
    const off = small.current
    if (off.width !== w || off.height !== h) {
      off.width = w
      off.height = h
    }
    const c = off.getContext('2d')
    if (!c) return
    const img = c.createImageData(w, h)
    const [tr, tg, tb] = tint
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let px = x * SCALE
        let py = y * SCALE
        // Rings push the light outward as they pass.
        for (const r of rings.current) {
          const age = t - r.t
          const dx = px - r.x
          const dy = py - r.y
          const d = Math.hypot(dx, dy) || 1
          const k =
            Math.sin((d - age * 180) * 0.06) *
            Math.exp(-((d - age * 180) ** 2) / 3000) *
            14 *
            (1 - age / 4)
          px += (dx / d) * k
          py += (dy / d) * k
        }
        // Three crossing waves; where their crests meet, the light gathers into bright lines.
        const a = Math.sin(px * 0.021 + t * 1.1 + Math.sin(py * 0.017 + t * 0.7) * 1.7)
        const b = Math.sin(py * 0.023 - t * 0.9 + Math.sin(px * 0.013 - t * 0.5) * 1.9)
        const e = Math.sin((px + py) * 0.015 + t * 0.6)
        const light = Math.max(0, 1 - Math.abs(a + b + e) * 0.9) ** 3
        const i = (y * w + x) * 4
        img.data[i] = tr + (255 - tr) * light * 0.85
        img.data[i + 1] = tg + (255 - tg) * light * 0.9
        img.data[i + 2] = tb + (255 - tb) * light
        img.data[i + 3] = 255
      }
    c.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(off, 0, 0, width, height)
    // The shadow of text over the water wobbles with it.
    const sx = Math.sin(t * 1.3) * 3 + 6
    const sy = Math.cos(t * 1.1) * 3 + 10
    box.current?.style.setProperty(
      '--caustics-shadow',
      `${sx.toFixed(1)}px ${sy.toFixed(1)}px 6px rgb(0 30 60 / 0.35)`,
    )
  })

  return (
    <div
      ref={box}
      data-slot="caustics-background"
      className={cn(
        'relative isolate overflow-hidden text-white [text-shadow:var(--caustics-shadow)]',
        className,
      )}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full" />
      {children}
    </div>
  )
}

export { CausticsBackground }
